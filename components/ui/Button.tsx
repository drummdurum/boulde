import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: "primary" | "ghost" | "outline"; size?: "sm" | "md" | "icon" };
export function Button({ children, className = "", variant = "primary", size = "md", ...props }: Props) {
  const variants = { primary: "bg-pine text-limestone hover:bg-[#34493a]", ghost: "text-ink hover:bg-sand", outline: "border border-line bg-limestone text-ink hover:border-moss" };
  const sizes = { sm: "min-h-9 px-3 text-sm", md: "min-h-11 px-4 text-sm", icon: "h-11 w-11" };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}
