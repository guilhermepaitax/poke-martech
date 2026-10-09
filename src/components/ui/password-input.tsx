"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div data-slot="password-input" className="relative">
      <Input
        className={cn("pr-11", className)}
        {...props}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-foreground-subtle hover:bg-white/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          setVisible((current) => !current);
        }}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export { PasswordInput };
export type { PasswordInputProps };
