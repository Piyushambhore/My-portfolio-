const { setCorsHeaders, handleOptions } = require('../../lib/supabase');
const { verifyPassword, createSession } = require('../../lib/auth');
const { verifyCaptcha } = require('../../lib/captcha');
const { checkRateLimit } = require('../../lib/rateLimit');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check rate limit first
        const rateCheck = await checkRateLimit(req, 'login');
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: rateCheck.error,
                retryAfter: rateCheck.retryAfter
            });
        }

        const { password, captchaToken, captchaAnswer } = req.body;

        // Verify CAPTCHA first
        if (captchaToken && captchaAnswer) {
            const captchaResult = verifyCaptcha(captchaToken, captchaAnswer);
            if (!captchaResult.valid) {
                return res.status(400).json({
                    error: captchaResult.error,
                    requireCaptcha: true
                });
            }
        }

        // Validate password
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        if (!verifyPassword(password)) {
            return res.status(401).json({
                error: 'Invalid password',
                remaining: rateCheck.remaining
            });
        }

        // Create session token
        const token = createSession();

        return res.status(200).json({
            success: true,
            token,
            message: 'Login successful!'
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
