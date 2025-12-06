'use server'

import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateMemberRoleAction(memberId: string, newRole: 'admin' | 'member'): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // 1. Obter dados do perfil do usuário logado (Admin)
    const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (adminError || !adminProfile) {
        return { success: false, error: 'Erro ao verificar permissões.' }
    }

    if (adminProfile.role !== 'admin') {
        return { success: false, error: 'Apenas administradores podem alterar permissões.' }
    }

    // Inicializar Admin Client para bypassar RLS na leitura/escrita de outros perfis
    const supabaseAdmin = createSupabaseAdmin()

    // 2. Verificar se o membro alvo pertence à mesma organização
    const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('organization_id, role')
        .eq('id', memberId)
        .single()

    if (targetError || !targetProfile) {
        return { success: false, error: 'Membro não encontrado.' }
    }

    if (targetProfile.organization_id !== adminProfile.organization_id) {
        return { success: false, error: 'Você não pode gerenciar membros de outra organização.' }
    }

    // 3. Prevenir que o último admin se rebaixe
    if (newRole === 'member' && targetProfile.role === 'admin') {
        const { count } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', adminProfile.organization_id)
            .eq('role', 'admin')

        if (count !== null && count <= 1) {
            return { success: false, error: 'Não é possível rebaixar o único administrador da organização.' }
        }
    }

    // 4. Atualizar a role
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)

    if (updateError) {
        return { success: false, error: updateError.message || 'Erro ao atualizar permissão.' }
    }

    revalidatePath('/team')
    return { success: true }
}

export async function removeMemberAction(memberId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // 1. Obter dados do perfil do usuário logado (Admin)
    const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (adminError || !adminProfile) {
        return { success: false, error: 'Erro ao verificar permissões.' }
    }

    if (adminProfile.role !== 'admin') {
        return { success: false, error: 'Apenas administradores podem remover membros.' }
    }

    const supabaseAdmin = createSupabaseAdmin()

    // 2. Verificar se o membro alvo pertence à mesma organização
    const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('organization_id, role')
        .eq('id', memberId)
        .single()

    if (targetError || !targetProfile) {
        return { success: false, error: 'Membro não encontrado.' }
    }

    if (targetProfile.organization_id !== adminProfile.organization_id) {
        return { success: false, error: 'Você não pode remover membros de outra organização.' }
    }

    // 3. Prevenir que o admin se remova (embora a UI já deva prevenir isso)
    if (memberId === user.id) {
        return { success: false, error: 'Você não pode remover a si mesmo por aqui. Use a opção de excluir conta em Configurações.' }
    }

    // 4. Deletar o usuário do Auth (isso deve cascatear para o profile se configurado, ou deletamos manualmente)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(memberId)

    if (deleteError) {
        return { success: false, error: deleteError.message || 'Erro ao remover membro.' }
    }

    revalidatePath('/team')
    return { success: true }
}
