import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full border border-line bg-surface px-5 py-3 text-base text-ink placeholder:text-muted focus:border-lapis",
          className
        )}
        {...props}
      />
    );
  }
);
