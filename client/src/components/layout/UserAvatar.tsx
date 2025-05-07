import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';

interface User {
  id: number;
  name: string;
  role?: string;
  username?: string;
}

interface UserAvatarProps {
  user: User;
  showTooltip?: boolean;
}

export default function UserAvatar({ user, showTooltip = true }: UserAvatarProps) {
  const { logout } = useAuth();
  const initials = getInitials(user.name);
  
  // Determine background color based on role
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-secondary';
      case 'waiter':
        return 'bg-primary';
      case 'cashier':
        return 'bg-accent';
      default:
        return 'bg-primary';
    }
  };
  
  const avatar = (
    <div className="flex items-center gap-2">
      <Avatar className={`${getRoleColor(user.role)} text-white`}>
        <AvatarFallback className="text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{user.name}</span>
    </div>
  );

  const handleLogout = async () => {
    try {
      await logout();
      // The user should be redirected automatically after logout
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {avatar}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
