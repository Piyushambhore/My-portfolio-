// Custom CAPTCHA System - 10 different challenge templates
// Stateless design: answer is encrypted in the token

const crypto = require('crypto');

const CAPTCHA_SECRET = process.env.SESSION_SECRET || 'captcha-secret-key';
const CAPTCHA_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// 10 Different CAPTCHA Templates
const CAPTCHA_TEMPLATES = [
    // Template 1: Math Addition
    {
        type: 'math_add',
        icon: '➕',
        generate: () => {
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 20) + 1;
            return { question: `What is ${a} + ${b}?`, answer: String(a + b) };
        }
    },
    // Template 2: Math Subtraction
    {
        type: 'math_sub',
        icon: '➖',
        generate: () => {
            const a = Math.floor(Math.random() * 30) + 20;
            const b = Math.floor(Math.random() * 15) + 1;
            return { question: `What is ${a} - ${b}?`, answer: String(a - b) };
        }
    },
    // Template 3: Math Multiplication
    {
        type: 'math_mult',
        icon: '✖️',
        generate: () => {
            const a = Math.floor(Math.random() * 10) + 2;
            const b = Math.floor(Math.random() * 10) + 2;
            return { question: `What is ${a} × ${b}?`, answer: String(a * b) };
        }
    },
    // Template 4: Word Count
    {
        type: 'word_count',
        icon: '📝',
        generate: () => {
            const words = ['apple', 'code', 'dev', 'web', 'app', 'api', 'css', 'html', 'js'];
            const count = Math.floor(Math.random() * 4) + 3;
            const selected = [];
            for (let i = 0; i < count; i++) {
                selected.push(words[Math.floor(Math.random() * words.length)]);
            }
            return { question: `How many words: "${selected.join(' ')}"?`, answer: String(count) };
        }
    },
    // Template 5: Reverse Text
    {
        type: 'reverse',
        icon: '🔄',
        generate: () => {
            const words = ['hello', 'world', 'admin', 'login', 'code', 'safe'];
            const word = words[Math.floor(Math.random() * words.length)];
            return { question: `Reverse the word: "${word}"`, answer: word.split('').reverse().join('') };
        }
    },
    // Template 6: Letter Count
    {
        type: 'letter_count',
        icon: '🔤',
        generate: () => {
            const words = ['developer', 'javascript', 'portfolio', 'security', 'programming'];
            const word = words[Math.floor(Math.random() * words.length)];
            const letters = word.split('').filter((c, i, arr) => arr.indexOf(c) === i);
            const letter = letters[Math.floor(Math.random() * letters.length)];
            const count = word.split('').filter(c => c === letter).length;
            return { question: `How many "${letter}" in "${word}"?`, answer: String(count) };
        }
    },
    // Template 7: First Letters (Acronym)
    {
        type: 'acronym',
        icon: '🅰️',
        generate: () => {
            const phrases = [
                { text: 'Good Morning Developer', answer: 'gmd' },
                { text: 'Web App Security', answer: 'was' },
                { text: 'Full Stack Dev', answer: 'fsd' },
                { text: 'Application Program Interface', answer: 'api' },
                { text: 'Hyper Text Markup', answer: 'htm' }
            ];
            const item = phrases[Math.floor(Math.random() * phrases.length)];
            return { question: `First letters of "${item.text}"?`, answer: item.answer };
        }
    },
    // Template 8: Emoji Count
    {
        type: 'emoji_count',
        icon: '🎯',
        generate: () => {
            const emojis = ['🍎', '🚀', '💻', '⭐', '🔥'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const count = Math.floor(Math.random() * 5) + 2;
            const display = emoji.repeat(count);
            return { question: `Count the emojis: ${display}`, answer: String(count) };
        }
    },
    // Template 9: Simple Questions
    {
        type: 'simple_qa',
        icon: '❓',
        generate: () => {
            const questions = [
                { q: 'What color is the sky on a clear day?', a: 'blue' },
                { q: 'What color are most leaves?', a: 'green' },
                { q: 'What is 2+2?', a: '4' },
                { q: 'How many days in a week?', a: '7' },
                { q: 'What comes after 9?', a: '10' }
            ];
            const item = questions[Math.floor(Math.random() * questions.length)];
            return { question: item.q, answer: item.a };
        }
    },
    // Template 10: Number Sequence
    {
        type: 'sequence',
        icon: '🔢',
        generate: () => {
            const start = Math.floor(Math.random() * 10) + 1;
            const step = Math.floor(Math.random() * 3) + 2;
            const missing = start + step * 2;
            return {
                question: `Complete: ${start}, ${start + step}, ?, ${start + step * 3}`,
                answer: String(missing)
            };
        }
    }
];

// Encrypt data for token
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(CAPTCHA_SECRET, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt data from token
function decrypt(text) {
    try {
        const [ivHex, encrypted] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto.scryptSync(CAPTCHA_SECRET, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null;
    }
}

// Generate a new CAPTCHA challenge
function generateCaptcha() {
    const templateIndex = Math.floor(Math.random() * CAPTCHA_TEMPLATES.length);
    const template = CAPTCHA_TEMPLATES[templateIndex];
    const { question, answer } = template.generate();

    // Create token with encrypted answer and timestamp
    const timestamp = Date.now();
    const payload = JSON.stringify({ answer: answer.toLowerCase().trim(), exp: timestamp + CAPTCHA_EXPIRY_MS });
    const token = encrypt(payload);

    return {
        token: token,
        type: template.type,
        icon: template.icon,
        question: question,
        expiresIn: CAPTCHA_EXPIRY_MS / 1000
    };
}

// Verify CAPTCHA answer
function verifyCaptcha(token, userAnswer) {
    if (!token || !userAnswer) {
        return { valid: false, error: 'Missing CAPTCHA token or answer' };
    }

    try {
        const decrypted = decrypt(token);
        if (!decrypted) {
            return { valid: false, error: 'Invalid CAPTCHA token' };
        }

        const payload = JSON.parse(decrypted);

        // Check if expired
        if (Date.now() > payload.exp) {
            return { valid: false, error: 'CAPTCHA expired. Please refresh.' };
        }

        // Compare answers (case-insensitive, trimmed)
        const correct = payload.answer === userAnswer.toLowerCase().trim();

        if (correct) {
            return { valid: true };
        } else {
            return { valid: false, error: 'Incorrect answer. Please try again.' };
        }
    } catch (e) {
        return { valid: false, error: 'Invalid CAPTCHA token' };
    }
}

module.exports = {
    generateCaptcha,
    verifyCaptcha,
    CAPTCHA_TEMPLATES
};
