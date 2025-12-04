"use client"

import { motion } from "framer-motion"
import React from "react"

export default function TextShimmerWave({ text, className }: { text: string; className?: string }) {
  return (
    <div className={"flex items-center justify-center " + (className ?? "")}>
      <motion.span
        initial={{ backgroundPositionX: 0 }}
        animate={{ backgroundPositionX: [0, 200, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 bg-clip-text text-transparent select-none"
        style={{
          backgroundSize: "200px 100%",
        }}
      >
        {text}
      </motion.span>
    </div>
  )
}

