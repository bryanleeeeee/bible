import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "gilt" | "lapis" | "sage" | "muted";

const tones: Record<Tone, string> = {
  gilt: "bg-gilt/10 text-gilt",
  lapis: "bg-lapis/10 text-lapis",
  sage: "bg-sage/15 text-sage",
  muted: "bg-line/60 text-muted",
};

export function Badge({ className, tone = "muted", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
