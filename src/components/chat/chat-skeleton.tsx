import { Skeleton } from "@/components/ui/skeleton";

export function ChatHeaderSkeleton() {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </header>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      <div className="flex justify-start">
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-12 w-56 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-64 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-12 w-40 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-12 w-52 rounded-2xl" />
      </div>
    </div>
  );
}

export function ChatInputSkeleton() {
  return (
    <div className="px-4 pb-3">
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

export function ChatAreaSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <ChatHeaderSkeleton />
      <ChatMessagesSkeleton />
      <ChatInputSkeleton />
    </div>
  );
}
