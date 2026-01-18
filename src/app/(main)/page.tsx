import { MessageCircle } from "lucide-react";

export default function MainPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-card shadow-sm">
          <MessageCircle className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="text-lg font-medium text-foreground">
            Select a chat to start messaging
          </div>
          <div className="text-sm text-muted-foreground">
            Pick a conversation from the sidebar to view messages.
          </div>
        </div>
      </div>
    </div>
  );
}
