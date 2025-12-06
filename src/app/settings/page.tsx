'use client'

import { deleteUserAccountAction } from './actions'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, Trash2, AlertTriangle, ArrowLeft, X } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteUserAccountAction()
            if (res?.error) {
                toast.error(res.error)
                setIsDeleting(false)
                setShowModal(false)
            }
        } catch (e) {
            toast.error('Ocorreu um erro ao tentar deletar sua conta.')
            setIsDeleting(false)
            setShowModal(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
            <div className="max-w-2xl mx-auto">
                <a href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Dashboard
                </a>
                <h1 className="text-3xl font-bold mb-8">Configurações</h1>

                <div className="bg-slate-900/50 border border-red-900/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-xl font-semibold">Zona de Perigo</h2>
                    </div>

                    <p className="text-slate-400 mb-6">
                        A exclusão da sua conta é uma ação permanente e não pode ser desfeita.
                        Todos os seus dados, instâncias e configurações serão removidos permanentemente do nosso sistema.
                    </p>

                    <button
                        onClick={() => setShowModal(true)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="h-4 w-4" />
                        Deletar minha conta permanentemente
                    </button>
                </div>
            </div>

            {showModal && (
                <DeleteConfirmationModal
                    isDeleting={isDeleting}
                    onClose={() => setShowModal(false)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    )
}

function DeleteConfirmationModal({ onClose, onConfirm, isDeleting }: { onClose: () => void; onConfirm: () => void; isDeleting: boolean }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    if (!mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isDeleting ? undefined : onClose} />
            <div className="relative z-[10001] w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-red-500">
                        <div className="bg-red-500/10 p-2 rounded-lg">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">Excluir Conta</h3>
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
                    <p className="text-slate-300">
                        Tem certeza absoluta? Esta ação não pode ser desfeita.
                    </p>
                    <p className="text-sm text-slate-400 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                        Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
                        Você será desconectado imediatamente.
                    </p>
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
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                    >
                        {isDeleting ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            'Sim, excluir conta'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
