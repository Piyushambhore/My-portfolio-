import { supabase, setCorsHeaders, handleOptions } from './lib/supabase.js';
import { getTagCloud } from './lib/skills.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*');

        if (error) throw error;

        return res.status(200).json(getTagCloud(posts || []));
    } catch (error) {
        console.error('Tags error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
