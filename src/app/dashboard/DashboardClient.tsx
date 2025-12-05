"use client"

import { useEffect, useMemo, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { createBrowserClient } from "@supabase/ssr"
import { createInstanceAction, logoutAction } from "./actions"
import { LogOut, Plus, Smartphone } from "lucide-react"
import InstanceCard from "@/components/dashboard/InstanceCard"
import CreateInstanceModal from "@/components/dashboard/CreateInstanceModal"

type CreateState = { error?: string; success?: boolean; message?: string } | null

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Criando..." : "Criar"}
    </button>
  )
}

export default function DashboardClient({ orgName: initialOrgName, userName: initialUserName, profileMissing: initialProfileMissing, instances: initialInstances }: { orgName: string; userName: string; profileMissing: boolean; instances: any[] }) {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
  }, [])

  const [orgName, setOrgName] = useState<string>(initialOrgName)
  const [showForm, setShowForm] = useState(false)
  const [profileMissing, setProfileMissing] = useState(initialProfileMissing)
  const [instances, setInstances] = useState<any[]>(initialInstances)
  const [userName, setUserName] = useState<string>(initialUserName)
  const [state] = useFormState<CreateState, FormData>(createInstanceAction as any, { success: false })

  useEffect(() => {
    const onRefresh = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          window.location.assign('/login')
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, full_name, organizations(name)')
          .eq('id', user.id)
          .single()
        if (!profile?.organization_id) {
          setProfileMissing(true)
          setOrgName("")
          return
        }
        setOrgName((profile as any)?.organizations?.name ?? "")
        const full = String((profile as any)?.full_name ?? "")
        const parts = full.trim().split(/\s+/).filter(Boolean)
        const short = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : (parts[0] || "")
        setUserName(short)
        const { data: found } = await supabase
          .from('instances')
          .select(`
            *,
            organizations (name),
            profiles:user_id (full_name)
          `)
          .eq('organization_id', profile.organization_id)
        setInstances(found ?? [])
      } catch {}
    }
    try { window.addEventListener('dashboard:refresh', onRefresh) } catch {}
    return () => {
      try { window.removeEventListener('dashboard:refresh', onRefresh) } catch {}
    }
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">{`Bem vindo, ${userName || "Usuário"}`}</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Instâncias</h1>
            <p className="text-slate-400 mt-1">Gerencie suas conexões do WhatsApp em um painel central.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            Nova Instância
          </button>
        </div>

        {showForm && (
          <CreateInstanceModal onClose={() => setShowForm(false)} />
        )}

        {(() => {
          if (profileMissing) {
            return (
              <div className="border border-slate-800 rounded-xl p-6 bg-slate-900/50 text-red-300">
                Erro: Perfil de usuário não encontrado. Contate o suporte.
              </div>
            )
          }
          if (instances.length === 0) {
            return (
              <div className="border-dashed border-2 border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <Smartphone className="h-16 w-16 text-slate-700" />
                <h3 className="mt-4 text-xl font-semibold">Conecte seu primeiro número</h3>
                <p className="mt-1 text-slate-400">Crie uma instância para integrar o WhatsApp ao seu fluxo.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Nova Instância
                </button>
              </div>
            )
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((inst: any) => (
                <InstanceCard key={inst.id} instance={inst} />
              ))}
            </div>
          )
        })()}
      </main>
    </div>
  )
}
