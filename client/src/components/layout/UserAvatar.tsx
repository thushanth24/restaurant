import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  // Wrap in tooltip if tooltip is enabled
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatar}
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.name}</p>
            {user.role && (
              <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
            )}
            {user.username && (
              <p className="text-xs text-neutral-500">@{user.username}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return avatar;
}
