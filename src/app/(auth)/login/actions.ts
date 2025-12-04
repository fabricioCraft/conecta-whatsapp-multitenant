"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function loginAction(prevState: any, formData?: FormData) {
  const fd = (formData ?? (prevState as FormData)) as FormData
  const email = String(fd.get("email") ?? "").trim()
  const password = String(fd.get("password") ?? "").trim()

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: "Credenciais inválidas" }
  }

  redirect("/dashboard")
}
