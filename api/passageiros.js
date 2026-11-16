const { requireAuth, supabaseFetch } = require('./_lib');

module.exports = async function handler(req, res) {
    if (!requireAuth(req, res)) return;

    if (req.method === 'GET') {
        const result = await supabaseFetch('passageiros?select=*&order=id.asc');
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(200).json(result.data || []);
    }

    if (req.method === 'POST') {
        const payload = req.body;
        if (!payload || !payload.nome || !payload.cpf) {
            return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
        }
        const result = await supabaseFetch('passageiros', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: [payload]
        });
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(201).json(Array.isArray(result.data) ? result.data[0] : result.data);
    }

    if (req.method === 'PUT') {
        const { id, ...fields } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: 'ID do passageiro é obrigatório.' });
        }
        const result = await supabaseFetch(`passageiros?id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: fields
        });
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(200).json(Array.isArray(result.data) ? result.data[0] : result.data);
    }

    return res.status(405).json({ error: 'Método não permitido.' });
};
