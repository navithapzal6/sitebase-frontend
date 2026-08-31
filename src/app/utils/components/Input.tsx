 import * as React from "react";
import { cn } from "@/app/utils/helpers/utils";

type InputProps = React.ComponentProps<"input">;

function Input({ className, type = "text", ...props }: InputProps) {
  const isCheckType = type === "checkbox" || type === "radio";

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        isCheckType
          ? "h-4 w-4 accent-primary cursor-pointer"
          : "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-10 w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-sm shadow-sm transition outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        !isCheckType &&
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
        !isCheckType &&
          "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };