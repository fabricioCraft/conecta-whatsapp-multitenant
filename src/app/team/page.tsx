import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Users, Shield, ArrowLeft } from 'lucide-react'
import MemberActions from '@/components/team/MemberActions'

export default async function TeamPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Obter perfil do usuário logado
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!currentUserProfile?.organization_id) {
        return <div className="p-8 text-center text-slate-400">Você não pertence a uma organização.</div>
    }

    // Se não for admin, não deve ver esta página (conforme solicitado)
    if (currentUserProfile.role !== 'admin') {
        redirect('/dashboard')
    }

    // Buscar todos os membros da organização usando Admin Client para bypassar RLS
    const supabaseAdmin = createSupabaseAdmin()
    const { data: members, error: membersError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('organization_id', currentUserProfile.organization_id)
        .order('full_name')

    if (membersError) {
        console.error('Erro ao buscar membros:', membersError)
    }

    const totalAdmins = members?.filter(m => m.role === 'admin').length || 0

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
            <div className="max-w-5xl mx-auto">
                <a href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Dashboard
                </a>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Users className="h-8 w-8 text-indigo-500" />
                            Gerenciamento de Equipe
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Gerencie os membros da sua organização e suas permissões.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80">
                                <th className="p-4 font-medium text-slate-400">Nome</th>
                                <th className="p-4 font-medium text-slate-400">Permissão</th>
                                <th className="p-4 font-medium text-slate-400 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {members?.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-medium text-slate-200">
                                        {member.full_name || 'Sem nome'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'admin'
                                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                            : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                                            }`}>
                                            {member.role === 'admin' && <Shield className="h-3 w-3" />}
                                            {member.role === 'admin' ? 'Administrador' : 'Membro'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <MemberActions
                                            member={member as any}
                                            currentUserRole={currentUserProfile.role as 'admin' | 'member'}
                                            isCurrentUser={member.id === user.id}
                                            totalAdmins={totalAdmins}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {(!members || members.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        Nenhum membro encontrado nesta organização.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
