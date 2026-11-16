const crypto = require('crypto');
const { getConfig, createToken, verifyToken } = require('./_lib');

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
        return res.status(200).json({ authenticated: verifyToken(token) });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { password } = req.body || {};
    const { appPassword } = getConfig();

    const inputBuf = Buffer.from(String(password || ''));
    const expectedBuf = Buffer.from(String(appPassword));

    const match = inputBuf.length === expectedBuf.length && crypto.timingSafeEqual(inputBuf, expectedBuf);
    if (!match) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    return res.status(200).json({ token: createToken() });
};
