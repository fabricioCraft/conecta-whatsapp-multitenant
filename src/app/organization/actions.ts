'use server'

import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import path from 'node:path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })

export async function deleteOrganizationAction(): Promise<{ error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // 1. Obter dados do perfil do usuário e organização
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id, organizations(name)')
        .eq('id', user.id)
        .single()

    if (profileError || !profile || !profile.organization_id) {
        return { error: 'Erro ao obter dados da organização.' }
    }

    // 2. Verificar se é Admin
    if (profile.role !== 'admin') {
        return { error: 'Apenas administradores podem encerrar a conta da organização.' }
    }

    const supabaseAdmin = createSupabaseAdmin()

    // 3. Verificar se é o ÚNICO Admin (Salvaguarda)
    // Se houver outros admins, eles devem ser removidos ou rebaixados antes de encerrar a conta.
    // Isso evita que um admin encerre a conta "sem querer" enquanto outros ainda estão operando.
    const { count, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'admin')

    if (countError) {
        return { error: 'Erro ao verificar administradores.' }
    }

    if (count !== null && count > 1) {
        return { error: 'Existem outros administradores na organização. Remova-os ou rebaixe-os antes de encerrar a conta.' }
    }

    // 4. Limpeza na API Externa (Dinasti)
    // Buscar todas as instâncias da organização
    const { data: instances } = await supabaseAdmin
        .from('instances')
        .select('instance_id')
        .eq('organization_id', profile.organization_id)

    if (instances && instances.length > 0) {
        const adminKey = process.env.DINASTI_API_KEY
        if (adminKey) {
            await Promise.all(instances.map(async (inst) => {
                if (inst.instance_id) {
                    try {
                        await fetch(`https://manager.dinastiapi.evolutta.com.br/admin/users/${encodeURIComponent(inst.instance_id)}`, {
                            method: 'DELETE',
                            headers: {
                                accept: 'application/json',
                                Authorization: adminKey,
                            },
                        })
                    } catch (e) {
                        console.error(`Falha ao deletar instância ${inst.instance_id} na API externa:`, e)
                    }
                }
            }))
        } else {
            console.warn('DINASTI_API_KEY não configurada. As instâncias não foram removidas da API externa.')
        }
    }

    // 4.1. Deletar Instâncias do Banco de Dados (Explicitamente)
    // Isso garante que não haja FK impedindo a deleção da organização
    const { error: deleteInstancesError } = await supabaseAdmin
        .from('instances')
        .delete()
        .eq('organization_id', profile.organization_id)

    if (deleteInstancesError) {
        console.error('Erro ao deletar instâncias do banco:', deleteInstancesError)
        return { error: 'Falha ao limpar instâncias. Tente novamente.' }
    }

    // 5. Deleção em Cascata dos Usuários (Auth e Profiles)
    // Buscar todos os membros da organização
    const { data: members } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)

    if (members && members.length > 0) {
        for (const member of members) {
            // Não deletar o usuário atual ainda
            if (member.id === user.id) continue

            // Tenta deletar o profile primeiro (caso não tenha cascade do Auth)
            await supabaseAdmin.from('profiles').delete().eq('id', member.id)
            // Deleta o usuário do Auth
            await supabaseAdmin.auth.admin.deleteUser(member.id)
        }
    }

    // 6. Preparar para Deletar a Organização
    // Deletar o profile do usuário atual explicitamente para liberar a FK
    const { error: deleteMyProfileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id)

    if (deleteMyProfileError) {
        console.error('Erro ao deletar perfil do admin:', deleteMyProfileError)
        return { error: 'Falha ao preparar exclusão do perfil. Contate o suporte.' }
    }

    // 7. Deletar a Organização
    const { error: deleteOrgError } = await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', profile.organization_id)

    if (deleteOrgError) {
        console.error('Erro ao deletar organização:', deleteOrgError)
        return { error: `Falha ao deletar organização: ${deleteOrgError.message}` }
    }

    // 7. Deletar o usuário atual do Auth (último passo)
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    // 8. Logout e Redirecionamento
    await supabase.auth.signOut()
    redirect('/login')
}
