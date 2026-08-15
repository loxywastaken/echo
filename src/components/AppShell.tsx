"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { CreateModal } from "./CreateModal";
import { SearchModal } from "./SearchModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [create, setCreate] = useState(false);
  const [search, setSearch] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar onCreate={() => setCreate(true)} onSearch={() => setSearch(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onSearch={() => setSearch(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</main>
        <MobileNav onCreate={() => setCreate(true)} />
      </div>
      <CreateModal open={create} onClose={() => setCreate(false)} />
      <SearchModal open={search} onClose={() => setSearch(false)} />
    </div>
  );
}
