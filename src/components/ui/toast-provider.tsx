"use client"

import { Toaster } from "sonner"
import { memo, useState, useRef, forwardRef, useEffect } from 'react'
import { motion, useAnimation, useInView, useMotionTemplate, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function ToastProvider() {
  return (
    <Toaster richColors position="top-right" />
  )
}

export const Input = memo(forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    const radius = 100
    const [visible, setVisible] = useState(false)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - left)
      mouseY.set(clientY - top)
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
              #3b82f6,
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300 w-full"
      >
        <input
          type={type}
          className={cn(
            `flex h-12 w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black shadow-input transition duration-400 
             placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 
             disabled:cursor-not-allowed disabled:opacity-50 
             dark:bg-zinc-800 dark:text-white dark:placeholder-text-neutral-600 dark:focus-visible:ring-neutral-600`,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    )
  }
))
Input.displayName = 'Input'

export const BoxReveal = ({ children, width = "fit-content", boxColor, duration, className }: any) => {
  const mainControls = useAnimation()
  const slideControls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      slideControls.start("visible")
      mainControls.start("visible")
    }
  }, [isInView, mainControls, slideControls])

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} style={{ width }}>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 75 }, visible: { opacity: 1, y: 0 } }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: "100%" } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: "easeIn" }}
        className="absolute top-1 bottom-1 left-0 right-0 z-20 bg-indigo-500 rounded"
        style={{ background: boxColor }}
      />
    </div>
  )
}

export const Ripple = memo(function Ripple({ mainCircleSize = 210, numCircles = 8 }: { mainCircleSize?: number, numCircles?: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none opacity-40">
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70
        const opacity = 0.24 - i * 0.03
        const animationDelay = `${i * 0.06}s`
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid'
        return (
          <div
            key={i}
            className="absolute animate-ripple rounded-full border bg-foreground/5 shadow-xl"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              borderWidth: '1px',
              borderColor: `rgba(100, 100, 255, ${0.1})`,
            }}
          />
        )
      })}
    </div>
  )
})

export const TechButton = ({ children, className, disabled }: any) => {
  return (
    <div className={cn("relative group/btn", className)}>
      <button
        disabled={disabled}
        className="bg-gradient-to-br from-zinc-200 to-zinc-200 dark:from-zinc-900 dark:to-zinc-900 
        block w-full text-black dark:text-white rounded-md h-12 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] 
        dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] 
        hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-70 transition-all"
        type="submit"
      >
        {children}
        <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
      </button>
    </div>
  )
}
