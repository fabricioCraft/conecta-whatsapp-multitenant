import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: Array<string | number | null | undefined | boolean | Record<string, boolean> | Array<any>>) {
  return twMerge(clsx(inputs))
}

