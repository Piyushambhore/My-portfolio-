const { supabase, setCorsHeaders, handleOptions } = require('../lib/supabase');
const { isAuthenticated } = require('../lib/auth');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    try {
        // GET /api/feedback - Get all feedback (admin only)
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;

            // Only show recent feedback unless admin
            const feedback = isAuthenticated(req) ? data : (data || []).slice(0, 5);

            return res.status(200).json({
                feedback,
                total: (data || []).length
            });
        }

        // POST /api/feedback - Submit feedback
        if (req.method === 'POST') {
            const { message, rating, emoji } = req.body;

            if (!message || message.length > 500) {
                return res.status(400).json({ error: 'Message required (max 500 chars)' });
            }

            const feedback = {
                id: Date.now().toString(),
                message,
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
};
