import { supabase, setCorsHeaders, handleOptions } from '../lib/supabase.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('total_count')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return res.status(200).json({
            totalVisitors: data?.total_count || 0
        });
    } catch (error) {
        console.error('Visitor count error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
