const { supabaseFetch } = require('./_lib');

module.exports = async function handler(req, res) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        // Permite também chamada do Vercel Cron sem header se CRON_SECRET não estiver definido
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await supabaseFetch('passageiros?select=id&limit=1');
    if (!result.ok) {
        return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.status(200).json({
        ok: true,
        message: 'Supabase keep-alive executado com sucesso.',
        timestamp: new Date().toISOString()
    });
};
