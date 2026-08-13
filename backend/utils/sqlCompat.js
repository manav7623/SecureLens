const { Op } = require('sequelize');

/**
 * Translates MongoDB queries/operators into Sequelize format.
 */
function translateMongoQuery(mongoQuery, model) {
  if (!mongoQuery || typeof mongoQuery !== 'object') return mongoQuery;

  if (Array.isArray(mongoQuery)) {
    return mongoQuery.map(q => translateMongoQuery(q, model));
  }

  const sequelizeQuery = {};

  for (let [key, value] of Object.entries(mongoQuery)) {
    // Map association names to foreign keys in Sequelize
    if (model && model.associations && model.associations[key]) {
      key = model.associations[key].foreignKey || key;
    }

    if (key === '_id') {
      sequelizeQuery['id'] = value;
    } else if ((key === 'platforms' || key === 'niche' || key.endsWith('.platforms') || key.endsWith('.niche')) && value && typeof value === 'object' && value.$in) {
      const values = Array.isArray(value.$in) ? value.$in : [value.$in];
      const orConditions = [];
      const seq = model ? model.sequelize : null;
      if (seq) {
        for (const val of values) {
          const lower = val.toLowerCase();
          const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
          orConditions.push(
            seq.where(seq.cast(seq.col(key), 'CHAR'), Op.like, `%"${lower}"%`),
            seq.where(seq.cast(seq.col(key), 'CHAR'), Op.like, `%"${capitalized}"%`)
          );
        }
        sequelizeQuery[Op.or] = orConditions;
      } else {
        for (const val of values) {
          const lower = val.toLowerCase();
          const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
          orConditions.push(
            { [Op.like]: `%"${lower}"%` },
            { [Op.like]: `%"${capitalized}"%` }
          );
        }
        sequelizeQuery[key] = { [Op.or]: orConditions };
      }
    } else if (key === '$ne') {
      sequelizeQuery[Op.ne] = translateMongoQuery(value, model);
    } else if (key === '$in') {
      sequelizeQuery[Op.in] = translateMongoQuery(value, model);
    } else if (key === '$nin') {
      sequelizeQuery[Op.notIn] = translateMongoQuery(value, model);
    } else if (key === '$gt') {
      sequelizeQuery[Op.gt] = translateMongoQuery(value, model);
    } else if (key === '$lt') {
      sequelizeQuery[Op.lt] = translateMongoQuery(value, model);
    } else if (key === '$gte') {
      sequelizeQuery[Op.gte] = translateMongoQuery(value, model);
    } else if (key === '$lte') {
      sequelizeQuery[Op.lte] = translateMongoQuery(value, model);
    } else if (key === '$regex') {
      sequelizeQuery[Op.like] = `%${value}%`;
    } else if (key === '$options') {
      continue;
    } else if (key === '$or') {
      sequelizeQuery[Op.or] = translateMongoQuery(value, model);
    } else if (key === '$and') {
      sequelizeQuery[Op.and] = translateMongoQuery(value, model);
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sequelizeQuery[key] = translateMongoQuery(value, model);
    } else {
      sequelizeQuery[key] = value;
    }
  }

  return sequelizeQuery;
}

/**
 * Helper to build Sequelize include options from MongoDB-style populate configuration.
 */
function buildIncludeOption(model, populateObj) {
  if (!populateObj) return null;

  let associationName;
  let select;
  let nestedPopulate;

  if (typeof populateObj === 'string') {
    associationName = populateObj;
  } else if (typeof populateObj === 'object' && populateObj !== null) {
    associationName = populateObj.path;
    select = populateObj.select;
    nestedPopulate = populateObj.populate;
  } else {
    return null;
  }

  const association = model.associations[associationName];
  if (!association) return null;

  const includeOpt = {
    model: association.target,
    as: associationName,
    required: false
  };

  if (select) {
    if (typeof select === 'string') {
      const fields = select.split(' ').filter(Boolean);
      const excludes = fields.filter(f => f.startsWith('-')).map(f => f.slice(1));
      const includes = fields.filter(f => !f.startsWith('-'));

      if (excludes.length > 0) {
        includeOpt.attributes = { exclude: excludes };
      } else if (includes.length > 0) {
        const attr = includes.map(f => f === '_id' ? 'id' : f);
        if (!attr.includes('id') && !excludes.includes('id')) {
          attr.push('id');
        }
        includeOpt.attributes = attr;
      }
    } else if (Array.isArray(select)) {
      const attr = select.map(f => f === '_id' ? 'id' : f);
      if (!attr.includes('id')) {
        attr.push('id');
      }
      includeOpt.attributes = attr;
    }
  }

  if (nestedPopulate) {
    const targetModel = association.target;
    includeOpt.include = [];
    const nestedItems = Array.isArray(nestedPopulate) ? nestedPopulate : [nestedPopulate];
    for (const item of nestedItems) {
      const nestedOpt = buildIncludeOption(targetModel, item);
      if (nestedOpt) {
        includeOpt.include.push(nestedOpt);
      }
    }
  }

  return includeOpt;
}

/**
 * Helper to safely set nested fields in JSON objects on a Sequelize model instance.
 */
function setNestedPath(doc, path, value, operation = 'set') {
  if (!path.includes('.')) {
    if (operation === 'set') {
      doc[path] = value;
    } else if (operation === 'inc') {
      doc[path] = (Number(doc[path]) || 0) + Number(value);
    } else if (operation === 'push') {
      let arr = doc[path];
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch (e) { arr = []; }
      }
      if (!Array.isArray(arr)) arr = [];
      if (value && typeof value === 'object' && value.$each) {
        arr.push(...value.$each);
      } else {
        arr.push(value);
      }
      doc[path] = arr;
    }
    return;
  }

  const parts = path.split('.');
  const rootKey = parts[0];
  let rootValue = doc[rootKey];
  if (typeof rootValue === 'string') {
    try { rootValue = JSON.parse(rootValue); } catch (e) { rootValue = {}; }
  }
  if (!rootValue || typeof rootValue !== 'object') {
    rootValue = {};
  }

  let obj = rootValue;
  for (let i = 1; i < parts.length - 1; i++) {
    const part = parts[i];
    if (obj[part] === undefined || obj[part] === null) {
      obj[part] = {};
    } else if (typeof obj[part] === 'string') {
      try { obj[part] = JSON.parse(obj[part]); } catch (e) { obj[part] = {}; }
    }
    obj = obj[part];
  }

  const finalKey = parts[parts.length - 1];
  if (operation === 'set') {
    obj[finalKey] = value;
  } else if (operation === 'inc') {
    obj[finalKey] = (Number(obj[finalKey]) || 0) + Number(value);
  } else if (operation === 'push') {
    let arr = obj[finalKey];
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr); } catch (e) { arr = []; }
    }
    if (!Array.isArray(arr)) arr = [];
    if (value && typeof value === 'object' && value.$each) {
      arr.push(...value.$each);
    } else {
      arr.push(value);
    }
    obj[finalKey] = arr;
  }

  doc[rootKey] = rootValue;
  if (typeof doc.changed === 'function') {
    doc.changed(rootKey, true);
  }
}

/**
 * A thenable query builder class mirroring Mongoose query syntax.
 */
class MongoQuery {
  constructor(model, type, options = {}) {
    this.model = model;
    this.type = type;
    this.options = {
      where: {},
      include: [],
      order: [],
      limit: null,
      offset: null,
      attributes: null,
      ...options
    };
  }

  populate(path, select) {
    const paths = Array.isArray(path) ? path : [path];
    for (const p of paths) {
      if (typeof p === 'string' && (p.includes(' ') || p.includes(','))) {
        const splitPaths = p.split(/[\s,]+/).filter(Boolean);
        for (const sp of splitPaths) {
          const includeOpt = buildIncludeOption(this.model, sp);
          if (includeOpt) {
            this.options.include.push(includeOpt);
          }
        }
      } else {
        let populateObj = p;
        if (typeof p === 'string' && select) {
          populateObj = { path: p, select };
        }
        const includeOpt = buildIncludeOption(this.model, populateObj);
        if (includeOpt) {
          this.options.include.push(includeOpt);
        }
      }
    }
    return this;
  }

  sort(sortObj) {
    if (typeof sortObj === 'object' && sortObj !== null) {
      const order = [];
      for (const [key, val] of Object.entries(sortObj)) {
        const dir = val === -1 || val === 'desc' || val === 'descending' ? 'DESC' : 'ASC';
        order.push([key, dir]);
      }
      this.options.order = order;
    } else if (typeof sortObj === 'string') {
      const fields = sortObj.split(' ').filter(Boolean);
      const order = fields.map(f => {
        if (f.startsWith('-')) {
          return [f.slice(1), 'DESC'];
        }
        return [f, 'ASC'];
      });
      this.options.order = order;
    }
    return this;
  }

  skip(val) {
    this.options.offset = Number(val);
    return this;
  }

  limit(val) {
    this.options.limit = Number(val);
    return this;
  }

  select(selectStr) {
    if (typeof selectStr === 'string') {
      const fields = selectStr.split(' ').filter(Boolean);
      const excludes = fields.filter(f => f.startsWith('-')).map(f => f.slice(1));
      const includes = fields.filter(f => !f.startsWith('-'));

      if (excludes.length > 0) {
        this.options.attributes = { exclude: excludes };
      } else if (includes.length > 0) {
        const attr = includes.map(f => f === '_id' ? 'id' : f);
        if (!attr.includes('id') && !excludes.includes('id')) {
          attr.push('id');
        }
        this.options.attributes = attr;
      }
    }
    return this;
  }

  async exec() {
    let result;
    if (this.type === 'find') {
      result = await this.model.findAll(this.options);
    } else if (this.type === 'findOne') {
      const findOneFn = this.model.originalFindOne || this.model.findOne;
      result = await findOneFn.call(this.model, this.options);
    } else if (this.type === 'findById') {
      const opts = { ...this.options };
      delete opts.id;
      result = await this.model.findByPk(this.options.id, opts);
    } else if (this.type === 'count') {
      result = await this.model.count(this.options);
    } else if (this.type === 'findByIdAndUpdate') {
      const { id, update } = this.options;
      const doc = await this.model.findByPk(id);
      if (!doc) return null;

      const fieldsToUpdate = update.$set ? update.$set : update;

      // Handle $inc
      if (update.$inc) {
        for (const [key, val] of Object.entries(update.$inc)) {
          setNestedPath(doc, key, val, 'inc');
        }
      }

      // Handle $push
      if (update.$push) {
        for (const [key, val] of Object.entries(update.$push)) {
          setNestedPath(doc, key, val, 'push');
        }
      }

      // Assign fields
      for (const [key, val] of Object.entries(fieldsToUpdate)) {
        setNestedPath(doc, key, val, 'set');
      }

      await doc.save();

      let finalDoc = doc;
      if (this.options.attributes) {
        const queryOpts = { attributes: this.options.attributes };
        finalDoc = await this.model.findByPk(id, queryOpts);
      }
      result = finalDoc;
    }
    return result;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

/**
 * Wraps a Sequelize model with Mongoose-like subclassing and static helpers.
 */
function wrapModel(SequelizeModel) {
  // Helper to map properties like brand -> brandId for inputs
  function translateInputs(values) {
    if (!values || typeof values !== 'object') return values;
    if (Array.isArray(values)) return values.map(translateInputs);

    const newValues = { ...values };
    for (const [key, val] of Object.entries(values)) {
      if (key === '_id') {
        newValues['id'] = val;
      }
      const idKey = key + 'Id';
      if (SequelizeModel.rawAttributes && SequelizeModel.rawAttributes[idKey]) {
        if (val && typeof val === 'object' && val.id) {
          newValues[idKey] = val.id;
        } else {
          newValues[idKey] = val;
        }
      }
    }
    return newValues;
  }

  // Subclass the model to intercept direct constructor calls and static builder calls
  class WrappedModel extends SequelizeModel {
    constructor(values, options) {
      super(translateInputs(values), options);
    }
  }

  // Set original name
  Object.defineProperty(WrappedModel, 'name', { value: SequelizeModel.name });

  // Save original findOne to avoid recursive loops
  WrappedModel.originalFindOne = SequelizeModel.findOne;

  // Add _id virtual property getter to instance prototype
  if (!Object.prototype.hasOwnProperty.call(WrappedModel.prototype, '_id')) {
    Object.defineProperty(WrappedModel.prototype, '_id', {
      get() {
        return this.id;
      }
    });
  }

  // Automatically define getters/setters for attributes ending with 'Id'
  // (e.g. brandId -> brand) to bridge Sequelize columns and associations cleanly
  const attributes = Object.keys(SequelizeModel.rawAttributes || {});
  for (const attr of attributes) {
    if (attr.endsWith('Id')) {
      const baseName = attr.slice(0, -2);
      if (!Object.prototype.hasOwnProperty.call(WrappedModel.prototype, baseName)) {
        Object.defineProperty(WrappedModel.prototype, baseName, {
          configurable: true,
          enumerable: true,
          get() {
            return this.dataValues[baseName] !== undefined ? this.dataValues[baseName] : this[attr];
          },
          set(val) {
            if (val && typeof val === 'object' && val.id) {
              this.setDataValue(baseName, val);
              this.setDataValue(attr, val.id);
            } else {
              this.setDataValue(attr, val);
            }
          }
        });
      }
    }
  }

  // Automatically parse/serialize JSON columns if retrieved as string
  const rawAttributes = SequelizeModel.rawAttributes || {};
  for (const [attrName, attrConfig] of Object.entries(rawAttributes)) {
    if (attrConfig.type && attrConfig.type.key === 'JSON') {
      if (!Object.prototype.hasOwnProperty.call(WrappedModel.prototype, attrName)) {
        Object.defineProperty(WrappedModel.prototype, attrName, {
          configurable: true,
          enumerable: true,
          get() {
            const val = this.getDataValue(attrName);
            if (typeof val === 'string') {
              try {
                return JSON.parse(val);
              } catch (e) {
                return val;
              }
            }
            return val;
          },
          set(val) {
            let processedVal = val;
            if (typeof val === 'string') {
              try {
                processedVal = JSON.parse(val);
              } catch (e) {}
            }
            this.setDataValue(attrName, processedVal);
          }
        });
      }
    }
  }

  // Add virtual select, toObject and toJSON helpers
  WrappedModel.prototype.toJSON = function () {
    const json = SequelizeModel.prototype.toJSON.call(this);
    if (json && typeof json === 'object') {
      json._id = this.id;

      // Auto-parse JSON attributes if they are serialized as string
      const rawAttributes = SequelizeModel.rawAttributes || {};
      for (const [attrName, attrConfig] of Object.entries(rawAttributes)) {
        if (attrConfig.type && attrConfig.type.key === 'JSON') {
          const val = json[attrName];
          if (typeof val === 'string') {
            try {
              json[attrName] = JSON.parse(val);
            } catch (e) {}
          }
        }
      }

      // Recursively parse any nested JSON strings in populated relations
      const parseNested = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(parseNested);
        }
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
            try {
              obj[k] = parseNested(JSON.parse(v));
            } catch (e) {}
          } else if (v && typeof v === 'object') {
            obj[k] = parseNested(v);
          }
        }
        return obj;
      };

      parseNested(json);

      for (const [key, val] of Object.entries(json)) {
        if (val && typeof val === 'object') {
          if (Array.isArray(val)) {
            for (const item of val) {
              if (item && typeof item === 'object' && item.id !== undefined) {
                item._id = item.id;
              }
            }
          } else if (val.id !== undefined) {
            val._id = val.id;
          }
        }
      }
    }
    return json;
  };

  WrappedModel.prototype.toObject = function () {
    return this.toJSON();
  };

  // Mongoose static queries
  WrappedModel.find = function (query) {
    if (query && (query.where || query.include || query.attributes)) {
      return new MongoQuery(WrappedModel, 'find', query);
    }
    return new MongoQuery(WrappedModel, 'find', { where: translateMongoQuery(query, WrappedModel) });
  };

  WrappedModel.findOne = function (query) {
    if (query && (query.where || query.include || query.attributes)) {
      return new MongoQuery(WrappedModel, 'findOne', query);
    }
    return new MongoQuery(WrappedModel, 'findOne', { where: translateMongoQuery(query, WrappedModel) });
  };

  WrappedModel.findById = function (id) {
    return new MongoQuery(WrappedModel, 'findById', { id });
  };

  WrappedModel.countDocuments = function (query) {
    if (query && (query.where || query.include || query.attributes)) {
      return new MongoQuery(WrappedModel, 'count', query);
    }
    return new MongoQuery(WrappedModel, 'count', { where: translateMongoQuery(query, WrappedModel) });
  };

  WrappedModel.deleteMany = async function (query) {
    const where = translateMongoQuery(query, WrappedModel);
    const count = await WrappedModel.destroy({ where });
    return { deletedCount: count };
  };

  WrappedModel.deleteOne = async function (query) {
    const where = translateMongoQuery(query, WrappedModel);
    const count = await WrappedModel.destroy({ where, limit: 1 });
    return { deletedCount: count };
  };

  WrappedModel.findByIdAndDelete = async function (id) {
    const doc = await WrappedModel.findByPk(id);
    if (doc) {
      await WrappedModel.destroy({ where: { id } });
    }
    return doc;
  };

  WrappedModel.findOneAndDelete = async function (query) {
    const where = translateMongoQuery(query, WrappedModel);
    // Use WrappedModel.originalFindOne or findOne query to fetch doc
    const doc = await WrappedModel.originalFindOne({ where });
    if (doc) {
      await WrappedModel.destroy({ where: { id: doc.id } });
    }
    return doc;
  };

  WrappedModel.findOneAndRemove = WrappedModel.findOneAndDelete;
  WrappedModel.findByIdAndRemove = WrappedModel.findByIdAndDelete;

  WrappedModel.updateMany = async function (query, update, options = {}) {
    const where = translateMongoQuery(query, WrappedModel);
    const fieldsToUpdate = update.$set ? update.$set : update;
    const [count] = await WrappedModel.update(fieldsToUpdate, { where });
    return { matchedCount: count, modifiedCount: count };
  };

  WrappedModel.updateOne = async function (query, update, options = {}) {
    const where = translateMongoQuery(query, WrappedModel);
    const fieldsToUpdate = update.$set ? update.$set : update;
    const [count] = await WrappedModel.update(fieldsToUpdate, { where, limit: 1 });
    return { matchedCount: count, modifiedCount: count };
  };

  WrappedModel.findByIdAndUpdate = function (id, update, options = {}) {
    return new MongoQuery(WrappedModel, 'findByIdAndUpdate', { id, update, options });
  };

  WrappedModel.originalAggregate = SequelizeModel.aggregate;

  WrappedModel.aggregate = async function (pipeline, ...args) {
    if (!Array.isArray(pipeline)) {
      const aggFn = WrappedModel.originalAggregate || SequelizeModel.aggregate;
      return aggFn.call(this, pipeline, ...args);
    }
    const { sequelize } = require('../config/database');

    // Case 1: Message aggregation (Latest messages per conversation)
    if (WrappedModel.name === 'Message') {
      const matchStage = pipeline.find(stage => stage.$match);
      const orConditions = matchStage?.$match?.$or || [];
      let userId = null;
      for (const cond of orConditions) {
        if (cond.sender) userId = cond.sender;
        else if (cond.receiver) userId = cond.receiver;
      }
      
      if (userId) {
        const results = await sequelize.query(`
          SELECT m.*, 
                 s.name AS senderName, s.avatar AS senderAvatar, s.role AS senderRole,
                 r.name AS receiverName, r.avatar AS receiverAvatar, r.role AS receiverRole
          FROM Messages m
          INNER JOIN (
            SELECT conversationId, MAX(id) as max_id
            FROM Messages
            WHERE senderId = :userId OR receiverId = :userId
            GROUP BY conversationId
          ) latest ON m.id = latest.max_id
          LEFT JOIN Users s ON m.senderId = s.id
          LEFT JOIN Users r ON m.receiverId = r.id
          ORDER BY m.createdAt DESC
        `, {
          replacements: { userId },
          type: sequelize.QueryTypes.SELECT
        });

        return results.map(row => ({
          _id: row.conversationId,
          lastMessage: {
            _id: row.id,
            id: row.id,
            conversationId: row.conversationId,
            sender: { _id: row.senderId, id: row.senderId, name: row.senderName, avatar: row.senderAvatar, role: row.senderRole },
            receiver: { _id: row.receiverId, id: row.receiverId, name: row.receiverName, avatar: row.receiverAvatar, role: row.receiverRole },
            message: row.message,
            isRead: row.isRead === 1 || row.isRead === true,
            messageType: row.messageType,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          }
        }));
      }
      return [];
    }

    // Case 2: Application aggregation (earnings & monthlyTrend for analytics)
    if (WrappedModel.name === 'Application') {
      const matchStage = pipeline.find(stage => stage.$match);
      const groupStage = pipeline.find(stage => stage.$group);
      
      const matchQuery = matchStage?.$match || {};
      const where = translateMongoQuery(matchQuery, WrappedModel);

      if (groupStage?.$group?._id && typeof groupStage.$group._id === 'object' && groupStage.$group._id.month) {
        let creatorId = matchQuery.creator;
        if (creatorId && typeof creatorId === 'object' && creatorId.id) creatorId = creatorId.id;

        const results = await sequelize.query(`
          SELECT MONTH(createdAt) as month, YEAR(createdAt) as year, COUNT(*) as count
          FROM Applications
          WHERE creatorId = :creatorId
          GROUP BY YEAR(createdAt), MONTH(createdAt)
          ORDER BY year ASC, month ASC
          LIMIT 6
        `, {
          replacements: { creatorId },
          type: sequelize.QueryTypes.SELECT
        });

        return results.map(row => ({
          _id: { month: row.month, year: row.year },
          count: row.count
        }));
      }

      if (groupStage?.$group?.total && groupStage.$group.total.$sum === '$dealAmount') {
        const totalSum = await WrappedModel.sum('dealAmount', { where });
        return [ { _id: null, total: totalSum || 0 } ];
      }
    }

    return [];
  };

  return WrappedModel;
}

module.exports = { wrapModel, translateMongoQuery };
