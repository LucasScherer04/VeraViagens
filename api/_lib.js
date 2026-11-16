const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function getConfig() {
    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    const appPassword = process.env.APP_PASSWORD || '01010101';
    const signingSecret = process.env.AUTH_SECRET || `${appPassword}:${supabaseKey || 'vera-viagens'}`;
    return { supabaseUrl, supabaseKey, appPassword, signingSecret };
}

function createToken() {
    const { signingSecret } = getConfig();
    const exp = Date.now() + TOKEN_TTL_MS;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    const sig = crypto.createHmac('sha256', signingSecret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function verifyToken(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;
    const { signingSecret } = getConfig();
    const expectedSig = crypto.createHmac('sha256', signingSecret).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return false;
    }
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return typeof data.exp === 'number' && data.exp > Date.now();
    } catch {
        return false;
    }
}

function requireAuth(req, res) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!verifyToken(token)) {
        res.status(401).json({ error: 'Não autorizado. Faça login novamente.' });
        return false;
    }
    return true;
}

async function supabaseFetch(path, options = {}) {
    const { supabaseUrl, supabaseKey } = getConfig();
    if (!supabaseUrl || !supabaseKey) {
        return {
            ok: false,
            status: 500,
            error: 'Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas no servidor.'
        };
    }

    const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    let parsed = null;
    if (text) {
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = text;
        }
    }

    if (!response.ok) {
        const msg = (parsed && (parsed.message || parsed.error || parsed.hint)) || `Erro Supabase (${response.status})`;
        return { ok: false, status: response.status, error: msg, data: parsed };
    }

    return { ok: true, status: response.status, data: parsed };
}

module.exports = {
    getConfig,
    createToken,
    verifyToken,
    requireAuth,
    supabaseFetch
};
