import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, organizations(name)')
    .eq('id', user!.id)
    .single()

  let orgName = ""
  let userName = ""
  let profileMissing = false
  if (!profile?.organization_id) {
    profileMissing = true
  } else {
    orgName = (profile as any)?.organizations?.name ?? ""
    const full = String((profile as any)?.full_name ?? "")
    const parts = full.trim().split(/\s+/).filter(Boolean)
    userName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : (parts[0] || "")
  }

  let instances: any[] = []
  if (profile?.organization_id) {
    const { data: found } = await supabase
      .from('instances')
      .select(`
        *,
        organizations (name),
        profiles:user_id (full_name)
      `)
      .eq('organization_id', profile.organization_id)
    instances = found ?? []
  }

  return (
    <DashboardClient
      orgName={orgName}
      userName={userName}
      profileMissing={profileMissing}
      instances={instances}
    />
  )
}
