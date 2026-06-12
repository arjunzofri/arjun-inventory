import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-14 flex-row items-center justify-between px-4 lg:px-6">
          {/* Left */}
          <div className="flex flex-row items-center gap-2 shrink-0">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">
              Arjun Inventory
            </span>
          </div>

          {/* Right */}
          <div className="flex flex-row items-center gap-3">
            <div className="hidden flex-col text-right sm:flex">
              <span className="text-sm font-medium leading-none">
                {session.user.name}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {(session.user as any).rol ?? "usuario"}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
