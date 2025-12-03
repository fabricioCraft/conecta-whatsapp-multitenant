'use server'

import { redirect } from 'next/navigation'
import { registerUserWithOrg } from '@/services/auth-service'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

function extract(data: FormData) {
  const email = String(data.get('email') ?? '')
  const password = String(data.get('password') ?? '')
  const fullName = String(data.get('fullName') ?? '')
  const companyName = String(data.get('companyName') ?? data.get('orgName') ?? '')
  return { email, password, fullName, companyName }
}

export async function signupAction(prevState: any, formData?: FormData) {
  let shouldRedirect = false
  const fd = (formData ?? (prevState as FormData)) as FormData
  try {
    const { email, password, fullName, companyName } = extract(fd)
    const admin = createSupabaseAdmin()
    await registerUserWithOrg(admin as any, { email, password, fullName, companyName })

    const supabase = await createSSRClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error.message, success: false }
    }
    shouldRedirect = true
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao realizar cadastro', success: false }
  }
  if (shouldRedirect) {
    redirect('/dashboard')
  }
}
