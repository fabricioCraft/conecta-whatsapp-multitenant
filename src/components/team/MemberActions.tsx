'use client'

import { useState } from 'react'
import { updateMemberRoleAction, removeMemberAction } from '@/app/team/actions'
import { toast } from 'sonner'
import { ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react'

type Member = {
    id: string
    role: 'admin' | 'member'
    full_name: string
}

interface MemberActionsProps {
    member: Member
    currentUserRole: 'admin' | 'member'
    isCurrentUser: boolean
    totalAdmins: number
}

export default function MemberActions({ member, currentUserRole, isCurrentUser, totalAdmins }: MemberActionsProps) {
    const [loading, setLoading] = useState(false)

    if (currentUserRole !== 'admin') {
        return null
    }

    if (isCurrentUser) {
        return <span className="text-xs text-slate-500 italic">Você</span>
    }

    const handleRoleChange = async (newRole: 'admin' | 'member') => {
        setLoading(true)
        try {
            const res = await updateMemberRoleAction(member.id, newRole)
            if (res.success) {
                toast.success(`Permissão atualizada para ${newRole === 'admin' ? 'Administrador' : 'Membro'}`)
            } else {
                toast.error(res.error || 'Erro ao atualizar permissão')
            }
        } catch (error) {
            toast.error('Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveMember = async () => {
        if (!confirm(`Tem certeza que deseja remover ${member.full_name} da equipe? Esta ação não pode ser desfeita.`)) return

        setLoading(true)
        try {
            const res = await removeMemberAction(member.id)
            if (res.success) {
                toast.success('Membro removido com sucesso')
            } else {
                toast.error(res.error || 'Erro ao remover membro')
            }
        } catch (error) {
            toast.error('Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {member.role === 'member' ? (
                <button
                    onClick={() => handleRoleChange('admin')}
                    disabled={loading}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    title="Promover a Admin"
                >
                    <ShieldCheck className="h-4 w-4" />
                </button>
            ) : (
                <div className="group relative">
                    <button
                        onClick={() => handleRoleChange('member')}
                        disabled={loading || totalAdmins <= 1}
                        className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={totalAdmins <= 1 ? "Não é possível rebaixar o único administrador" : "Rebaixar a Membro"}
                    >
                        <ShieldAlert className="h-4 w-4" />
                    </button>
                </div>
            )}

            <button
                onClick={handleRemoveMember}
                disabled={loading}
                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                title="Remover da Equipe"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    )
}
