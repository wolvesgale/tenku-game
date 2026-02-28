"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, MessageSquare, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/rooms",         icon: Gamepad2,       label: "ルーム" },
  { href: "/dm",            icon: MessageSquare,  label: "DM" },
  { href: "/notifications", icon: Bell,           label: "通知" },
  { href: "/profile",       icon: User,           label: "プロフィール" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0F0F1A]/95 backdrop-blur-lg border-t border-[#2A2A45] pb-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all",
                active ? "text-violet-400" : "text-gray-600 hover:text-gray-400"
              )}
            >
              <div className={cn("p-1.5 rounded-lg", active && "bg-violet-950")}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
