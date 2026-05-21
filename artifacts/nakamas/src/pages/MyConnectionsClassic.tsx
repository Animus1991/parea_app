import React, { useState, useRef, useEffect } from 'react';
import { Users, Search, MessageCircle, MoreVertical, MapPin, UserPlus, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyConnectionsClassic() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'' | string>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [moreMenuOpenId, setMoreMenuOpenId] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const users = useStore(state => state.users);
  const currentUser = useStore(state => state.currentUser);
  const connectionRequests = useStore(state => state.connectionRequests);
  const acceptConnectionRequest = useStore(state => state.acceptConnectionRequest);
  const declineConnectionRequest = useStore(state => state.declineConnectionRequest);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const calculateMutualConnections = (userConnections: string[] = []) => {
    const myConnections = currentUser?.connections || [];
    return myConnections.filter(id => userConnections.includes(id) && id !== currentUser?.id).length;
  };

  const getRoleLabel = (u: typeof users[0]) => {
    if (u.isOrganizer) return t('Διοργανωτής', 'Organizer');
    if (u.reliabilityScore > 80) return t('Εξερευνητής', 'Explorer');
    return t('Αρχάριος', 'Newbie');
  };

  const allConnections = users.filter(u => u.id !== currentUser?.id).map(u => ({
    id: u.id,
    name: u.name,
    role: getRoleLabel(u),
    mutual: calculateMutualConnections(u.connections),
    location: u.city || 'Downtown',
    image: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`
  }));

  const roleOptions = [...new Set(allConnections.map(c => c.role))];

  const filteredConnections = allConnections.filter(c => {
    const matchesSearch = !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || c.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const myPendingRequests = connectionRequests.filter(
    r => r.toUserId === currentUser?.id && r.status === 'pending'
  );

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">{t('Οι Συνδέσεις μου', 'My Nakamas')}</h1>
          <p className="text-gray-400 font-medium text-xs md:text-sm mt-1">{t('Άτομα με τα οποία συνδεθήκατε μέσα από εκδηλώσεις.', "People you've connected with through events.")}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-cyan-600 text-[#0E8B8D]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('all')}
        >
          {t('Συνδέσεις', 'Connections')} ({filteredConnections.length})
        </button>
        <button
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-cyan-600 text-[#0E8B8D]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('requests')}
        >
          {t('Αιτήματα', 'Requests')}
          {myPendingRequests.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{myPendingRequests.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'all' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('Αναζήτηση συνδέσεων...', 'Search connections...')}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="relative shrink-0" ref={filterRef}>
              <Button
                variant="outline"
                className={`flex items-center gap-2 ${filterRole ? 'border-cyan-500 text-cyan-700 bg-cyan-50' : ''}`}
                onClick={() => setShowFilterDropdown(v => !v)}
              >
                <Filter className="w-4 h-4" /> {filterRole || t('Φίλτρα', 'Filter')}
              </Button>
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                  <button
                    onClick={() => { setFilterRole(''); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${filterRole === '' ? 'text-cyan-700 bg-cyan-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {t('Όλοι', 'All')}
                  </button>
                  {roleOptions.map(role => (
                    <button
                      key={role}
                      onClick={() => { setFilterRole(role); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${filterRole === role ? 'text-cyan-700 bg-cyan-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnections.map(conn => (
                <Card key={conn.id} className="p-4 flex items-center justify-between hover:border-cyan-200 transition-colors cursor-pointer group relative">
                  <div className="flex items-center gap-3">
                    <img referrerPolicy="no-referrer" src={conn.image} alt={conn.name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                    <div>
                      <h3 className="font-bold text-[#111827] text-sm group-hover:text-cyan-600 transition-colors">{conn.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {conn.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="neutral" className="text-[9px] px-1.5 py-0">{conn.role}</Badge>
                        {conn.mutual > 0 && <span className="text-[10px] text-gray-400 font-medium">{conn.mutual} {t('Κοινοί', 'mutuals')}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/inbox')}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"
                      title={t('Μήνυμα', 'Message')}
                      aria-label={t('Μήνυμα', 'Message')}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <div className="relative" ref={moreMenuOpenId === conn.id ? moreMenuRef : undefined}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMoreMenuOpenId(moreMenuOpenId === conn.id ? null : conn.id); }}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={t('Περισσότερες επιλογές', 'More options')}
                        title={t('Περισσότερες επιλογές', 'More options')}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {moreMenuOpenId === conn.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                          <button
                            onClick={() => { toast.success(`${t('Προφίλ', 'Profile')}: ${conn.name}`); setMoreMenuOpenId(null); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {t('Προβολή Προφίλ', 'View Profile')}
                          </button>
                          <button
                            onClick={() => { toast.success(t('Αίτημα αποστολής!', 'Request sent!')); setMoreMenuOpenId(null); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {t('Αποστολή Μηνύματος', 'Send Message')}
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => { toast.success(t('Αφαιρέθηκε από τις συνδέσεις', 'Removed from connections')); setMoreMenuOpenId(null); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            {t('Αφαίρεση', 'Remove')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-[#111827]">{t('Δεν βρέθηκαν συνδέσεις', 'No connections found')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('Δοκιμάστε διαφορετικό όρο αναζήτησης.', 'Try a different search term.')}</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {myPendingRequests.length > 0 ? (
            myPendingRequests.map(req => {
              const sender = users.find(u => u.id === req.fromUserId);
              if (!sender) return null;
              return (
                <Card key={req.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      referrerPolicy="no-referrer"
                      src={sender.photoUrl || `https://i.pravatar.cc/150?u=${sender.id}`}
                      alt={sender.name}
                      className="w-12 h-12 rounded-full object-cover bg-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#111827] text-sm">{sender.name}</h3>
                      {req.message && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{req.message}</p>
                      )}
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => acceptConnectionRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded-full hover:bg-cyan-700 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('Αποδοχή', 'Accept')}
                    </button>
                    <button
                      onClick={() => declineConnectionRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> {t('Απόρριψη', 'Decline')}
                    </button>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <UserPlus className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-[#111827]">{t('Δεν υπάρχουν αιτήματα', 'No pending requests')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('Τα αιτήματα σύνδεσης θα εμφανιστούν εδώ.', 'Connection requests will appear here.')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
