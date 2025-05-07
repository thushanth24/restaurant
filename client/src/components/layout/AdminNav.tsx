import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/notification-bell";
import { useAuth } from "@/context/AuthContext";
import { useMobile } from "@/hooks/use-mobile";

export default function AdminNav() {
  const { user, logout } = useAuth();
  const isMobile = useMobile();

  return (
    <nav className="border-b border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">QR Restaurant</h1>
          {!isMobile && (
            <div className="ml-6 flex gap-4">
              <Link href="/admin" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              <Link href="/admin/menu" className="text-sm font-medium hover:text-primary">
                Menu
              </Link>
              <Link href="/admin/tables" className="text-sm font-medium hover:text-primary">
                Tables
              </Link>
              <Link href="/admin/orders" className="text-sm font-medium hover:text-primary">
                Orders
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium hover:text-primary">
                Reports
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          
          <div className="text-sm text-muted-foreground">
            <span className="mr-2 text-foreground font-medium">{user?.name}</span>
            <span className="rounded bg-muted px-2 py-1 text-xs capitalize">
              {user?.role}
            </span>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => logout()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}