"use client"

import { useEffect, useMemo, useState } from "react"
import { updateInstanceAction, checkInstanceStatusAction } from "@/app/dashboard/actions"
import { Smartphone, User, Link as LinkIcon, Settings } from "lucide-react"
import TextShimmerWave from "@/components/ui/text-shimmer-wave"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import ConnectInstanceModal from "@/components/dashboard/ConnectInstanceModal"

type InstanceWithJoins = {
  id: string
  name?: string | null
  dinasti_instance_name?: string | null
  instance_id?: string | null
  status?: string | null
  webhook?: string | null
  token?: string | null
  profiles?: { full_name?: string | null } | null
  organizations?: { name?: string | null } | null
}

type UpdateState = { error?: string; success?: boolean; message?: string } | null

export default function InstanceCard({ instance }: { instance: InstanceWithJoins }) {
  const [open, setOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [localStatus, setLocalStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  const title = useMemo(() => {
    return (
      instance.dinasti_instance_name ?? instance.name ?? ""
    )
  }, [instance])

  const statusColor = useMemo(() => {
    if (localStatus === "connected") return "bg-emerald-500"
    if (localStatus === "checking") return "bg-yellow-400 animate-pulse"
    return "bg-red-500"
  }, [localStatus])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLocalStatus('checking')
      try {
        const res = await checkInstanceStatusAction(instance.id)
        if (!mounted) return
        setLocalStatus(res.status === 'connected' ? 'connected' : 'disconnected')
      } catch {
        if (!mounted) return
        setLocalStatus('disconnected')
      }
    })()
    return () => {
      mounted = false
    }
  }, [instance.id])

  const ownerName = useMemo(() => {
    return instance?.profiles?.full_name ?? "—"
  }, [instance?.profiles?.full_name])

  const webhookLabel = useMemo(() => {
    const url = instance.webhook ?? ""
    if (!url) return "Não configurado"
    return url.length > 60 ? `${url.slice(0, 57)}...` : url
  }, [instance.webhook])

  const maskedToken = useMemo(() => {
    return (instance.token ?? "").toString()
  }, [instance.token])

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <div className="text-lg font-semibold">{title}</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-800 text-xs">
          <span className={`h-2 w-2 rounded-full ${statusColor}`}></span>
          <span>{localStatus === "connected" ? "Online" : localStatus === "checking" ? "Verificando..." : "Offline"}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <User className="h-4 w-4" />
          <span className="text-sm">Proprietário:</span>
          <span className="text-sm font-medium text-slate-100">{ownerName}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <LinkIcon className="h-4 w-4" />
          <span className="text-sm">Webhook:</span>
          <span className="text-sm font-medium text-slate-100 truncate max-w-[18rem]">{webhookLabel}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={() => setManageOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          Gerenciar
        </button>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-50">
          <Settings className="h-4 w-4" /> Editar
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-slate-900 rounded-lg border border-slate-700 p-6" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Editar {title}</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-50">✕</button>
              </div>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setError(undefined)
                  setIsLoading(true)
                  const fd = new FormData(e.currentTarget as HTMLFormElement)
                  const toastId = toast.loading("Atualizando webhook...")
                  const res = await updateInstanceAction(undefined as any, fd)
                  if (res?.success) {
                    try { window.dispatchEvent(new CustomEvent('dashboard:refresh')) } catch {}
                    try { setOpen(false) } catch {}
                    toast.success(res.message || 'Webhook atualizado com sucesso', { id: toastId })
                  } else {
                    const msg = res?.error || 'Falha ao atualizar webhook'
                    setError(msg)
                    toast.error(msg, { id: toastId })
                  }
                  setIsLoading(false)
                }}
              >
                <input type="hidden" name="instanceId" value={instance.id} />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Instância</label>
                  <input
                    type="text"
                    value={(instance.dinasti_instance_name ?? instance.name ?? "").toString()}
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Token</label>
                  <input
                    type="password"
                    value={maskedToken}
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="webhookUrl" className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
                  <input
                    id="webhookUrl"
                    name="webhookUrl"
                    type="url"
                    defaultValue={instance.webhook ?? ""}
                    placeholder="https://seu-dominio.com/webhook"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-50 placeholder-slate-500"
                  />
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center">
                    <TextShimmerWave text="Atualizando webhook..." className="text-slate-200" />
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
                </div>
                {error && (
                  <div className="mt-3 text-red-400 text-sm">{error}</div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {manageOpen && (
        <ConnectInstanceModal instanceId={instance.id} onClose={() => setManageOpen(false)} />
      )}
    </div>
  )
}
