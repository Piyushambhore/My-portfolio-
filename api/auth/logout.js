import { setCorsHeaders, handleOptions } from '../lib/supabase.js';
import { getAuthToken, destroySession } from '../lib/auth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = getAuthToken(req);
        destroySession(token);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
