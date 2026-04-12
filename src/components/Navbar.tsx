"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Home, FileText, BarChart3, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DailyReportLogo from "@/components/DailyReportLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Define your nav links here
// ---------------------------------------------------------------------------
const NAV_LINKS = [
  { href: "/", label: "דף הבית", icon: Home },
  { href: "/reports", label: "דוחות", icon: FileText },
  { href: "/calendar", label: "לוח שנה", icon: CalendarDays },
  { href: "/charts", label: "גרפים", icon: BarChart3 },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const displayName = user?.username ?? "משתמש";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/90 backdrop-blur-sm" dir="rtl">
      <div className="flex h-28 w-full items-center px-16 sm:px-20">

        {/* Far right corner – DailyReportLogo */}
        <DailyReportLogo className="shrink-0" />

        {/* Nav buttons – right side */}
        <nav className="hidden md:flex items-center gap-1 ms-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-6 py-3 text-xl font-medium transition-all duration-200",
                pathname === href
                  ? "bg-gradient-to-l from-orange-500 to-orange-950 text-white shadow-md shadow-orange-900/30"
                  : "text-muted-foreground hover:scale-[1.05] hover:bg-gradient-to-l hover:from-orange-100 hover:to-orange-50 hover:text-orange-700 hover:shadow-sm"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Greeting + user icon – left side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xl text-muted-foreground">
            שלום,{" "}
            <span className="font-medium text-foreground">{displayName}</span>
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 bg-primary/10 hover:bg-primary/20 text-primary"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">מחובר</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2"
              >
                <LogOut className="h-4 w-4" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="mx-6 h-10 w-px bg-border shrink-0" />

        {/* Far left corner – NogaLogo */}
        <Image
          src="/images/NogaLogo.png"
          alt="Noga Logo"
          width={150}
          height={65}
          className="object-contain shrink-0"
        />
      </div>
    </header>
  );
}
