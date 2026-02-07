// Skill definitions for auto-detection
const SKILL_DEFINITIONS = {
    html: { name: 'HTML5', category: 'frontend', icon: 'code', keywords: ['html', 'html5', 'markup', 'semantic', 'tags', 'elements', 'dom', 'document'], weight: 1 },
    css: { name: 'CSS3', category: 'frontend', icon: 'paint-brush', keywords: ['css', 'css3', 'styles', 'styling', 'flexbox', 'grid', 'animations', 'transitions', 'responsive', 'media queries', 'selectors'], weight: 1 },
    javascript: { name: 'JavaScript', category: 'frontend', icon: 'brackets-curly', keywords: ['javascript', 'js', 'es6', 'es2015', 'async', 'await', 'promises', 'functions', 'arrays', 'objects', 'dom manipulation', 'events', 'callbacks', 'closures'], weight: 1.5 },
    react: { name: 'React', category: 'frontend', icon: 'atom', keywords: ['react', 'reactjs', 'jsx', 'components', 'hooks', 'usestate', 'useeffect', 'props', 'state', 'redux'], weight: 2 },
    typescript: { name: 'TypeScript', category: 'frontend', icon: 'file-ts', keywords: ['typescript', 'ts', 'types', 'interfaces', 'generics'], weight: 2 },
    vue: { name: 'Vue.js', category: 'frontend', icon: 'code', keywords: ['vue', 'vuejs', 'vue.js', 'vuex', 'composition api'], weight: 2 },
    tailwind: { name: 'Tailwind CSS', category: 'frontend', icon: 'wind', keywords: ['tailwind', 'tailwindcss', 'utility classes'], weight: 1.5 },
    nodejs: { name: 'Node.js', category: 'backend', icon: 'tree-structure', keywords: ['node', 'nodejs', 'node.js', 'express', 'npm', 'backend', 'server', 'api', 'rest'], weight: 2 },
    python: { name: 'Python', category: 'backend', icon: 'snake', keywords: ['python', 'py', 'django', 'flask', 'fastapi', 'pip'], weight: 1.5 },
    java: { name: 'Java', category: 'backend', icon: 'coffee', keywords: ['java', 'spring', 'springboot', 'maven', 'gradle'], weight: 2 },
    sql: { name: 'SQL', category: 'backend', icon: 'database', keywords: ['sql', 'mysql', 'postgresql', 'postgres', 'database', 'queries', 'mongodb', 'nosql'], weight: 1.5 },
    git: { name: 'Git', category: 'devops', icon: 'git-branch', keywords: ['git', 'github', 'gitlab', 'version control', 'commits', 'branches', 'merge', 'pull request'], weight: 1 },
    docker: { name: 'Docker', category: 'devops', icon: 'cube', keywords: ['docker', 'containers', 'dockerfile', 'docker-compose'], weight: 2 },
    aws: { name: 'AWS', category: 'devops', icon: 'cloud', keywords: ['aws', 'amazon', 'ec2', 's3', 'lambda', 'cloud'], weight: 2.5 },
    linux: { name: 'Linux', category: 'devops', icon: 'terminal', keywords: ['linux', 'ubuntu', 'bash', 'shell', 'terminal', 'cli'], weight: 1.5 },
    figma: { name: 'Figma', category: 'design', icon: 'figma-logo', keywords: ['figma', 'ui design', 'ux design', 'prototyping', 'wireframes'], weight: 1.5 },
    api: { name: 'APIs', category: 'backend', icon: 'plugs-connected', keywords: ['api', 'apis', 'rest', 'graphql', 'endpoints', 'fetch', 'axios'], weight: 1.5 },
    dsa: { name: 'DSA', category: 'fundamentals', icon: 'tree-structure', keywords: ['dsa', 'data structures', 'algorithms', 'arrays', 'linked list', 'trees', 'graphs', 'sorting', 'leetcode'], weight: 2 }
};

const ACHIEVEMENTS = {
    first_post: { id: 'first_post', name: 'First Step', icon: '🌱', description: 'Posted your first learning', condition: (s) => s.totalPosts >= 1 },
    streak_3: { id: 'streak_3', name: 'Getting Started', icon: '🔥', description: '3 day streak', condition: (s) => s.longestStreak >= 3 },
    streak_7: { id: 'streak_7', name: 'Week Warrior', icon: '⚡', description: '7 day streak', condition: (s) => s.longestStreak >= 7 },
    streak_14: { id: 'streak_14', name: 'Two Week Champion', icon: '💪', description: '14 day streak', condition: (s) => s.longestStreak >= 14 },
    streak_30: { id: 'streak_30', name: 'Monthly Master', icon: '👑', description: '30 day streak', condition: (s) => s.longestStreak >= 30 },
    posts_5: { id: 'posts_5', name: 'Getting Serious', icon: '📝', description: '5 total entries', condition: (s) => s.totalPosts >= 5 },
    posts_10: { id: 'posts_10', name: 'Double Digits', icon: '🎯', description: '10 total entries', condition: (s) => s.totalPosts >= 10 },
    posts_25: { id: 'posts_25', name: 'Quarter Century', icon: '📚', description: '25 total entries', condition: (s) => s.totalPosts >= 25 },
    posts_50: { id: 'posts_50', name: 'Half Century', icon: '🏆', description: '50 total entries', condition: (s) => s.totalPosts >= 50 },
    posts_100: { id: 'posts_100', name: 'Centurion', icon: '💎', description: '100 total entries', condition: (s) => s.totalPosts >= 100 },
    tags_5: { id: 'tags_5', name: 'Tag Explorer', icon: '🏷️', description: 'Used 5 different tags', condition: (s) => s.uniqueTags >= 5 },
    tags_10: { id: 'tags_10', name: 'Tag Master', icon: '🎨', description: 'Used 10 different tags', condition: (s) => s.uniqueTags >= 10 },
    night_owl: { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Posted after midnight', condition: (s) => s.hasNightPost },
    early_bird: { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'Posted before 6 AM', condition: (s) => s.hasEarlyPost },
    weekend_warrior: { id: 'weekend_warrior', name: 'Weekend Warrior', icon: '🎮', description: 'Posted on a weekend', condition: (s) => s.hasWeekendPost },
    skill_learner: { id: 'skill_learner', name: 'Skill Learner', icon: '📖', description: 'Learned 3 skills', condition: (s) => s.skillsLearned >= 3 },
    skill_master: { id: 'skill_master', name: 'Skill Master', icon: '🎓', description: '50% in any skill', condition: (s) => s.hasAdvancedSkill },
};

function extractTags(content) {
    const matches = content.match(/#(\w+)/g) || [];
    return [...new Set(matches.map(t => t.toLowerCase()))];
}

function detectSkillsFromContent(content) {
    const contentLower = content.toLowerCase();
    const detected = {};
    for (const [skillId, skill] of Object.entries(SKILL_DEFINITIONS)) {
        let matchCount = 0;
        for (const keyword of skill.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = contentLower.match(regex);
            if (matches) matchCount += matches.length;
        }
        if (matchCount > 0) detected[skillId] = { ...skill, matchCount, points: matchCount * skill.weight };
    }
    return detected;
}

function updateSkillProgress(posts) {
    const skillProgress = {};
    for (const post of posts) {
        const detected = detectSkillsFromContent(post.content);
        for (const [skillId, skillData] of Object.entries(detected)) {
            if (!skillProgress[skillId]) {
                skillProgress[skillId] = { ...SKILL_DEFINITIONS[skillId], totalPoints: 0, mentions: 0, firstLearned: post.date, lastLearned: post.date };
            }
            skillProgress[skillId].totalPoints += skillData.points;
            skillProgress[skillId].mentions++;
            skillProgress[skillId].lastLearned = post.date;
        }
    }
    for (const skillId of Object.keys(skillProgress)) {
        skillProgress[skillId].percentage = Math.min(100, Math.round(Math.log10(skillProgress[skillId].totalPoints + 1) * 50));
    }
    return skillProgress;
}

function getSkillsByCategory(skillProgress) {
    const categories = {
        frontend: { name: 'Frontend', icon: 'code', skills: [], totalProgress: 0 },
        backend: { name: 'Backend', icon: 'database', skills: [], totalProgress: 0 },
        devops: { name: 'DevOps', icon: 'cloud', skills: [], totalProgress: 0 },
        design: { name: 'Design', icon: 'paint-brush-broad', skills: [], totalProgress: 0 },
        fundamentals: { name: 'Fundamentals', icon: 'book-open', skills: [], totalProgress: 0 }
    };
    for (const [skillId, skill] of Object.entries(skillProgress)) {
        const cat = skill.category || 'fundamentals';
        if (categories[cat]) {
            categories[cat].skills.push({ id: skillId, ...skill });
            categories[cat].totalProgress += skill.percentage;
        }
    }
    for (const cat of Object.values(categories)) {
        cat.averageProgress = cat.skills.length > 0 ? Math.round(cat.totalProgress / cat.skills.length) : 0;
        cat.skills.sort((a, b) => b.percentage - a.percentage);
    }
    return categories;
}

function calculateStreak(posts) {
    if (!posts.length) return { current: 0, longest: 0, lastPostDate: null, activeDays: [] };
    const activeDays = [...new Set(posts.map(p => new Date(p.date).toISOString().split('T')[0]))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let currentStreak = 0, longestStreak = 0, tempStreak = 0, lastDate = null;
    const sortedDays = [...activeDays].sort();
    for (const day of sortedDays) {
        const curr = new Date(day);
        tempStreak = !lastDate ? 1 : (Math.floor((curr - lastDate) / 86400000) === 1 ? tempStreak + 1 : 1);
        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = curr;
    }
    if (activeDays.includes(today) || activeDays.includes(yesterday)) {
        let checkDate = activeDays.includes(today) ? today : yesterday;
        currentStreak = 1;
        while (activeDays.includes(new Date(new Date(checkDate).getTime() - 86400000).toISOString().split('T')[0])) {
            currentStreak++;
            checkDate = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split('T')[0];
        }
    }
    return { current: currentStreak, longest: longestStreak, lastPostDate: activeDays[0] || null, activeDays: activeDays.slice(0, 365) };
}

function calculateAchievements(posts, skillProgress, unlockedAchievements = []) {
    const streak = calculateStreak(posts);
    const allTags = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));
    let hasNightPost = false, hasEarlyPost = false, hasWeekendPost = false;
    posts.forEach(p => {
        const d = new Date(p.date);
        if (d.getHours() >= 0 && d.getHours() < 5) hasNightPost = true;
        if (d.getHours() >= 5 && d.getHours() < 6) hasEarlyPost = true;
        if (d.getDay() === 0 || d.getDay() === 6) hasWeekendPost = true;
    });
    const stats = {
        totalPosts: posts.length,
        longestStreak: streak.longest,
        uniqueTags: allTags.size,
        hasNightPost, hasEarlyPost, hasWeekendPost,
        skillsLearned: Object.keys(skillProgress).length,
        hasAdvancedSkill: Object.values(skillProgress).some(s => s.percentage >= 50)
    };
    const unlocked = [], newlyUnlocked = [];
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
        if (ach.condition(stats)) {
            unlocked.push(id);
            if (!unlockedAchievements.includes(id)) newlyUnlocked.push({ ...ach });
        }
    }
    return {
        unlocked: unlocked.map(id => ACHIEVEMENTS[id]),
        locked: Object.values(ACHIEVEMENTS).filter(a => !unlocked.includes(a.id)),
        newlyUnlocked,
        stats
    };
}

function getTagCloud(posts) {
    const counts = {};
    posts.forEach(p => (p.tags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
    return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

module.exports = {
    SKILL_DEFINITIONS,
    ACHIEVEMENTS,
    extractTags,
    detectSkillsFromContent,
    updateSkillProgress,
    getSkillsByCategory,
    calculateStreak,
    calculateAchievements,
    getTagCloud
};
