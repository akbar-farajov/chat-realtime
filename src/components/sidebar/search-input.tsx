import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchInput() {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      <Input
        placeholder="Search or start new chat"
        className="h-9 rounded-full border-transparent bg-zinc-100 pl-9 text-sm focus-visible:border-zinc-200 focus-visible:ring-0"
      />
    </div>
  );
}
