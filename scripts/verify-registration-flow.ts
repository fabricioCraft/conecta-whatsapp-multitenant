import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'node:fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}
console.log('ENV URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ENV SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

async function main() {
  console.log('🔄 Iniciando Verificação de Cadastro Multitenant...');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERRO CRÍTICO: Variáveis de ambiente não carregadas.');
    console.log('Conteúdo atual de URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  }

  const { createSupabaseAdmin } = await import('../src/lib/supabase/admin');
  const { registerUserWithOrg } = await import('../src/services/auth-service');
  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    const envPath = path.resolve(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const map: Record<string, string> = {};
    for (const line of lines) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      map[key] = value;
    }
    const url = map['NEXT_PUBLIC_SUPABASE_URL'];
    const key = map['SUPABASE_SERVICE_ROLE_KEY'];
    console.log('FALLBACK URL:', url);
    console.log('FALLBACK KEY:', key ? 'SET' : 'MISSING');
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  console.log('✅ Supabase Admin conectado.');

  const EMPRESA = "Evolutta Teste Ltda";
  const DONO = { email: "dono@evolutta-test.com", pass: "123456", name: "Carlos Dono" };
  const FUNC = { email: "ana@evolutta-test.com", pass: "123456", name: "Ana Func" };

  console.log('🧹 Limpando usuários antigos...');
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const usersToDelete = (data?.users ?? []).filter((u: any) => u.email === DONO.email || u.email === FUNC.email);
  for (const u of usersToDelete) {
    await supabase.auth.admin.deleteUser(u.id);
  }

  console.log('👤 Cadastrando Dono...');
  const resDono = await registerUserWithOrg({
    email: DONO.email,
    password: DONO.pass,
    fullName: DONO.name,
    companyName: EMPRESA,
  });

  console.log('👤 Cadastrando Funcionário...');
  const resFunc = await registerUserWithOrg({
    email: FUNC.email,
    password: FUNC.pass,
    fullName: FUNC.name,
    companyName: EMPRESA,
  });

  console.log('\n📊 RESULTADO FINAL DO TESTE:');
  console.table([
    { User: 'Dono', OrgID: resDono.orgId, Role: resDono.role },
    { User: 'Func', OrgID: resFunc.orgId, Role: resFunc.role },
  ]);

  if (resDono.orgId === resFunc.orgId && resDono.role === 'admin' && resFunc.role === 'member') {
    console.log('\n✅✅ SUCESSO! A lógica Multitenant está perfeita.');
  } else {
    console.error('\n❌❌ FALHA! Os IDs não batem ou as permissões estão erradas.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
