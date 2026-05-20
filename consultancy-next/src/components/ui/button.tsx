import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button }
