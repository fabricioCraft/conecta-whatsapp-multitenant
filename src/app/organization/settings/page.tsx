import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, AlertTriangle, ArrowLeft } from 'lucide-react'
import DeleteOrgButton from '@/app/organization/settings/DeleteOrgButton'

export default async function OrganizationSettingsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id, organizations(name)')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return <div className="p-8 text-center text-slate-400">Organização não encontrada.</div>
    }

    if (profile.role !== 'admin') {
        redirect('/dashboard')
    }

    const orgName = (profile.organizations as any)?.name || 'Sua Organização'

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
            <div className="max-w-3xl mx-auto">
                <a href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Dashboard
                </a>

                <div className="flex items-center gap-3 mb-8">
                    <Building2 className="h-8 w-8 text-indigo-500" />
                    <h1 className="text-3xl font-bold">Configurações da Organização</h1>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Detalhes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Organização</label>
                            <div className="text-lg text-slate-200">{orgName}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">ID da Organização</label>
                            <div className="text-sm font-mono text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-800">
                                {profile.organization_id}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-8">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-xl font-semibold">Zona de Perigo</h2>
                    </div>

                    <p className="text-slate-400 mb-6">
                        As ações abaixo são destrutivas e não podem ser desfeitas. Tenha certeza absoluta antes de prosseguir.
                    </p>

                    <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/20">
                        <div>
                            <h3 className="font-medium text-red-200">Encerrar Conta da Organização</h3>
                            <p className="text-sm text-red-400/70 mt-1">
                                Exclui permanentemente a organização e todos os dados associados.
                            </p>
                        </div>
                        <DeleteOrgButton orgName={orgName} />
                    </div>
                </div>
            </div>
        </div>
    )
}
