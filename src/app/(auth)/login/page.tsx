"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { loginAction } from "./actions"
import { Mail, Lock } from "lucide-react"
import { BoxReveal, Ripple, Input, TechButton } from "@/components/ui/auth-kit"
import { toast } from "sonner"

export default function LoginPage() {
  const [state, formAction] = useFormState<any, FormData>(loginAction as any, null)
  useEffect(() => {
    if (state?.error) {
      try { toast.error(state.error) } catch {}
    }
  }, [state])

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-950">
      <div className="relative hidden md:flex items-center justify-center p-8 overflow-hidden">
        <Ripple />
        <div className="relative z-10 text-center">
          <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300">Gerenciador de Whatsapp</h1>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <BoxReveal>
            <h2 className="text-3xl font-semibold text-slate-200">Bem-vindo</h2>
          </BoxReveal>
          <form action={formAction} className="mt-6 space-y-4">
            <BoxReveal delay={0.05}>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" label="Email" icon={Mail} />
            </BoxReveal>
            <BoxReveal delay={0.1}>
              <Input id="password" name="password" type="password" placeholder="••••••••" label="Senha" icon={Lock} />
            </BoxReveal>
            {state?.error && (
              <div className="rounded-md border border-red-600/50 bg-red-500/10 text-red-400 text-sm px-3 py-2">
                {state.error}
              </div>
            )}
            <SubmitButton />
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Não tem uma conta?{" "}
              <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Cadastre-se</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <TechButton type="submit" className="w-full">
      {pending ? "Entrando..." : "Entrar"}
    </TechButton>
  )
}
