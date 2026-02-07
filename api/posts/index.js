const { supabase, setCorsHeaders, handleOptions } = require('../lib/supabase');
const { isAuthenticated } = require('../lib/auth');
const {
    extractTags,
    detectSkillsFromContent,
    updateSkillProgress,
    getSkillsByCategory,
    calculateStreak,
    calculateAchievements,
    getTagCloud
} = require('../lib/skills');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (handleOptions(req, res)) return;

    try {
        // GET /api/posts - Get all posts
        if (req.method === 'GET') {
            const { data: posts, error } = await supabase
                .from('posts')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            // Apply search filter
            let filteredPosts = posts || [];
            const search = req.query.search;
            if (search) {
                const s = search.toLowerCase();
                filteredPosts = filteredPosts.filter(p =>
                    p.content.toLowerCase().includes(s) ||
                    (p.tags || []).some(t => t.includes(s))
                );
            }

            // Apply tag filter
            const tag = req.query.tag;
            if (tag) {
                filteredPosts = filteredPosts.filter(p => (p.tags || []).includes(tag.toLowerCase()));
            }

            const skillProgress = updateSkillProgress(posts || []);
            const streak = calculateStreak(posts || []);
            const achievements = calculateAchievements(posts || [], skillProgress);
            const tagCloud = getTagCloud(posts || []);
            const skills = getSkillsByCategory(skillProgress);

            return res.status(200).json({
                posts: filteredPosts,
                streak,
                achievements,
                tagCloud,
                skills,
                skillProgress,
                isAuthenticated: isAuthenticated(req)
            });
        }

        // POST /api/posts - Create new post
        if (req.method === 'POST') {
            if (!isAuthenticated(req)) {
                return res.status(401).json({ error: 'You must be logged in to post!' });
            }

            const { content } = req.body;
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: 'Content is required' });
            }

            const tags = extractTags(content);
            const detectedSkills = detectSkillsFromContent(content);

            const newPost = {
                id: Date.now().toString(),
                content,
                date: new Date().toISOString(),
                tags,
                detected_skills: Object.keys(detectedSkills)
            };

            const { error } = await supabase.from('posts').insert([newPost]);
            if (error) throw error;

            // Get updated data
            const { data: allPosts } = await supabase.from('posts').select('*').order('date', { ascending: false });
            const skillProgress = updateSkillProgress(allPosts || []);
            const streak = calculateStreak(allPosts || []);
            const achievements = calculateAchievements(allPosts || [], skillProgress);
            const skills = getSkillsByCategory(skillProgress);

            return res.status(201).json({
                post: newPost,
                streak,
                achievements,
                newAchievements: achievements.newlyUnlocked,
                skills,
                detectedSkills: Object.values(detectedSkills).map(s => ({ name: s.name, points: s.points }))
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Posts error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
