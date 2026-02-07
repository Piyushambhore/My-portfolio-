// Rate Limiting using Supabase for storage (stateless-friendly)
const { supabase } = require('./supabase');

// Rate limit configurations
const RATE_LIMITS = {
    login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    api: { maxAttempts: 100, windowMs: 60 * 1000 }       // 100 requests per minute
};

// Get client IP from request
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'unknown';
}

// Check and update rate limit
async function checkRateLimit(req, type = 'api') {
    const ip = getClientIP(req);
    const config = RATE_LIMITS[type] || RATE_LIMITS.api;
    const windowStart = Date.now() - config.windowMs;
    const key = `${type}:${ip}`;

    try {
        // Get recent attempts from Supabase
        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('key', key)
            .gte('timestamp', new Date(windowStart).toISOString())
            .order('timestamp', { ascending: false });

        if (error && error.code !== 'PGRST116') {
            console.error('Rate limit check error:', error);
            // On error, allow the request but log it
            return { allowed: true, remaining: config.maxAttempts };
        }

        const attempts = data?.length || 0;

        if (attempts >= config.maxAttempts) {
            const oldestAttempt = data[data.length - 1];
            const resetTime = new Date(oldestAttempt.timestamp).getTime() + config.windowMs;
            const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

            return {
                allowed: false,
                remaining: 0,
                retryAfter,
                error: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
            };
        }

        // Record this attempt
        await supabase.from('rate_limits').insert([{
            key,
            ip,
            type,
            timestamp: new Date().toISOString()
        }]);

        return { allowed: true, remaining: config.maxAttempts - attempts - 1 };
    } catch (e) {
        console.error('Rate limit error:', e);
        return { allowed: true, remaining: config.maxAttempts };
    }
}

// Clean up old rate limit entries (call periodically)
async function cleanupRateLimits() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    try {
        await supabase
            .from('rate_limits')
            .delete()
            .lt('timestamp', oneHourAgo);
    } catch (e) {
        console.error('Rate limit cleanup error:', e);
    }
}

module.exports = {
    checkRateLimit,
    cleanupRateLimits,
    getClientIP,
    RATE_LIMITS
};
