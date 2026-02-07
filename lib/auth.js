const crypto = require('crypto');

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// Token validity: 24 hours
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

function hashPassword(password) {
    return crypto.createHmac('sha256', SESSION_SECRET).update(password).digest('hex');
}

function verifyPassword(password) {
    const hashedInput = hashPassword(password);
    const hashedStored = hashPassword(ADMIN_PASSWORD);
    try {
        return crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(hashedStored));
    } catch (e) {
        return false;
    }
}

// Create a self-contained token that includes timestamp
// Format: base64(timestamp:signature)
function createSession() {
    const timestamp = Date.now();
    const data = `admin:${timestamp}`;
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
    const token = Buffer.from(`${timestamp}:${signature}`).toString('base64');
    return token;
}

// Verify token without server-side storage
function verifySession(token) {
    if (!token) return false;

    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [timestampStr, signature] = decoded.split(':');
        const timestamp = parseInt(timestampStr, 10);

        // Check if token is expired
        if (Date.now() - timestamp > TOKEN_VALIDITY_MS) {
            return false;
        }

        // Verify signature
        const data = `admin:${timestamp}`;
        const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (e) {
        return false;
    }
}

function getAuthToken(req) {
    const authHeader = req.headers['authorization'];
    return authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function isAuthenticated(req) {
    return verifySession(getAuthToken(req));
}

// No-op for stateless tokens (kept for API compatibility)
function destroySession(token) {
    // Stateless tokens can't be invalidated server-side
    // Client should just delete the token
}

module.exports = {
    hashPassword,
    verifyPassword,
    createSession,
    verifySession,
    getAuthToken,
    isAuthenticated,
    destroySession
};
