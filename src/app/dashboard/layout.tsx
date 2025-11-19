"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { LayoutDashboard, LogOut, User, PanelLeft, Loader } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase/auth/use-user";
import { useFirebase } from "@/firebase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const { auth } = useFirebase();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
        localStorage.clear(); // Clear all student data on logout
        router.push("/login");
    }
  };

  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader className="h-10 w-10 animate-spin" />
        </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <Logo />
            </SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive
                  tooltip={{ children: "Dashboard" }}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Profile" }}>
                  <Link href="/dashboard/profile">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip={{ children: "Logout" }}>
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="flex-1 font-headline text-xl font-semibold">Student Dashboard</h1>
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
