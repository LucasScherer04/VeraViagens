const { requireAuth, supabaseFetch } = require('./_lib');

const MAX_BACKUPS = 10;

module.exports = async function handler(req, res) {
    if (!requireAuth(req, res)) return;

    if (req.method === 'GET') {
        const result = await supabaseFetch(`listas_backup?select=*&order=created_at.desc&limit=${MAX_BACKUPS}`);
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(200).json(result.data || []);
    }

    if (req.method === 'POST') {
        const { nome, destino, pax_count, driver_count, dados } = req.body || {};
        if (!destino || !dados) {
            return res.status(400).json({ error: 'Destino e dados da lista são obrigatórios.' });
        }

        const insertResult = await supabaseFetch('listas_backup', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: [{
                nome: nome || destino,
                destino,
                pax_count: Number(pax_count) || 0,
                driver_count: Number(driver_count) || 0,
                dados
            }]
        });

        if (!insertResult.ok) {
            return res.status(insertResult.status).json({ error: insertResult.error });
        }

        // Mantém no máximo os 10 backups mais recentes no banco
        const extraResult = await supabaseFetch(`listas_backup?select=id&order=created_at.desc&offset=${MAX_BACKUPS}`);
        if (extraResult.ok && Array.isArray(extraResult.data) && extraResult.data.length > 0) {
            const idsToDelete = extraResult.data.map(item => item.id).join(',');
            await supabaseFetch(`listas_backup?id=in.(${idsToDelete})`, { method: 'DELETE' });
        }

        const saved = Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data;
        return res.status(201).json(saved);
    }

    if (req.method === 'DELETE') {
        const { id, all } = req.query || {};
        if (all === 'true') {
            const result = await supabaseFetch('listas_backup?id=gt.0', { method: 'DELETE' });
            if (!result.ok) return res.status(result.status).json({ error: result.error });
            return res.status(200).json({ ok: true });
        }
        if (id) {
            const result = await supabaseFetch(`listas_backup?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!result.ok) return res.status(result.status).json({ error: result.error });
            return res.status(200).json({ ok: true });
        }
        return res.status(400).json({ error: 'Informe id ou all=true.' });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
};
