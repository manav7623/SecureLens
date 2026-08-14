// Global defense configurations toggled by the frontend
const defenseConfig = {
  wafEnabled: false,
  rateLimitEnabled: false,
  sessionLockEnabled: false,
  strictPasswordPolicy: false,
  rbacStrictMode: false
};

// In-memory logs for the security command center
const securityLogs = [];

// Helper to add log and notify frontend via socket
function logSecurityEvent(app, type, message, severity, details = {}) {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    type,
    message,
    severity, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    details
  };

  securityLogs.unshift(logEntry);
  if (securityLogs.length > 200) {
    securityLogs.pop();
  }

  // Broadcast to Socket.IO if app instance is available
  try {
    const io = app.get('io');
    if (io) {
      io.emit('securityLog', logEntry);
    }
  } catch (err) {
    // Socket not initialized yet or not accessible
  }

  return logEntry;
}

// In-memory rate limiting map
const requestCount = {};

// DDoS / Rate Limiting Middleware
const ddosProtectionMiddleware = (req, res, next) => {
  if (!defenseConfig.rateLimitEnabled) {
    return next();
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 5000; // 5 second window
  const maxRequests = 10; // Max 10 requests per window

  if (!requestCount[ip]) {
    requestCount[ip] = [];
  }

  // Filter timestamps within the current window
  requestCount[ip] = requestCount[ip].filter(timestamp => now - timestamp < windowMs);

  if (requestCount[ip].length >= maxRequests) {
    logSecurityEvent(
      req.app,
      'DDOS_BLOCKED',
      `Rate limit exceeded for IP: ${ip}`,
      'MEDIUM',
      { ip, requestCount: requestCount[ip].length, windowMs }
    );
    return res.status(429).json({
      error: 'Too many requests. DDoS Shield / Rate Limiting is active.',
      rateLimited: true
    });
  }

  requestCount[ip].push(now);
  next();
};

// Theft Detection / Session Validator Middleware
const sessionTheftDetector = (req, res, next) => {
  if (!defenseConfig.sessionLockEnabled) {
    return next();
  }

  // In a real-world scenario, we check the Authorization header / token vs IP and User-Agent
  // For the simulator, we extract client metadata from request headers
  const token = req.headers['authorization'];
  if (!token) {
    return next();
  }

  const virtualIp = req.headers['x-virtual-ip'] || req.ip;
  const virtualUserAgent = req.headers['x-virtual-user-agent'] || req.headers['user-agent'];

  // Simulate verification: If the user provides a specific "suspicious" header, trigger alert
  if (req.headers['x-simulate-theft'] === 'true') {
    logSecurityEvent(
      req.app,
      'SESSION_HIJACK',
      `Suspicious session access. IP mismatch: ${virtualIp} vs expected 127.0.0.1`,
      'HIGH',
      { token: token.substring(0, 15) + '...', detectedIp: virtualIp, userAgent: virtualUserAgent }
    );

    return res.status(401).json({
      error: 'Access Blocked: Intrusion Detection System detected session hijacking attempt (IP / User-Agent fingerprint mismatch).',
      hijackBlocked: true
    });
  }

  next();
};

// RBAC Middleware generator
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // In our challenge app, virtual-role is passed in header or JWT
    const userRole = req.headers['x-virtual-role'] || 'guest';

    if (!allowedRoles.includes(userRole)) {
      const path = req.originalUrl;
      const severity = defenseConfig.rbacStrictMode ? 'HIGH' : 'LOW';

      logSecurityEvent(
        req.app,
        'RBAC_VIOLATION',
        `Unauthorized access attempt to ${path} by role: ${userRole}`,
        severity,
        { requestedPath: path, userRole, enforcedRoles: allowedRoles, strictMode: defenseConfig.rbacStrictMode }
      );

      if (defenseConfig.rbacStrictMode) {
        return res.status(403).json({
          error: `Forbidden: Strict RBAC Policy denies access to role "${userRole}".`,
          rbacBlocked: true
        });
      }
    }

    next();
  };
};

module.exports = {
  defenseConfig,
  securityLogs,
  logSecurityEvent,
  ddosProtectionMiddleware,
  sessionTheftDetector,
  verifyRole
};
