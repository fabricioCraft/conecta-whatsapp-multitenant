"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { connectAndGetQrAction, disconnectInstanceAction } from "@/app/dashboard/actions"
import TextShimmerWave from "@/components/ui/text-shimmer-wave"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function ConnectInstanceModal({ instanceId, status, onClose, onStatusChange }: { instanceId: string; status: 'connected' | 'disconnected'; onClose: () => void; onStatusChange?: (s: 'connected' | 'disconnected') => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [qrCode, setQrCode] = useState<string | undefined>(undefined)
  const [disconnecting, setDisconnecting] = useState(false)

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

  useEffect(() => {
    if (status === 'connected') {
      setLoading(false)
      setError(undefined)
      setQrCode(undefined)
      return
    }
    fetchQr()
  }, [status])

  const src = (() => {
    const code = qrCode || ""
    if (!code) return ""
    return code.startsWith("data:image") ? code : `data:image/png;base64,${code}`
  })()

  return (typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-0 z-[10000]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center px-4 z-[10001]">
          <div className="relative z-[10002] w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 p-6" role="dialog" aria-modal="true">
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

            {!loading && status === 'connected' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle className="h-20 w-20 text-emerald-500" />
                <div className="text-sm text-slate-300">WhatsApp conectado</div>
              </div>
            )}

            {!loading && !error && status === 'disconnected' && src && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-3 rounded-lg border border-white shadow">
                  <img src={src} alt="QR Code" className="h-[260px] w-[260px] object-contain" />
                </div>
                <div className="text-xs text-slate-400">Aproxime seu celular para ler o QR Code</div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
              {status === 'connected' ? (
                <Button type="button" variant="destructive" disabled={disconnecting} onClick={async () => {
                  setDisconnecting(true)
                  try {
                    await disconnectInstanceAction(instanceId)
                    try { onStatusChange && onStatusChange('disconnected') } catch {}
                    try { window.dispatchEvent(new CustomEvent('dashboard:refresh')) } catch {}
                    onClose()
                  } finally {
                    setDisconnecting(false)
                  }
                }}>
                  {disconnecting ? 'Desconectando...' : 'Desconectar WhatsApp'}
                </Button>
              ) : (
                <Button type="button" onClick={fetchQr}>Gerar Novo QR Code</Button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
    : null)
}
