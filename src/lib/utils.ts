import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "psalms-23-1" -> "Psalm 23:1" (via book name map) */
export function displayRef(ref: string, bookName: string) {
  const parts = ref.split("-");
  const verse = parts.pop();
  const chapter = parts.pop();
  const name = bookName === "Psalms" ? "Psalm" : bookName;
  return `${name} ${chapter}:${verse}`;
}
