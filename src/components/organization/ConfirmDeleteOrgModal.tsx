'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, Trash2 } from 'lucide-react'
import { deleteOrganizationAction } from '@/app/organization/actions'
import { toast } from 'sonner'

interface ConfirmDeleteOrgModalProps {
    orgName: string
    onClose: () => void
}

export default function ConfirmDeleteOrgModal({ orgName, onClose }: ConfirmDeleteOrgModalProps) {
    const [mounted, setMounted] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        setMounted(true)
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    if (!mounted) return null

    const handleConfirm = async () => {
        if (confirmText !== orgName) return

        setIsDeleting(true)
        try {
            const res = await deleteOrganizationAction()
            if (res?.error) {
                toast.error(res.error)
                setIsDeleting(false)
            }
        } catch (error) {
            toast.error('Erro inesperado ao encerrar organização.')
            setIsDeleting(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isDeleting ? undefined : onClose} />
            <div className="relative z-[10001] w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-red-500">
                        <div className="bg-red-500/10 p-2 rounded-lg">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">Encerrar Organização</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-slate-300 font-medium">
                        Esta ação é EXTREMAMENTE PERIGOSA e IRREVERSÍVEL.
                    </p>
                    <div className="text-sm text-slate-400 bg-red-950/20 p-4 rounded-lg border border-red-900/30 space-y-2">
                        <p>Ao confirmar, você irá:</p>
                        <ul className="list-disc list-inside space-y-1 ml-1">
                            <li>Excluir permanentemente a organização <strong>{orgName}</strong>.</li>
                            <li>Remover todas as instâncias do WhatsApp conectadas.</li>
                            <li>Excluir todas as contas de usuários associadas.</li>
                            <li>Apagar todos os dados do sistema.</li>
                        </ul>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm text-slate-400 mb-2">
                            Para confirmar, digite o nome da organização: <span className="text-slate-200 font-bold select-all">{orgName}</span>
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={orgName}
                            disabled={isDeleting}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-700"
                            onPaste={(e) => e.preventDefault()} // Opcional: forçar digitação para segurança extra
                        />
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting || confirmText !== orgName}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                    >
                        {isDeleting ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Encerrando...
                            </>
                        ) : (
                            'Confirmar Encerramento'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
