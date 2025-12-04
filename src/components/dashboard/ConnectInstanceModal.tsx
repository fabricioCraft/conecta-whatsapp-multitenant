"use client"

import { useEffect, useState } from "react"
import { connectAndGetQrAction } from "@/app/dashboard/actions"
import TextShimmerWave from "@/components/ui/text-shimmer-wave"
import { Button } from "@/components/ui/button"

export default function ConnectInstanceModal({ instanceId, onClose }: { instanceId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [qrCode, setQrCode] = useState<string | undefined>(undefined)

  async function fetchQr() {
    setLoading(true)
    setError(undefined)
    try {
      const fd = new FormData()
      fd.append('instanceId', instanceId)
      const res = await connectAndGetQrAction(undefined as any, fd)
      if (res?.success && res.qrCode) {
        setQrCode(res.qrCode)
      } else {
        setError(res?.error || 'Falha ao obter QR Code')
      }
    } catch (e: any) {
      setError(e?.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQr() }, [])

  const src = (() => {
    const code = qrCode || ""
    if (!code) return ""
    return code.startsWith("data:image") ? code : `data:image/png;base64,${code}`
  })()

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 p-6" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Gerenciar Instância</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-50">✕</button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              <TextShimmerWave text="Iniciando conexão..." className="text-slate-200" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md border border-red-600/50 bg-red-500/10 text-red-400 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {!loading && !error && src && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-lg border border-white shadow">
                <img src={src} alt="QR Code" className="h-[260px] w-[260px] object-contain" />
              </div>
              <div className="text-xs text-slate-400">Aproxime seu celular para ler o QR Code</div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
            <Button type="button" onClick={fetchQr}>Gerar Novo QR Code</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

