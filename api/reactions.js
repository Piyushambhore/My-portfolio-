const { supabase, setCorsHeaders, handleOptions } = require('./lib/supabase');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    try {
        // GET /api/reactions - Get all reactions
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('reactions').select('*');
            if (error) throw error;

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
                return res.status(400).json({ error: 'Invalid projectId or type' });
            }

            // Get existing record or create new
            let { data, error } = await supabase
                .from('reactions')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Create new record
                const newReaction = {
                    project_id: projectId,
                    likes: type === 'like' ? 1 : 0,
                    loves: type === 'love' ? 1 : 0
                };
                const { data: inserted, error: insertError } = await supabase
                    .from('reactions')
                    .insert([newReaction])
                    .select()
                    .single();

                if (insertError) throw insertError;
                data = inserted;
            } else if (error) {
                throw error;
            } else {
                // Update existing
                const updates = type === 'like'
                    ? { likes: data.likes + 1 }
                    : { loves: data.loves + 1 };

                const { data: updated, error: updateError } = await supabase
                    .from('reactions')
                    .update(updates)
                    .eq('project_id', projectId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                data = updated;
            }

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
};
