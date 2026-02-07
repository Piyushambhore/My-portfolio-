import { supabase, setCorsHeaders, handleOptions } from './lib/supabase.js';
import { isAuthenticated } from './lib/auth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    try {
        // GET /api/feedback - Get feedback
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;

            const isAdmin = isAuthenticated(req);
            const feedback = isAdmin
                ? data
                : (data || []).slice(0, 10).map(f => ({ ...f, id: undefined }));

            return res.status(200).json({
                feedback,
                total: (data || []).length
            });
        }

        // POST /api/feedback - Submit feedback
        if (req.method === 'POST') {
            const { message, rating, emoji } = req.body;

            if (!message || message.length < 3 || message.length > 500) {
                return res.status(400).json({ error: 'Feedback must be 3-500 characters' });
            }

            const feedback = {
                id: 'f_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                message: message.trim(),
                rating: rating || null,
                emoji: emoji || null,
                timestamp: new Date().toISOString()
            };

            const { error } = await supabase.from('feedback').insert([feedback]);
            if (error) throw error;

            return res.status(201).json({
                success: true,
                message: 'Thank you for your feedback!'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Feedback error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
