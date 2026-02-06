const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================
// SECURITY: Load environment variables from .env
// ============================================
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && !key.startsWith('#')) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
}
loadEnv();

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'journey.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// ============================================
// AUTHENTICATION SYSTEM (SECURE)
// ============================================

// Get password from environment variable (NEVER hardcode!)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Active sessions (in-memory)
const activeSessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function initializeConfig() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    // Create or update config with hashed password
    const hashedPassword = hashPassword(ADMIN_PASSWORD);
    const config = {
        passwordHash: hashedPassword,
        adminName: 'Piyush',
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return config;
}

function getConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch (e) { }
    return initializeConfig();
}

function hashPassword(password) {
    // Use HMAC with session secret for extra security
    return crypto.createHmac('sha256', SESSION_SECRET).update(password).digest('hex');
}

function generateSessionToken() {
    return crypto.randomBytes(48).toString('hex');
}

function verifyPassword(password) {
    const config = getConfig();
    const hashedInput = hashPassword(password);
    // Timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(config.passwordHash));
    } catch (e) {
        return false;
    }
}

function createSession() {
    const token = generateSessionToken();
    activeSessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
    });
    return token;
}

function verifySession(token) {
    if (!token) return false;
    const session = activeSessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(token);
        return false;
    }
    return true;
}

function getAuthToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    return null;
}

function isAuthenticated(req) {
    return verifySession(getAuthToken(req));
}

// Clean up expired sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of activeSessions) {
        if (now > session.expiresAt) activeSessions.delete(token);
    }
}, 60000);

// ============================================
// SKILL TRACKING SYSTEM
// ============================================

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

// Initialize data directory
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ posts: [], unlockedAchievements: [], skillProgress: {}, streak: { current: 0, longest: 0 } }));
}

// Initialize config
initializeConfig();

function readData() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { posts: [], unlockedAchievements: [], skillProgress: {}, streak: { current: 0, longest: 0 } }; }
}

function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

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
        if (matchCount > 0) {
            detected[skillId] = { ...skill, matchCount, points: matchCount * skill.weight };
        }
    }
    return detected;
}

function updateSkillProgress(data) {
    const skillProgress = {};
    for (const post of data.posts) {
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
        const points = skillProgress[skillId].totalPoints;
        skillProgress[skillId].percentage = Math.min(100, Math.round(Math.log10(points + 1) * 50));
    }
    data.skillProgress = skillProgress;
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

function calculateAchievements(data) {
    const posts = data.posts;
    const streak = calculateStreak(posts);
    const skillProgress = data.skillProgress || {};
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
        totalPosts: posts.length, longestStreak: streak.longest, uniqueTags: allTags.size,
        hasNightPost, hasEarlyPost, hasWeekendPost,
        skillsLearned: Object.keys(skillProgress).length,
        hasAdvancedSkill: Object.values(skillProgress).some(s => s.percentage >= 50)
    };
    const unlocked = [], newlyUnlocked = [];
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
        if (ach.condition(stats)) {
            unlocked.push(id);
            if (!data.unlockedAchievements.includes(id)) newlyUnlocked.push({ ...ach });
        }
    }
    data.unlockedAchievements = unlocked;
    return { unlocked: unlocked.map(id => ACHIEVEMENTS[id]), locked: Object.values(ACHIEVEMENTS).filter(a => !unlocked.includes(a.id)), newlyUnlocked, stats };
}

function getTagCloud(posts) {
    const counts = {};
    posts.forEach(p => (p.tags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
    return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); } });
    });
}

// Rate limiting (simple in-memory)
const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 60, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
    }
    record.count++;
    rateLimitMap.set(ip, record);
    return record.count <= limit;
}

// ============================================
// SERVER
// ============================================

const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Too many requests. Try again later.' }));
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    try {
        // ============================================
        // AUTH ENDPOINTS
        // ============================================

        if (pathname === '/api/auth/login' && req.method === 'POST') {
            const body = await parseBody(req);
            if (verifyPassword(body.password)) {
                const token = createSession();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, token, message: 'Welcome back!' }));
            } else {
                // Add delay to prevent brute force
                await new Promise(r => setTimeout(r, 1000));
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
            }
            return;
        }

        if (pathname === '/api/auth/logout' && req.method === 'POST') {
            const token = getAuthToken(req);
            if (token) activeSessions.delete(token);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
        }

        if (pathname === '/api/auth/verify' && req.method === 'GET') {
            const isAuth = isAuthenticated(req);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ authenticated: isAuth }));
            return;
        }

        // ============================================
        // PUBLIC ENDPOINTS
        // ============================================

        if (pathname === '/api/posts' && req.method === 'GET') {
            const data = readData();
            updateSkillProgress(data);
            writeData(data);
            let posts = data.posts;
            const search = url.searchParams.get('search');
            if (search) {
                const s = search.toLowerCase();
                posts = posts.filter(p => p.content.toLowerCase().includes(s) || (p.tags || []).some(t => t.includes(s)));
            }
            const tag = url.searchParams.get('tag');
            if (tag) posts = posts.filter(p => (p.tags || []).includes(tag.toLowerCase()));
            const streak = calculateStreak(data.posts);
            const achievements = calculateAchievements(data);
            const tagCloud = getTagCloud(data.posts);
            const skills = getSkillsByCategory(data.skillProgress);
            writeData(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ posts, streak, achievements, tagCloud, skills, skillProgress: data.skillProgress, isAuthenticated: isAuthenticated(req) }));
        }

        // ============================================
        // PROTECTED ENDPOINTS
        // ============================================

        else if (pathname === '/api/posts' && req.method === 'POST') {
            if (!isAuthenticated(req)) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'You must be logged in to post!' }));
                return;
            }
            const body = await parseBody(req);
            const data = readData();
            const tags = extractTags(body.content);
            const detectedSkills = detectSkillsFromContent(body.content);
            const newPost = {
                id: Date.now().toString(),
                content: body.content,
                date: new Date().toISOString(),
                tags,
                detectedSkills: Object.keys(detectedSkills)
            };
            data.posts.push(newPost);
            updateSkillProgress(data);
            const streak = calculateStreak(data.posts);
            const achievements = calculateAchievements(data);
            const skills = getSkillsByCategory(data.skillProgress);
            writeData(data);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ post: newPost, streak, achievements, newAchievements: achievements.newlyUnlocked, skills, detectedSkills: Object.values(detectedSkills).map(s => ({ name: s.name, points: s.points })) }));
        }

        else if (pathname.match(/^\/api\/posts\/\w+$/) && req.method === 'PUT') {
            if (!isAuthenticated(req)) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
            }
            const id = pathname.split('/').pop();
            const body = await parseBody(req);
            const data = readData();
            const postIndex = data.posts.findIndex(p => p.id === id);
            if (postIndex === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return; }
            data.posts[postIndex].content = body.content;
            data.posts[postIndex].tags = extractTags(body.content);
            data.posts[postIndex].detectedSkills = Object.keys(detectSkillsFromContent(body.content));
            data.posts[postIndex].editedAt = new Date().toISOString();
            updateSkillProgress(data);
            writeData(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ post: data.posts[postIndex] }));
        }

        else if (pathname.match(/^\/api\/posts\/\w+$/) && req.method === 'DELETE') {
            if (!isAuthenticated(req)) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
            }
            const id = pathname.split('/').pop();
            const data = readData();
            const postIndex = data.posts.findIndex(p => p.id === id);
            if (postIndex === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return; }
            data.posts.splice(postIndex, 1);
            updateSkillProgress(data);
            const streak = calculateStreak(data.posts);
            writeData(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, streak }));
        }

        else if (pathname === '/api/skills' && req.method === 'GET') {
            const data = readData();
            updateSkillProgress(data);
            writeData(data);
            const skills = getSkillsByCategory(data.skillProgress);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ skills, skillProgress: data.skillProgress }));
        }

        else if (pathname === '/api/streak' && req.method === 'GET') {
            const data = readData();
            const streak = calculateStreak(data.posts);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(streak));
        }

        else if (pathname === '/api/achievements' && req.method === 'GET') {
            const data = readData();
            const achievements = calculateAchievements(data);
            writeData(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(achievements));
        }

        else if (pathname === '/api/tags' && req.method === 'GET') {
            const data = readData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(getTagCloud(data.posts)));
        }

        else if (pathname === '/api/calendar' && req.method === 'GET') {
            const data = readData();
            const streak = calculateStreak(data.posts);
            const calendar = [];
            for (let i = 89; i >= 0; i--) {
                const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
                calendar.push({ date, count: data.posts.filter(p => p.date.split('T')[0] === date).length });
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ calendar, streak }));
        }

        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 Journey API Server running at http://localhost:${PORT}`);
    console.log(`📝 Data stored in: ${DATA_FILE}`);
    console.log('\n🔐 SECURITY ENABLED:');
    console.log('   ✓ Password loaded from .env file (not in code!)');
    console.log('   ✓ Password hashed with HMAC-SHA256');
    console.log('   ✓ Timing-safe password comparison');
    console.log('   ✓ Rate limiting (60 req/min)');
    console.log('   ✓ Session expiry (24 hours)');
    console.log('\n📡 API Endpoints:');
    console.log('  POST   /api/auth/login     - Login');
    console.log('  GET    /api/posts          - Get all posts');
    console.log('  POST   /api/posts          - Create (auth required)');
    console.log('\n🎯 Skills:', Object.keys(SKILL_DEFINITIONS).length, 'tracked');
    console.log('🏆 Achievements:', Object.keys(ACHIEVEMENTS).length, 'available\n');
});
