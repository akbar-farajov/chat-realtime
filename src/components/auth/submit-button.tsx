"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  pendingText: string;
  children: React.ReactNode;
}

export function SubmitButton({ pendingText, children }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
