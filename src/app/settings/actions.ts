'use server'

import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteUserAccountAction(): Promise<{ error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // 1. Obter dados do perfil do usuário
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return { error: 'Erro ao obter perfil do usuário.' }
    }

    const supabaseAdmin = createSupabaseAdmin()

    // 2. Verificar se é Admin
    if (profile.role === 'admin') {
        // 3. Verificar se é o ÚLTIMO Admin
        const { count, error: countError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('role', 'admin')

        if (countError) {
            return { error: 'Erro ao verificar administradores da organização.' }
        }

        if (count !== null && count <= 1) {
            return { error: "Você é o único administrador. Promova outro membro antes de excluir sua conta." }
        }
    }



    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
        return { error: error.message || 'Falha ao deletar conta' }
    }

    await supabase.auth.signOut()
    redirect('/login')
}
