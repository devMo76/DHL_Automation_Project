"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bot, LayoutDashboard, Upload, FileText } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Upload Console", icon: Upload },
  {
    href: "/dashboard/rpa-results",
    label: "RPA Results",
    icon: Bot,
    adminOnly: true,
  },
  { href: "/dashboard/articles", label: "Articles", icon: FileText },
];

interface NavLinksProps {
  role: string | null;
}

export function NavLinks({ role }: NavLinksProps) {
  const pathname = usePathname();

  const visibleLinks = links.filter((link) => {
    if (link.adminOnly && role !== "admin") return false;
    return true;
  });

  return (
    <nav className="flex flex-col gap-1">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
