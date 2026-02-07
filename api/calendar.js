const { supabase, setCorsHeaders, handleOptions } = require('./lib/supabase');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data: posts, error } = await supabase.from('posts').select('*');
        if (error) throw error;

        // Build activity map for calendar heatmap
        const activityMap = {};
        (posts || []).forEach(post => {
            const date = new Date(post.date).toISOString().split('T')[0];
            if (!activityMap[date]) {
                activityMap[date] = { count: 0, skills: new Set() };
            }
            activityMap[date].count++;
            (post.detected_skills || []).forEach(s => activityMap[date].skills.add(s));
        });

        // Convert to array format
        const calendar = Object.entries(activityMap).map(([date, data]) => ({
            date,
            count: data.count,
            skills: [...data.skills]
        }));

        return res.status(200).json(calendar);
    } catch (error) {
        console.error('Calendar error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
