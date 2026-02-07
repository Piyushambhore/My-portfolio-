import { setCorsHeaders, handleOptions } from '../lib/supabase.js';
import { isAuthenticated } from '../lib/auth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        return res.status(200).json({
            authenticated: isAuthenticated(req)
        });
    } catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
