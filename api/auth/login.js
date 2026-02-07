import { setCorsHeaders, handleOptions } from '../lib/supabase.js';
import { verifyPassword, createSession } from '../lib/auth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        if (verifyPassword(password)) {
            const token = createSession();
            return res.status(200).json({
                success: true,
                token,
                message: 'Welcome back!'
            });
        } else {
            // Delay to prevent brute force
            await new Promise(r => setTimeout(r, 1000));
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
