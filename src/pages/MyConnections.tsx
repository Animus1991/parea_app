import React, { useState } from 'react';
import { Users, Search, MessageCircle, MapPin, UserPlus, ShieldCheck, Calendar } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { currentUser, mockUsers } from '../data/mockUsers';
import { useLanguage } from "../lib/i18n";
import { useNavigate } from 'react-router-dom';

export default function MyConnections() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [search, setSearch] = useState('');
  
  const calculateMutualConnections = (userConnections: string[] = []) => {
    const myConnections = currentUser.connections || [];
    return myConnections.filter(id => userConnections.includes(id) && id !== currentUser.id).length;
  };

  const connections = mockUsers.filter(u => u.id !== currentUser.id).map((u, idx) => ({
    id: u.id,
    name: u.name,
    role: u.isOrganizer ? t(`Διοργανωτής`, `Organizer`) : (u.reliabilityScore > 80 ? t(`Εξερευνητής`, `Explorer`) : t(`Νέος`, `New`)),
    mutual: calculateMutualConnections(u.connections),
    location: u.city || t(`Κέντρο`, `Center`),
    image: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`,
    reliability: u.reliabilityScore || 85,
    eventsTogether: [3, 1, 5, 2][idx % 4],
  }));

  const filtered = connections.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22.3383703325px] md:text-[416.290936597px] font-bold text-[#111827]">{t(`Οι Συνδέσεις μου`, `My Connections`)}</h1>
          <p className="text-gray-500 font-medium text-[12.1964473899675px] md:text-[4.1569269492619px] mt-1">{t(`Άτομα που έχετε γνωρίσει μέσω εκδηλώσεων`, `People you've met through events`)}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t(`Αναζήτηση συνδέσεων...`, `Search connections...`)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[11.25px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-md text-[12.72px] font-bold transition-colors ${activeTab === 'all' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500'}`}>
          {t(`Όλες`, `All`)} ({connections.length})
        </button>
        <button onClick={() => setActiveTab('requests')} className={`px-4 py-1.5 rounded-md text-[14.2457535px] font-bold transition-colors ${activeTab === 'requests' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500'}`}>
          {t(`Αιτήματα`, `Requests`)} (0)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(conn => (
          <Card key={conn.id} className="p-4 flex items-center gap-4 hover:border-cyan-200 transition-colors">
            <img src={conn.image} alt={conn.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[16.75971px] text-[#111827]">{conn.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="neutral" className="text-[12.1125px]">{conn.role}</Badge>
                {conn.mutual > 0 && <span className="text-[12.1125px] text-gray-400 font-medium">{conn.mutual} {t(`κοινές`, `mutual`)}</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[12.1125px] text-gray-400 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {conn.location}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-500" /> {conn.reliability}%</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {conn.eventsTogether} {t(`μαζί`, `together`)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/chats')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-cyan-600 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
