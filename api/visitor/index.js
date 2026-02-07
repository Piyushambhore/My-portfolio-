const { supabase, setCorsHeaders, handleOptions } = require('../lib/supabase');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get current count
        let { data, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code === 'PGRST116') {
            // Record doesn't exist, create it
            const { data: newData, error: insertError } = await supabase
                .from('visitors')
                .insert([{ id: 1, total_count: 1 }])
                .select()
                .single();

            if (insertError) throw insertError;
            data = newData;
        } else if (error) {
            throw error;
        } else {
            // Increment count
            const { data: updatedData, error: updateError } = await supabase
                .from('visitors')
                .update({ total_count: data.total_count + 1 })
                .eq('id', 1)
                .select()
                .single();

            if (updateError) throw updateError;
            data = updatedData;
        }

        return res.status(200).json({ visitorNumber: data.total_count });
    } catch (error) {
        console.error('Visitor error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
