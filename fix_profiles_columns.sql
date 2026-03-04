-- Adiciona colunas faltantes na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowed_menus TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approver BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Atualiza permissões (opcional, mas recomendado se as políticas de RLS estiverem bloqueando)
-- DROP POLICY IF EXISTS "Authenticated users full access" ON profiles;
-- CREATE POLICY "Authenticated users full access" ON profiles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
