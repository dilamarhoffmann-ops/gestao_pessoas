-- ============================================================
-- CORREÇÃO RLS: job_openings
-- Execute este script no Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Colar e executar
-- ============================================================

-- 1. Verificar políticas atuais da tabela
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'job_openings';

-- 2. Verificar se RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'job_openings';

-- ============================================================
-- EXECUTE APENAS SE NECESSÁRIO (descomentar abaixo):
-- ============================================================

-- Opção A: Desabilitar RLS completamente (tabela pública)
-- ALTER TABLE job_openings DISABLE ROW LEVEL SECURITY;

-- Opção B: Limpar políticas existentes e recriar corretamente
-- DROP POLICY IF EXISTS "Authenticated users full access" ON job_openings;
-- ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_authenticated" ON job_openings
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- Opção C: Permitir também usuários anon (mais permissivo)
-- DROP POLICY IF EXISTS "Authenticated users full access" ON job_openings;
-- ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all" ON job_openings
--   FOR ALL
--   TO anon, authenticated
--   USING (true)
--   WITH CHECK (true);
