const { setCorsHeaders, handleOptions } = require('../lib/supabase');
const { generateCaptcha } = require('../lib/captcha');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const captcha = generateCaptcha();
        return res.status(200).json(captcha);
    } catch (error) {
        console.error('CAPTCHA generation error:', error);
        return res.status(500).json({ error: 'Failed to generate CAPTCHA' });
    }
};
