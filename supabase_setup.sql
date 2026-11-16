-- Execute este SQL uma única vez no SQL Editor do seu projeto Supabase
-- para habilitar o Backup Online das últimas 10 listas.

CREATE TABLE IF NOT EXISTS public.listas_backup (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    destino TEXT NOT NULL,
    pax_count INTEGER NOT NULL DEFAULT 0,
    driver_count INTEGER NOT NULL DEFAULT 0,
    dados JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listas_backup_created_at
    ON public.listas_backup (created_at DESC);
