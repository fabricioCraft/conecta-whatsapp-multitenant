"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useFormState, useFormStatus } from "react-dom"
import { updateInstanceAction, deleteInstanceAction } from "@/app/dashboard/actions"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Instance = {
  id: string
  name: string
  webhook?: string | null
  token?: string | null
}

type UpdateState = { error?: string; success?: boolean } | null

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20"
    >
      {pending ? "Salvando na API..." : "Salvar Alterações"}
    </button>
  )
}

export default function EditInstanceModal({ instance }: { instance: Instance }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [state, formAction] = useFormState<UpdateState, FormData>(updateInstanceAction as any, { success: false })

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      try { alert("Webhook atualizado com sucesso") } catch {}
    }
  }, [state])

  const maskedToken = (instance.token ?? "").toString()

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-50"
      >
        <Settings className="h-4 w-4" />
        Editar
      </button>

      {open && (
        typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[10000]">
            <div className="absolute inset-0 bg-black/60 z-[10000]" onClick={() => setOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center px-4 z-[10001]">
              <div className="relative z-[10002] w-full max-w-lg bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 p-6" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Editar Instância</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-50">✕</button>
              </div>
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="instanceId" value={instance.id} />
                <input type="hidden" name="dinastiInstanceName" value={instance.name} />
                <input type="hidden" name="apiToken" value={instance.token ?? ""} />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Instância</label>
                  <input
                    type="text"
                    value={instance.name}
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

                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-50">Cancelar</button>
                  <SubmitButton />
                </div>
                {state?.error && (
                  <div className="mt-3 text-red-400 text-sm">{state.error}</div>
                )}
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Danger Zone</div>
                    <Button
                      variant="destructive"
                      type="button"
                      disabled={deleting}
                      onClick={async () => {
                        const ok = typeof window !== 'undefined' ? window.confirm('Tem certeza que deseja excluir?') : true
                        if (!ok) return
                        const toastId = toast.loading('Excluindo instância...')
                        setDeleting(true)
                        try {
                          const res = await deleteInstanceAction(instance.id)
                          if (!res?.success) {
                            throw new Error(res?.error || 'Falha ao excluir instância na API')
                          }
                          try { window.dispatchEvent(new CustomEvent('dashboard:refresh')) } catch {}
                          setOpen(false)
                          toast.success('Instância excluída', { id: toastId })
                        } catch (e: any) {
                          toast.error(e?.message || 'Falha ao excluir instância', { id: toastId })
                        } finally {
                          setDeleting(false)
                        }
                      }}
                    >
                      {deleting ? 'Excluindo...' : 'Deletar Instância'}
                    </Button>
                  </div>
                </div>
              </form>
              </div>
            </div>
          </div>,
          document.body
        ) : null
      )}
    </div>
  )
}
