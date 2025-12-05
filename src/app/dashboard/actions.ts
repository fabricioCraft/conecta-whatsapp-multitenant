'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

type CreateInstanceState = { error?: string; success?: boolean; message?: string } | null

export async function createInstanceAction(prevState: CreateInstanceState, formData?: FormData): Promise<CreateInstanceState> {
  const fd = (formData ?? (prevState as unknown as FormData)) as FormData
  const csrfOk = (() => {
    const c = cookies().get('csrf_token')?.value
    const t = String(fd.get('csrfToken') ?? '')
    return !!c && !!t && c === t
  })()
  if (!csrfOk) {
    return { error: 'CSRF inválido', success: false }
  }
  const instanceName = String(fd.get('instanceName') ?? '').trim()
  const token = String(fd.get('token') ?? '').trim()
  if (!instanceName) {
    return { error: 'Nome da Instância é obrigatório', success: false }
  }
  if (!token) {
    return { error: 'Token é obrigatório', success: false }
  }

  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes?.user
  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return { error: 'Não foi possível obter a organização do usuário', success: false }
  }

  const payload = {
    instanceName,
    organizationId: profile.organization_id,
    userId: user!.id,
    token,
  }

  const url = 'https://webhooks.evolutta.com.br/webhook/api/v1/criar-instancias'
  let status = 0
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    status = resp.status
    if (status === 200 || status === 201) {
      revalidatePath('/dashboard')
      return { success: true }
    }
    try {
      const json = await resp.json()
      return { error: json?.message ?? 'Falha ao criar instância', success: false }
    } catch {
      const text = await resp.text()
      return { error: text || 'Falha ao criar instância', success: false }
    }
  } catch (e: any) {
    return { error: e?.message ?? `Falha ao criar instância (status ${status})`, success: false }
  }
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

type UpdateInstanceState = { error?: string; success?: boolean; message?: string } | null

export async function updateInstanceAction(prevState: UpdateInstanceState, formData?: FormData): Promise<UpdateInstanceState> {
  const fd = (formData ?? (prevState as unknown as FormData)) as FormData
  const csrfOk = (() => {
    const c = cookies().get('csrf_token')?.value
    const t = String(fd.get('csrfToken') ?? '')
    return !!c && !!t && c === t
  })()
  if (!csrfOk) {
    return { error: 'CSRF inválido', success: false }
  }
  const instanceId = String(fd.get('instanceId') ?? '').trim()
  const webhookUrl = String(fd.get('webhookUrl') ?? '').trim()
  if (!instanceId || !webhookUrl) {
    return { error: 'Campos obrigatórios ausentes', success: false }
  }

  const safeWebhook = (() => {
    try {
      const u = new URL(webhookUrl)
      if (u.protocol !== 'https:') return false
      const h = u.hostname.toLowerCase()
      if (h === 'localhost' || h.endsWith('.local') || h === '::1') return false
      const ipv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(h)
      if (ipv4) {
        const p = h.split('.').map((n) => parseInt(n, 10))
        if (p[0] === 10) return false
        if (p[0] === 127) return false
        if (p[0] === 169 && p[1] === 254) return false
        if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false
        if (p[0] === 192 && p[1] === 168) return false
      }
      return true
    } catch {
      return false
    }
  })()
  if (!safeWebhook) {
    return { error: 'Webhook URL inválida ou não permitida', success: false }
  }

  const supabase = createClient()
  const { data: tokenRes, error: tokenError } = await supabase
    .from('instances')
    .select('token')
    .eq('id', instanceId)
    .single()

  if (tokenError || !tokenRes?.token) {
    return { error: 'Token não encontrado para esta instância', success: false }
  }

  try {
    const response = await fetch('https://manager.dinastiapi.evolutta.com.br/webhook', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'token': String(tokenRes.token),
      },
      body: JSON.stringify({ webhookurl: webhookUrl, events: ['All'], Active: true }),
    })

    const responseData = await response.json().catch(() => ({} as any))

    if (!response.ok) {
      const message = (responseData && (responseData.message || responseData.error)) || `Falha na DinastiAPI (status ${response.status})`
      return { error: message, success: false }
    }
  } catch (e: any) {
    return { error: e?.message ?? 'Falha na DinastiAPI', success: false }
  }

  const { error: upError } = await supabase
    .from('instances')
    .update({ webhook: webhookUrl })
    .eq('id', instanceId)

  if (upError) {
    return { error: upError.message ?? 'Falha ao atualizar instância', success: false }
  }

  revalidatePath('/dashboard')
  return { success: true, message: 'Webhook atualizado com sucesso!' }
}

type ConnectQrState = { success?: boolean; error?: string; qrCode?: string } | null

export async function connectAndGetQrAction(prevState: ConnectQrState, formData?: FormData): Promise<ConnectQrState> {
  const fd = (formData ?? (prevState as unknown as FormData)) as FormData
  const csrfOk = (() => {
    const c = cookies().get('csrf_token')?.value
    const t = String(fd.get('csrfToken') ?? '')
    return !!c && !!t && c === t
  })()
  if (!csrfOk) {
    return { success: false, error: 'CSRF inválido' }
  }
  const instanceId = String(fd.get('instanceId') ?? '').trim()
  if (!instanceId) {
    return { success: false, error: 'Instância inválida' }
  }

  const supabase = createClient()
  const { data: tokenRes, error: tokenError } = await supabase
    .from('instances')
    .select('token')
    .eq('id', instanceId)
    .single()

  if (tokenError || !tokenRes?.token) {
    return { success: false, error: 'Token não encontrado para esta instância' }
  }

  const token = String(tokenRes.token)

  try {
    await fetch('https://manager.dinastiapi.evolutta.com.br/session/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
      body: JSON.stringify({ Subscribe: ['Message'], Immediate: true }),
    })
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Falha ao iniciar sessão' }
  }

  async function getQr(): Promise<string | undefined> {
    const resp = await fetch('https://manager.dinastiapi.evolutta.com.br/session/qr', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'token': token,
      },
    })
    const json = await resp.json().catch(() => ({} as any))
    const base64 = String(
      json?.qrcode ??
      json?.base64 ??
      json?.qr ??
      json?.qr_code ??
      json?.qrCode ??
      json?.QRCode ??
      json?.image ??
      json?.data?.qrcode ??
      json?.data?.base64 ??
      json?.data?.qr ??
      json?.data?.qr_code ??
      json?.data?.qrCode ??
      json?.data?.QRCode ??
      json?.data?.image ??
      ''
    ).trim()
    return base64 || undefined
  }

  try {
    const immediate = await getQr()
    if (immediate) return { success: true, qrCode: immediate }
    await new Promise((r) => setTimeout(r, 1500))
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const b = await getQr()
      if (b) return { success: true, qrCode: b }
    }
    return { success: false, error: 'QR Code não disponível' }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Falha ao obter QR Code' }
  }
}

export async function checkInstanceStatusAction(instanceId: string): Promise<{ success: boolean; status: 'connected' | 'disconnected' }> {
  const supabase = createClient()
  const { data: tokenRes, error: tokenError } = await supabase
    .from('instances')
    .select('token')
    .eq('id', instanceId)
    .single()

  if (tokenError || !tokenRes?.token) {
    await supabase.from('instances').update({ status: 'disconnected' }).eq('id', instanceId)
    return { success: false, status: 'disconnected' }
  }

  const token = String(tokenRes.token)
  let status: 'connected' | 'disconnected' = 'disconnected'

  function truthy(v: any): boolean {
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v > 0
    if (typeof v === 'string') {
      const s = v.toLowerCase().trim()
      if (!s) return false
      if (s === 'yes' || s === 'true' || s === 'connected' || s === 'online') return true
      return false
    }
    return false
  }

  try {
    const resp = await fetch('https://manager.dinastiapi.evolutta.com.br/session/status', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'token': token,
      },
    })
    const json = await resp.json().catch(() => ({} as any))
    const cRaw = json?.data?.Connected ?? json?.Connected ?? json?.data?.connected ?? json?.connected ?? json?.data?.IsConnected ?? json?.IsConnected ?? json?.data?.status ?? json?.status
    const lRaw = json?.data?.LoggedIn ?? json?.LoggedIn ?? json?.data?.loggedIn ?? json?.loggedIn ?? json?.data?.logged_in ?? json?.logged_in ?? json?.data?.authenticated ?? json?.authenticated
    const connected = truthy(cRaw)
    const loggedIn = truthy(lRaw)
    status = connected && loggedIn ? 'connected' : 'disconnected'
  } catch {
    status = 'disconnected'
  }
  await supabase.from('instances').update({ status }).eq('id', instanceId)
  return { success: true, status }
}

export async function disconnectInstanceAction(instanceId: string, csrfToken?: string): Promise<{ success: boolean }> {
  const c = cookies().get('csrf_token')?.value
  if (!c || !csrfToken || c !== csrfToken) {
    return { success: false }
  }
  const supabase = createClient()
  const { data: tokenRes } = await supabase
    .from('instances')
    .select('token')
    .eq('id', instanceId)
    .single()

  const token = String(tokenRes?.token ?? '')
  try {
    await fetch('https://manager.dinastiapi.evolutta.com.br/session/disconnect', {
      method: 'POST',
      headers: { token },
    })
  } catch {}
  await supabase.from('instances').update({ status: 'disconnected' }).eq('id', instanceId)
  return { success: true }
}

export async function deleteInstanceAction(instanceId: string, csrfToken?: string): Promise<{ success: boolean; error?: string }> {
  const c = cookies().get('csrf_token')?.value
  if (!c || !csrfToken || c !== csrfToken) {
    return { success: false, error: 'CSRF inválido' }
  }
  const supabase = createClient()
  const { data: inst, error: instError } = await supabase
    .from('instances')
    .select('instance_id')
    .eq('id', instanceId)
    .single()

  if (instError || !inst?.instance_id) {
    return { success: false, error: 'instance_id ausente para esta instância' }
  }

  const externalId = String(inst.instance_id)
  const readEnv = (key: string): string | undefined => {
    const files = ['.env.local', '.env']
    for (const name of files) {
      try {
        const p = path.resolve(process.cwd(), name)
        if (!fs.existsSync(p)) continue
        const content = fs.readFileSync(p, 'utf8')
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const idx = trimmed.indexOf('=')
          if (idx === -1) continue
          const k = trimmed.slice(0, idx).trim()
          let v = trimmed.slice(idx + 1).trim()
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1)
          }
          if (k === key) {
            if (v) return v
          }
        }
      } catch {}
    }
    return undefined
  }
  const adminKey = process.env.DINASTI_GLOBAL_KEY || readEnv('DINASTI_GLOBAL_KEY')
  if (!adminKey) {
    return { success: false, error: 'Chave administrativa ausente. Configure DINASTI_GLOBAL_KEY em .env ou .env.local' }
  }
  const url = `https://manager.dinastiapi.evolutta.com.br/admin/users/${encodeURIComponent(externalId)}`

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: adminKey,
      },
    })

    if (!resp.ok) {
      try {
        const j = await resp.json()
        const msg = j?.message || j?.error || `Falha na DinastiAPI (status ${resp.status})`
        return { success: false, error: msg }
      } catch {
        const t = await resp.text().catch(() => '')
        const msg = t || `Falha na DinastiAPI (status ${resp.status})`
        return { success: false, error: msg }
      }
    }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro na requisição de exclusão' }
  }

  await supabase.from('instances').delete().eq('id', instanceId)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getCsrfTokenAction(): Promise<{ token: string }> {
  const c = cookies()
  let t = c.get('csrf_token')?.value
  if (!t) {
    t = randomBytes(32).toString('hex')
    c.set('csrf_token', t, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' })
  }
  return { token: t }
}
