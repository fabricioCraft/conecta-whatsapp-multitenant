"use client"

import React from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { twMerge } from "tailwind-merge"
import clsx from "clsx"

type IconType = React.ElementType

export function BoxReveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={twMerge("relative", className)}
    >
      {children}
    </motion.div>
  )
}

export function Ripple({ className }: { className?: string }) {
  return (
    <div className={twMerge("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-indigo-600/25 to-cyan-600/25 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-cyan-600/25 to-indigo-600/25 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 blur-2xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
    </div>
  )
}

export function TechButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "relative inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium"
  const visual = "bg-gradient-to-r from-indigo-600/80 to-cyan-600/80 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition"
  const ring = "focus:outline-none focus:ring-2 focus:ring-indigo-500/50"

  return (
    <button {...props} className={twMerge(clsx(base, visual, ring), className)}>
      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 blur opacity-0 group-hover:opacity-100 pointer-events-none" />
      <span className="relative">{children}</span>
    </button>
  )
}

export function Input({ label, icon: Icon, className, inputClassName, ...props }: {
  label?: string
  icon?: IconType
  className?: string
  inputClassName?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const bg = useMotionTemplate`radial-gradient(200px circle at ${x}px ${y}px, rgba(99,102,241,0.20), rgba(6,182,212,0))`

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  return (
    <div className={twMerge("group relative", className)} onMouseMove={onMove}>
      {label && <div className="mb-2 text-sm text-slate-400">{label}</div>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />}
        <input
          {...props}
          className={twMerge(
            clsx(
              "w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600",
              Icon ? "pl-10" : ""
            ),
            inputClassName
          )}
        />
        <motion.div style={{ background: bg }} className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  )
}

export default { BoxReveal, Ripple, TechButton, Input }

