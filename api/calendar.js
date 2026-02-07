import { supabase, setCorsHeaders, handleOptions } from './lib/supabase.js';
import { calculateStreak } from './lib/skills.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        // Generate calendar data for last 90 days
        const calendar = [];
        for (let i = 89; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            const count = (posts || []).filter(p => p.date.split('T')[0] === date).length;
            calendar.push({ date, count });
        }

        const streak = calculateStreak(posts || []);
        return res.status(200).json({ calendar, streak });
    } catch (error) {
        console.error('Calendar error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
