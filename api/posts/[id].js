import { supabase, setCorsHeaders, handleOptions } from '../lib/supabase.js';
import { isAuthenticated } from '../lib/auth.js';
import { extractTags, detectSkillsFromContent, calculateStreak, updateSkillProgress } from '../lib/skills.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    const { id } = req.query;

    try {
        // PUT /api/posts/:id - Update post
        if (req.method === 'PUT') {
            if (!isAuthenticated(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { content } = req.body;
            const tags = extractTags(content);
            const detectedSkills = Object.keys(detectSkillsFromContent(content));

            const { data, error } = await supabase
                .from('posts')
                .update({
                    content,
                    tags,
                    detected_skills: detectedSkills,
                    edited_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Post not found' });
            }

            return res.status(200).json({ post: data });
        }

        // DELETE /api/posts/:id - Delete post
        if (req.method === 'DELETE') {
            if (!isAuthenticated(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Get updated streak
            const { data: allPosts } = await supabase.from('posts').select('*');
            const streak = calculateStreak(allPosts || []);

            return res.status(200).json({ success: true, streak });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Post error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
