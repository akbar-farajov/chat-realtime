"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImageModalProps {
  src: string;
  children: React.ReactNode;
}

export function ImageModal({ src, children }: ImageModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-screen w-full max-w-none! overflow-hidden rounded-none border-0 bg-background p-0 shadow-none">
        <VisuallyHidden>
          <DialogTitle>Image preview</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-start border-b bg-background/80 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Download"
            >
              <Download className="size-4" />
            </Button>
          </div>
          <div className="relative flex-1 bg-black/80 p-4">
            <Image
              src={src}
              alt="Full size attachment"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
