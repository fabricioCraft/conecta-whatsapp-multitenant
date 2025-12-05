"use client"

import { useEffect, useState } from "react"
import { createInstanceAction, getCsrfTokenAction } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import TextShimmerWave from "@/components/ui/text-shimmer-wave"
import { toast } from "sonner"

export default function CreateInstanceModal({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [csrfToken, setCsrfToken] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getCsrfTokenAction()
        setCsrfToken(res?.token || "")
      } catch {}
    })()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(undefined)
    setIsLoading(true)
    const toastId = toast.loading("Criando instância...")
    try {
      const fd = new FormData(e.currentTarget)
      const res = await createInstanceAction(undefined as any, fd)
      if (res?.success) {
        toast.success("Instância criada com sucesso", { id: toastId })
        try { window.dispatchEvent(new CustomEvent('dashboard:refresh')) } catch {}
        try { onClose() } catch {}
      } else {
        const msg = res?.error || "Falha ao criar instância"
        setError(msg)
        toast.error(msg, { id: toastId })
      }
    } catch (err: any) {
      setError(err?.message || "Erro inesperado")
      toast.error(err?.message || "Erro inesperado", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 p-6" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Nova Instância</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-50">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <div>
              <label htmlFor="instanceName" className="block text-sm font-medium text-slate-300 mb-2">Nome da Instância</label>
              <input
                id="instanceName"
                name="instanceName"
                type="text"
                required
                placeholder="Ex: Vendas, Suporte"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-50 placeholder-slate-500"
              />
            </div>
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-2">Token</label>
              <input
                id="token"
                name="token"
                type="text"
                required
                placeholder="Informe o token"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-50 placeholder-slate-500"
              />
            </div>
            {error && (
              <div className="mt-1 text-red-400 text-sm">{error}</div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center">
                <TextShimmerWave text="Criando sua instância..." className="text-slate-200" />
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
