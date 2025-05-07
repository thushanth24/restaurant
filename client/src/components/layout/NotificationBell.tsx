import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationBellProps {
  hasNotifications: boolean;
  onClick?: () => void;
}

export default function NotificationBell({ hasNotifications, onClick }: NotificationBellProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="relative bg-neutral-100 p-2 rounded-full hover:bg-neutral-200"
            size="icon"
            variant="ghost"
            onClick={onClick}
          >
            <Bell className="h-5 w-5 text-neutral-600" />
            {hasNotifications && (
              <span className="notification-dot notification-pulse"></span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasNotifications ? 'You have new notifications' : 'No new notifications'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
