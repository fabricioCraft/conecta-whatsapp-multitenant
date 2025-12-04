'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type CreateInstanceState = { error?: string; success?: boolean; message?: string } | null

export async function createInstanceAction(prevState: CreateInstanceState, formData?: FormData): Promise<CreateInstanceState> {
  const fd = (formData ?? (prevState as unknown as FormData)) as FormData
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
  const instanceId = String(fd.get('instanceId') ?? '').trim()
  const webhookUrl = String(fd.get('webhookUrl') ?? '').trim()
  if (!instanceId || !webhookUrl) {
    return { error: 'Campos obrigatórios ausentes', success: false }
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
