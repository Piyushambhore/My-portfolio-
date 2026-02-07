import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// Simple in-memory session store (resets on cold start, but tokens are validated)
// For production, use a database or Redis
const activeSessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function hashPassword(password) {
    return crypto.createHmac('sha256', SESSION_SECRET).update(password).digest('hex');
}

export function generateSessionToken() {
    return crypto.randomBytes(48).toString('hex');
}

export function verifyPassword(password) {
    const hashedInput = hashPassword(password);
    const hashedStored = hashPassword(ADMIN_PASSWORD);
    try {
        return crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(hashedStored));
    } catch (e) {
        return false;
    }
}

export function createSession() {
    const token = generateSessionToken();
    activeSessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
    });
    return token;
}

export function verifySession(token) {
    if (!token) return false;
    const session = activeSessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(token);
        return false;
    }
    return true;
}

export function getAuthToken(req) {
    const authHeader = req.headers['authorization'];
    return authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export function isAuthenticated(req) {
    return verifySession(getAuthToken(req));
}

export function destroySession(token) {
    if (token) activeSessions.delete(token);
}
