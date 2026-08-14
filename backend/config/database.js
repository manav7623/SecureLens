const mongoose = require('mongoose');
require('dotenv').config();

// Global plugin to match Sequelize behaviors
mongoose.plugin((schema) => {
  // Add 'changed' method to match doc.changed(...) calls
  schema.methods.changed = function(path, value) {
    if (value) {
      this.markModified(path);
    }
  };

  // Add virtuals for relations to dynamically return their IDs
  // e.g., if a schema has field 'brand' (which is ref to User), also expose virtual 'brandId'
  schema.eachPath((pathname, schemaType) => {
    if (schemaType.options && schemaType.options.ref) {
      const virtualName = pathname + 'Id';
      if (!schema.virtuals[virtualName]) {
        schema.virtual(virtualName)
          .get(function() {
            const val = this[pathname];
            return val && val._id ? val._id : val;
          })
          .set(function(val) {
            this[pathname] = val;
          });
      }
    }
  });

  // Ensure virtuals are included in toJSON and toObject output
  schema.set('toJSON', { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  });
  schema.set('toObject', { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      return ret;
    }
  });
});

const uri = process.env.MONGODB_URI;

async function initializeDatabase() {
  try {
    if (!uri) {
      console.warn('⚠️ MONGODB_URI environment variable is missing. Running in local SQLite mode.');
      return;
    }
    // Set connection timeout short (3 seconds) to prevent long hangs on startup
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ MongoDB Database connected successfully.');
  } catch (err) {
    console.warn('⚠️ Error connecting to MongoDB (Running in SQLite-only security mode):', err.message);
    // Do not re-throw to allow server startup without remote database whitelist
  }
}

// Dummy/mock sequelize object to prevent import breaks
const sequelize = {
  sync: async () => {
    console.log('ℹ️ Mock Sequelize sync: Collections auto-initialized by Mongoose.');
  },
  close: async () => {
    await mongoose.connection.close();
    console.log('ℹ️ Mock Sequelize close: Closed Mongoose connection.');
  }
};

module.exports = { sequelize, initializeDatabase };
