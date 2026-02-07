import { supabase, setCorsHeaders, handleOptions } from './lib/supabase.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    try {
        // GET /api/reactions - Get all reactions
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('reactions').select('*');
            if (error) throw error;

            // Convert to object format
            const reactions = {};
            (data || []).forEach(r => {
                reactions[r.project_id] = { likes: r.likes, loves: r.loves };
            });

            return res.status(200).json(reactions);
        }

        // POST /api/reactions - Add reaction
        if (req.method === 'POST') {
            const { projectId, type } = req.body;

            if (!projectId || !['like', 'love'].includes(type)) {
                return res.status(400).json({ error: 'Invalid reaction' });
            }

            // Get existing or create new
            let { data: existing } = await supabase
                .from('reactions')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (!existing) {
                const { error: insertError } = await supabase
                    .from('reactions')
                    .insert([{ project_id: projectId, likes: 0, loves: 0 }]);
                if (insertError) throw insertError;
                existing = { likes: 0, loves: 0 };
            }

            // Update count
            const updateField = type === 'like' ? 'likes' : 'loves';
            const newCount = (existing[updateField] || 0) + 1;

            const { data, error } = await supabase
                .from('reactions')
                .update({ [updateField]: newCount })
                .eq('project_id', projectId)
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                reactions: { likes: data.likes, loves: data.loves }
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Reactions error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
