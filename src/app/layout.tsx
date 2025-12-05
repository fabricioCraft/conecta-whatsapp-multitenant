import './globals.css'
import { Inter } from 'next/font/google'
import ToastProvider from '@/components/ui/toast-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Conecta WhatsApp Multi-tenant',
  description: 'Sistema de autenticação multi-tenant',
}
export const runtime = 'nodejs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-50`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
