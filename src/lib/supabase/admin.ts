import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

export function createSupabaseAdmin() {
  const readEnv = (key: string): string | undefined => {
    const files = ['.env.local', '.env'];
    for (const name of files) {
      try {
        const p = path.resolve(process.cwd(), name);
        if (!fs.existsSync(p)) continue;
        const content = fs.readFileSync(p, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx === -1) continue;
          const k = trimmed.slice(0, idx).trim();
          let v = trimmed.slice(idx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (k === key) {
            console.log(`→ readEnv(${key}) manual from ${name}:`, v ? `${v.substring(0, 8)}...` : '(EMPTY)');
            if (v) return v;
          }
        }
      } catch {}
    }
    return undefined;
  };

  let supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || readEnv('NEXT_PUBLIC_SUPABASE_URL') || process.env['SUPABASE_URL'] || readEnv('SUPABASE_URL');
  let serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || readEnv('SUPABASE_SERVICE_ROLE_KEY');
  console.log('→ readEnv URL:', supabaseUrl ?? '(UNDEFINED)');
  console.log('→ readEnv KEY:', serviceRoleKey ? `Inicia com: ${serviceRoleKey.substring(0,5)}...` : '(UNDEFINED)');

  console.log('--- DEBUGGING SUPABASE ADMIN ---');
  console.log('1. Buscando URL:', supabaseUrl ? supabaseUrl : '(UNDEFINED/NULL)');
  console.log('2. Buscando KEY:', serviceRoleKey ? `Inicia com: ${serviceRoleKey.substring(0, 5)}...` : '(UNDEFINED/NULL)');

  if (!supabaseUrl || !serviceRoleKey) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
    supabaseUrl = supabaseUrl || process.env['NEXT_PUBLIC_SUPABASE_URL'] || process.env['SUPABASE_URL'] || readEnv('NEXT_PUBLIC_SUPABASE_URL') || readEnv('SUPABASE_URL');
    serviceRoleKey = serviceRoleKey || process.env['SUPABASE_SERVICE_ROLE_KEY'] || readEnv('SUPABASE_SERVICE_ROLE_KEY');
    console.log('→ readEnv (após dotenv) URL:', supabaseUrl ?? '(UNDEFINED)');
    console.log('→ readEnv (após dotenv) KEY:', serviceRoleKey ? `Inicia com: ${serviceRoleKey.substring(0,5)}...` : '(UNDEFINED)');
    console.log('3. Após dotenv .env:', supabaseUrl ? supabaseUrl : '(UNDEFINED/NULL)');
    console.log('4. Após dotenv KEY:', serviceRoleKey ? `Inicia com: ${serviceRoleKey.substring(0, 5)}...` : '(UNDEFINED/NULL)');

    if (!supabaseUrl || !serviceRoleKey) {
      supabaseUrl = supabaseUrl || readEnv('NEXT_PUBLIC_SUPABASE_URL') || readEnv('SUPABASE_URL');
      serviceRoleKey = serviceRoleKey || readEnv('SUPABASE_SERVICE_ROLE_KEY');

      const candidates = ['.env.local', '.env'];
      for (const name of candidates) {
        const p = path.resolve(process.cwd(), name);
        console.log('→ Tentando ler manualmente:', p);
        if (!fs.existsSync(p)) continue;
        const content = fs.readFileSync(p, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx === -1) continue;
          const key = trimmed.slice(0, idx).trim();
          let value = trimmed.slice(idx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) supabaseUrl = value;
          if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceRoleKey) serviceRoleKey = value;
        }
      }
      console.log('5. Após leitura manual .env URL:', supabaseUrl ? supabaseUrl : '(UNDEFINED/NULL)');
      console.log('6. Após leitura manual KEY:', serviceRoleKey ? `Inicia com: ${serviceRoleKey.substring(0, 5)}...` : '(UNDEFINED/NULL)');
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(`Missing Supabase admin environment variables. URL: ${supabaseUrl ? 'OK' : 'Missing'}, KEY: ${serviceRoleKey ? 'OK' : 'Missing'}`);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
