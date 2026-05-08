import React, { useState } from 'react';
import { Users, Search, MessageCircle, MoreVertical, Coffee, MapPin, Calendar, UserPlus, Filter } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { currentUser, mockUsers } from '../data/mockUsers';
import { useLanguage } from "../lib/i18n";

export default function MyConnections() {
    const { t } = useLanguage();
    
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  
  // Calculate mutual connections
  const calculateMutualConnections = (userConnections: string[] = []) => {
    const myConnections = currentUser.connections || [];
    // The mutual count is the intersection of myConnections and their connections
    const mutuals = myConnections.filter(id => userConnections.includes(id) && id !== currentUser.id);
    return mutuals.length;
  };

  // Map to format
  const connections = mockUsers.filter(u => u.id !== currentUser.id).map(u => ({
    id: u.id,
    name: u.name,
    role: u.isOrganizer ? t(`Διοργανωτής`, `Organizer`) : (u.reliabilityScore > 80 ? t(`Εξερευνητής`, `Explorer`) : t(`Νέος`, `New`)),
    mutual: calculateMutualConnections(u.connections),
    location: u.city || t(`Κέντρο`, `Center`),
    image: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`
  }));

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">
</h1>
</div>
</div>
</div>
  );
}
