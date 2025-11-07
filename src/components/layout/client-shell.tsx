"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconBroadcast,
  IconChartBar,
  IconHierarchy3,
  IconUsersGroup,
  IconHome,
} from "@tabler/icons-react";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    // if you use cookies server-side, you could also POST /auth/logout here
    router.replace("/auth");
  };

  const links = useMemo(
    () => [
      { label: "Dashboard", href: "/", icon: <IconHome className="h-5 w-5" />, match: /^\/$/ },
      { label: "Fixtures", href: "/fixtures", icon: <IconCalendarEvent className="h-5 w-5" />, match: /^\/fixtures/ },
      { label: "Standings", href: "/standings", icon: <IconChartBar className="h-5 w-5" />, match: /^\/standings/ },
      { label: "Announcements", href: "/announcements", icon: <IconBroadcast className="h-5 w-5" />, match: /^\/announcements/ },
      { label: "Teams", href: "/teams", icon: <IconUsersGroup className="h-5 w-5" />, match: /^\/teams/ },
      { label: "Leaders", href: "/leaders", icon: <IconHierarchy3 className="h-5 w-5" />, match: /^\/leaders/ },
    ],
    []
  );

  const logoutLink = {
    label: "Logout",
    href: "/auth", // visual parity with other links
    icon: <IconArrowLeft className="h-5 w-5" />,
    match: /^\/logout$/, // not actually used, but keeps shape consistent
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-white text-[var(--color-ink)]">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="sidebar-glass justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2 py-1 text-base font-semibold text-black dark:text-white"
              onClick={() => setOpen(false)}
            >
              <img
                src="/favicon.svg"
                alt="Darts Admin Logo"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-md"
              />
              <span>Darts Admin</span>
            </a>

            {/* Nav */}
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={{ ...link, active: link.match.test(pathname ?? "/") }}
                  onClick={() => setOpen(false)}
                />
              ))}

              {/* Logout rendered like the rest, but intercepts click */}
              <SidebarLink
                link={{ ...logoutLink, active: false }}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  handleLogout();
                }}
              />
            </nav>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
