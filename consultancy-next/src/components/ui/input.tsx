import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      className={`px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 ${className}`}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
