"use client";

import { Loader2, Paperclip, Send, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/upload";

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ChatInputProps {
  onSendMessage: (payload: {
    content: string;
    type: "text" | "image";
    filePath?: string;
    fileUrl?: string;
    conversationId?: string;
  }) => Promise<void>;
  conversationId?: string;
  ensureConversationId?: () => Promise<string | null>;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  conversationId,
  ensureConversationId,
  disabled = false,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isDisabled = disabled || isUploading;
  const canSend =
    (inputValue.trim().length > 0 || selectedImages.length > 0) && !isDisabled;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: SelectedImage[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      newImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setSelectedImages((prev) => [...prev, ...newImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const content = inputValue.trim();
    const imagesToSend = [...selectedImages];

    if (!content && imagesToSend.length === 0) return;

    setInputValue("");
    setSelectedImages([]);
    setIsUploading(true);

    let resolvedConversationId = conversationId;

    if (!resolvedConversationId && imagesToSend.length > 0) {
      const ensuredConversationId = await ensureConversationId?.();
      if (ensuredConversationId) {
        resolvedConversationId = ensuredConversationId;
      }
    }

    if (content) {
      await onSendMessage({
        content,
        type: "text",
        conversationId: resolvedConversationId ?? undefined,
      });
    }

    for (const image of imagesToSend) {
      if (!resolvedConversationId) {
        URL.revokeObjectURL(image.previewUrl);
        continue;
      }

      const uploadResult = await uploadFile(image.file, resolvedConversationId);
      if (uploadResult) {
        await onSendMessage({
          content: "",
          type: "image",
          filePath: uploadResult.filePath,
          fileUrl: uploadResult.signedUrl,
          conversationId: resolvedConversationId,
        });
      }
      URL.revokeObjectURL(image.previewUrl);
    }

    setIsUploading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 z-10 bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:static md:bg-transparent md:pb-3 md:pt-0"
    >
      {selectedImages.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-input/50 p-2">
          {selectedImages.map((image) => (
            <div key={image.id} className="group relative">
              <Image
                src={image.previewUrl}
                alt="Preview"
                width={80}
                height={80}
                className="size-20 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex h-12 items-center gap-2 rounded-full bg-input px-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="size-10 shrink-0 rounded-full"
          aria-label="Attach image"
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Paperclip className="size-5" />
          )}
        </Button>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={isDisabled}
          className="h-8 flex-1 border-0 bg-transparent! shadow-none focus-visible:ring-0"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className="size-10 shrink-0 rounded-full"
          aria-label="Send message"
        >
          <Send className="size-5" />
        </Button>
      </div>
    </form>
  );
}
