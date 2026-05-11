import { Calendar, MessageCircle, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  time: string;
  read: boolean;
  icon: LucideIcon;
  color: string;
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'match',
    message: "New Match! You've been placed in a high-trust group for 'Weekend Getaway: Arachova Retreat'.",
    time: '10 mins ago',
    read: false,
    icon: Users,
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: 'n2',
    type: 'message',
    message: "Organizer Alex sent a message: 'Hey everyone! Please check the updated meeting point for tomorrow's hike.'",
    time: '1 hour ago',
    read: false,
    icon: MessageCircle,
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    id: 'n3',
    type: 'reminder',
    message: "Reminder: 'Laugh out Loud: Stand-up Comedy' starts in 24 hours. Don't forget your tickets!",
    time: '3 hours ago',
    read: true,
    icon: Calendar,
    color: 'bg-amber-100 text-amber-600'
  },
  {
    id: 'n4',
    type: 'system',
    message: "Your reliability score increased to 95%. Thanks for being a great community member!",
    time: '2 days ago',
    read: true,
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-600'
  }
];

export const unreadNotificationCount = mockNotifications.filter(n => !n.read).length;
