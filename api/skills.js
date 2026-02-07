const { supabase, setCorsHeaders, handleOptions } = require('../lib/supabase');
const { updateSkillProgress, getSkillsByCategory } = require('../lib/skills');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data: posts, error } = await supabase.from('posts').select('*');
        if (error) throw error;

        const skillProgress = updateSkillProgress(posts || []);
        const skills = getSkillsByCategory(skillProgress);

        return res.status(200).json({ skills, skillProgress });
    } catch (error) {
        console.error('Skills error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
