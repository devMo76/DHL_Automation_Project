import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-[#FFCC00] flex items-center justify-center">
            <span className="text-xs font-black text-[#D40511]">DHL</span>
          </div>
          <span className="font-semibold text-sm">Knowledge Base</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <NavLinks />
      </div>
    </aside>
  );
}
