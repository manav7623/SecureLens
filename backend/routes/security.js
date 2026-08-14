const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { queryAll } = require('../config/sqliteDb');
const { 
  defenseConfig, 
  securityLogs, 
  logSecurityEvent, 
  ddosProtectionMiddleware, 
  sessionTheftDetector, 
  verifyRole 
} = require('../middleware/securityMiddleware');

// Get current security configurations & metrics
router.get('/config', (req, res) => {
  res.json({
    config: defenseConfig,
    logs: securityLogs.slice(0, 50), // Send last 50 logs
    stats: {
      totalAlerts: securityLogs.length,
      criticalAlerts: securityLogs.filter(l => l.severity === 'CRITICAL' || l.severity === 'HIGH').length,
      blockedRequests: securityLogs.filter(l => l.type.includes('BLOCKED') || l.type.includes('VIOLATION') || l.type.includes('HIJACK')).length
    }
  });
});

// Update security configurations
router.post('/config', (req, res) => {
  const { wafEnabled, rateLimitEnabled, sessionLockEnabled, strictPasswordPolicy, rbacStrictMode } = req.body;

  if (typeof wafEnabled === 'boolean') defenseConfig.wafEnabled = wafEnabled;
  if (typeof rateLimitEnabled === 'boolean') defenseConfig.rateLimitEnabled = rateLimitEnabled;
  if (typeof sessionLockEnabled === 'boolean') defenseConfig.sessionLockEnabled = sessionLockEnabled;
  if (typeof strictPasswordPolicy === 'boolean') defenseConfig.strictPasswordPolicy = strictPasswordPolicy;
  if (typeof rbacStrictMode === 'boolean') defenseConfig.rbacStrictMode = rbacStrictMode;

  logSecurityEvent(
    req.app,
    'CONFIG_CHANGE',
    `Security policies updated: WAF=${defenseConfig.wafEnabled}, RateLimit=${defenseConfig.rateLimitEnabled}, SessionLock=${defenseConfig.sessionLockEnabled}, StrictPassword=${defenseConfig.strictPasswordPolicy}, StrictRBAC=${defenseConfig.rbacStrictMode}`,
    'LOW'
  );

  res.json({ success: true, config: defenseConfig });
});

// SQL Injection sandbox endpoint
router.post('/sqli', ddosProtectionMiddleware, sessionTheftDetector, async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  // WAF Defense check before running query
  if (defenseConfig.wafEnabled) {
    // Basic SQL signature checks
    const sqlKeywords = /('|--|#|union|select|insert|update|delete|drop|or|and)/gi;
    if (sqlKeywords.test(username)) {
      logSecurityEvent(
        req.app,
        'WAF_BLOCKED_SQLI',
        `SQL Injection attempt blocked by WAF. Input payload: "${username}"`,
        'HIGH',
        { input: username }
      );
      return res.status(400).json({
        error: 'Attack Blocked: Web Application Firewall detected SQL Injection signature in parameter "username".',
        wafBlocked: true
      });
    }
  }

  try {
    let sqlQuery = '';
    let results = [];

    if (defenseConfig.wafEnabled) {
      // Secure: Parameterized query
      sqlQuery = 'SELECT username, email, role FROM users WHERE username = ?';
      results = await queryAll(sqlQuery, [username]);
    } else {
      // Insecure: Direct string interpolation (SQL Injection vulnerable!)
      sqlQuery = `SELECT username, email, role FROM users WHERE username = '${username}'`;
      results = await queryAll(sqlQuery);

      // Log successful or potential SQL Injection attack
      const isSuspicious = username.includes("'") || username.includes("--") || username.toLowerCase().includes("union");
      if (isSuspicious) {
        logSecurityEvent(
          req.app,
          'SQL_INJECTION',
          `Potential SQL Injection payload executed successfully: "${username}"`,
          'CRITICAL',
          { query: sqlQuery, rowsReturned: results.length }
        );
      }
    }

    res.json({
      success: true,
      queryExecuted: sqlQuery,
      data: results
    });

  } catch (err) {
    logSecurityEvent(
      req.app,
      'SQL_ERROR',
      `Database error caused by payload: "${username}". Error: ${err.message}`,
      'MEDIUM',
      { error: err.message, query: `SELECT username, email, role FROM users WHERE username = '${username}'` }
    );
    res.status(500).json({
      error: 'Database syntax error. Check your input or SQL syntax!',
      dbError: err.message,
      queryExecuted: `SELECT username, email, role FROM users WHERE username = '${username}'`
    });
  }
});

// Password Strength meter check & Policy auditor
router.post('/pw-strength', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const commonPasswords = ['123456', 'password', '12345678', 'qwerty', '12345', 'admin', 'letmein', 'password123'];
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isCommon = commonPasswords.includes(password.toLowerCase());

  let score = 0;
  if (password.length > 0) score += Math.min(Math.floor(password.length / 3), 2);
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumbers) score++;
  if (hasSpecial) score++;
  if (isCommon) score = Math.max(score - 3, 0);

  let strength = 'WEAK';
  if (score >= 5) strength = 'STRONG';
  else if (score >= 3) strength = 'MEDIUM';

  const requirementsMet = {
    length: hasMinLength,
    uppercase: hasUpperCase,
    lowercase: hasLowerCase,
    number: hasNumbers,
    special: hasSpecial,
    notCommon: !isCommon
  };

  const isCompliant = !isCommon && (!defenseConfig.strictPasswordPolicy || (hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecial));

  if (!isCompliant && defenseConfig.strictPasswordPolicy) {
    logSecurityEvent(
      req.app,
      'PASSWORD_POLICY_VIOLATION',
      `Weak password creation attempt blocked. Strength: ${strength}`,
      'LOW',
      { strength, passwordLength: password.length }
    );
  }

  res.json({
    strength,
    score, // 0 - 6
    requirementsMet,
    isCompliant,
    policyEnforced: defenseConfig.strictPasswordPolicy
  });
});

// Password Cracking Sandbox
router.post('/pw-crack', (req, res) => {
  const { hashType, password } = req.body; // MD5, SHA-256, BCrypt

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Create hash for simulation
  let hash = '';
  if (hashType === 'MD5') {
    hash = crypto.createHash('md5').update(password).digest('hex');
  } else if (hashType === 'SHA-256') {
    hash = crypto.createHash('sha256').update(password).digest('hex');
  } else if (hashType === 'BCRYPT') {
    // Generate actual bcrypt hash
    hash = bcrypt.hashSync(password, 10);
  } else {
    return res.status(400).json({ error: 'Invalid hashType.' });
  }

  // Simulate a brute-force crack
  // Bcrypt cracking: Slow (simulated speed: 10 hashes/sec on low-tier hardware)
  // MD5/SHA256 cracking: Extremely fast (simulated speed: 50,000,000 hashes/sec)
  let simulatedAttempts = 0;
  let simulatedDurationSec = 0.0;
  let status = 'CRACKED';

  // Easy dictionary match or length calculation
  const simpleLength = password.length;
  if (hashType === 'BCRYPT') {
    // BCrypt hashing is computationally intensive (key stretching)
    if (simpleLength > 6) {
      status = 'SECURE';
      simulatedAttempts = 1500000;
      simulatedDurationSec = 150000.0; // Over 40 hours
    } else {
      simulatedAttempts = 5000;
      simulatedDurationSec = 500.0; // 8.3 minutes
    }
  } else {
    // MD5 or SHA256 can be brute forced at scale
    if (simpleLength > 10) {
      status = 'HARD_CRACK';
      simulatedAttempts = 900000000000;
      simulatedDurationSec = 18000.0; // ~5 hours
    } else if (simpleLength > 6) {
      simulatedAttempts = 100000000;
      simulatedDurationSec = 2.0; // 2 seconds
    } else {
      simulatedAttempts = 50000;
      simulatedDurationSec = 0.001; // Instant
    }
  }

  logSecurityEvent(
    req.app,
    'PASSWORD_AUDIT',
    `Password strength simulation executed. Type: ${hashType}, Status: ${status}`,
    'LOW',
    { hashType, status }
  );

  res.json({
    hash,
    hashType,
    status,
    simulatedAttempts,
    simulatedDurationSec,
    tip: hashType === 'BCRYPT' 
      ? 'BCrypt employs blowfish key-stretching which makes GPU parallel cracking highly ineffective.' 
      : 'Fast hashing functions like MD5/SHA256 are highly vulnerable to custom ASIC and GPU cracking hardware.'
  });
});

// RBAC simulator target endpoints
router.get('/rbac/guest-data', verifyRole(['guest', 'user', 'admin']), (req, res) => {
  res.json({
    title: 'Public Platform Overview',
    accessAllowed: true,
    data: 'Welcome to SecureLens Sandbox. Anyone can view public system settings.'
  });
});

router.get('/rbac/user-data', verifyRole(['user', 'admin']), (req, res) => {
  res.json({
    title: 'Internal Audit Reports',
    accessAllowed: true,
    data: 'Employee details: 1. Manav Patel (Senior Security Dev), 2. Alice Smith (Infrastructure Lead).'
  });
});

router.get('/rbac/admin-data', verifyRole(['admin']), (req, res) => {
  res.json({
    title: 'Nuclear Threat Mitigation Controls',
    accessAllowed: true,
    data: 'Decryption Keys: admin_master_key=m4st3r_sh13ld_2026, backup_node=node_sec_east_88'
  });
});

// Session theft simulation endpoint
router.post('/simulate-theft', (req, res) => {
  const { hijack } = req.body;

  if (hijacked === 'true') {
    // Endpoint doesn't do much, sessionTheftDetector middleware does the job
  }
  
  res.json({ success: true, message: 'Session metadata received.' });
});

// Clear Logs
router.post('/clear-logs', (req, res) => {
  securityLogs.length = 0;
  res.json({ success: true, message: 'Security incident logs cleared.' });
});

// Seed some initial logs for display
setTimeout(() => {
  securityLogs.push(
    { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'SYSTEM_STARTUP', message: 'SecureLens Firewall Engine running. Auto-detection armed.', severity: 'LOW' },
    { id: '2', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'PORT_SCAN', message: 'Scan detected from IP 198.51.100.42 on ports 80, 443, 8080.', severity: 'MEDIUM' }
  );
}, 2000);

module.exports = router;
