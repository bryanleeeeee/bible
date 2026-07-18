import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "soft" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-ink text-ground hover:opacity-90",
  soft: "bg-lapis/10 text-lapis hover:bg-lapis/15",
  ghost: "text-muted hover:bg-line/50 hover:text-ink",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ className, variant = "primary", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
          styles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
