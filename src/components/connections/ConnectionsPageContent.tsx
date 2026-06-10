import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, MoreVertical, MapPin, Filter, UserPlus, UserMinus, Flag, Eye, CalendarPlus, Check, X, ChevronDown, Sparkles, Users, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';

// ─── More dropdown ──────────────────────────────────────────────
function MoreMenu({ connId, onViewProfile, onRemove, onReport, onInvite }: { connId: string; onViewProfile: () => void; onRemove: () => void; onReport: () => void; onInvite: () => void }) {
  const { t } = useLanguage();
  const a = usePageContrast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={`p-2 rounded-full transition-colors ${a.isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}>
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-lg z-50 py-1 text-sm ${a.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button onClick={() => { onViewProfile(); setOpen(false); }} className={`w-full px-3 py-2 text-left flex items-center gap-2 ${a.isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Eye className="w-4 h-4" /> {t('Προβολή Προφίλ', 'View Profile')}
          </button>
          <button onClick={() => { onInvite(); setOpen(false); }} className={`w-full px-3 py-2 text-left flex items-center gap-2 ${a.isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <CalendarPlus className="w-4 h-4" /> {t('Πρόσκληση σε Εκδήλωση', 'Invite to Event')}
          </button>
          <div className={`my-1 h-px ${a.isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <button onClick={() => { onRemove(); setOpen(false); }} className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-500 hover:bg-red-50/10">
            <UserMinus className="w-4 h-4" /> {t('Αφαίρεση Σύνδεσης', 'Remove Connection')}
          </button>
          <button onClick={() => { onReport(); setOpen(false); }} className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-500 hover:bg-red-50/10">
            <Flag className="w-4 h-4" /> {t('Αναφορά', 'Report')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Trust tier icon ─────────────────────────────────────────────
function TrustBadge({ tier, isDark }: { tier: string; isDark: boolean }) {
  const a = usePageContrast();
  if (tier === '3_high_trust') return <ShieldCheck className={`w-3.5 h-3.5 ${a.trustHigh}`} />;
  if (tier === '2_confirmed') return <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />;
  return null;
}

// ─── Main component ──────────────────────────────────────────────
export default function ConnectionsPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const connectionRequests = useStore((s) => s.connectionRequests);
  const acceptConnectionRequest = useStore((s) => s.acceptConnectionRequest);
  const declineConnectionRequest = useStore((s) => s.declineConnectionRequest);
  const removeConnection = useStore((s) => s.removeConnection);
  const sendConnectionRequest = useStore((s) => s.sendConnectionRequest);
  const addNotification = useStore((s) => s.addNotification);

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggested'>('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'organizer' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'mutual' | 'trust'>('name');

  // ─── Computed data ───────────────────────────────────────
  const myConnectionIds = currentUser?.connections || [];

  const connections = useMemo(() => {
    return users
      .filter((u) => myConnectionIds.includes(u.id) && u.id !== currentUser?.id)
      .map((u) => {
        const myConns = currentUser?.connections || [];
        const theirConns = u.connections || [];
        const mutual = myConns.filter((id) => theirConns.includes(id) && id !== currentUser?.id && id !== u.id).length;
        const sharedInterests = (currentUser?.interests || []).filter((i) => (u.interests || []).includes(i));
        return { ...u, mutual, sharedInterests, role: u.isOrganizer ? t('Διοργανωτής', 'Organizer') : (u.reliabilityScore > 80 ? t('Εξερευνητής', 'Explorer') : t('Αρχάριος', 'Newbie')) };
      });
  }, [users, myConnectionIds, currentUser, t]);

  const filteredConnections = useMemo(() => {
    let list = connections;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    }
    if (roleFilter === 'organizer') list = list.filter((c) => c.isOrganizer);
    if (roleFilter === 'user') list = list.filter((c) => !c.isOrganizer);
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'mutual') list = [...list].sort((a, b) => b.mutual - a.mutual);
    if (sortBy === 'trust') list = [...list].sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    return list;
  }, [connections, search, roleFilter, sortBy]);

  const pendingRequests = useMemo(() => {
    return connectionRequests
      .filter((r) => r.toUserId === currentUser?.id && r.status === 'pending')
      .map((r) => ({ ...r, user: users.find((u) => u.id === r.fromUserId)! }))
      .filter((r) => r.user);
  }, [connectionRequests, currentUser, users]);

  const suggested = useMemo(() => {
    const connIds = new Set(myConnectionIds);
    const pendingIds = new Set(connectionRequests.filter((r) => r.status === 'pending').map((r) => r.fromUserId === currentUser?.id ? r.toUserId : r.fromUserId));
    return users
      .filter((u) => u.id !== currentUser?.id && !connIds.has(u.id) && !pendingIds.has(u.id))
      .map((u) => {
        const sharedInterests = (currentUser?.interests || []).filter((i) => (u.interests || []).includes(i));
        return { ...u, sharedInterests };
      })
      .filter((u) => u.sharedInterests.length > 0)
      .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length);
  }, [users, myConnectionIds, connectionRequests, currentUser]);

  // ─── Handlers ────────────────────────────────────────────
  const handleMessage = (userId: string) => navigate('/chats');
  const handleViewProfile = (user: { id: string; isOrganizer: boolean }) => {
    if (user.isOrganizer) navigate(`/organizer/${user.id}`);
    else navigate('/profile');
  };
  const handleRemove = (userId: string, name: string) => {
    removeConnection(userId);
    addNotification({ message: t(`Αφαιρέθηκε η σύνδεση με ${name}`, `Removed connection with ${name}`), type: 'system', time: 'now' });
  };
  const handleAccept = (requestId: string, name: string) => {
    acceptConnectionRequest(requestId);
    addNotification({ message: t(`Αποδεχτήκατε τη σύνδεση με ${name}`, `Accepted connection with ${name}`), type: 'system', time: 'now' });
  };
  const handleDecline = (requestId: string) => declineConnectionRequest(requestId);
  const handleConnect = (userId: string, name: string) => {
    sendConnectionRequest(userId);
    addNotification({ message: t(`Στάλθηκε αίτημα σύνδεσης στο ${name}`, `Connection request sent to ${name}`), type: 'system', time: 'now' });
  };

  // ─── Render ──────────────────────────────────────────────
  const subColor = a.sub;
  const inputClasses = a.isDark
    ? `bg-gray-800 border-gray-700 text-white placeholder-gray-400 ${a.ring}`
    : `bg-white border-gray-200 text-gray-900 placeholder-gray-400 ${a.ring}`;

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${a.head}`}>{t('Οι Συνδέσεις μου', 'My Nakamas')}</h1>
          <p className={`font-medium text-xs md:text-sm mt-1 ${subColor}`}>{t('Άτομα με τα οποία συνδεθήκατε μέσα από εκδηλώσεις.', 'People you\'ve connected with through events.')}</p>
        </div>
        <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => navigate('/nearby')}>
          <Users className="w-4 h-4" /> {t('Βρες Nakamas', 'Find Nakamas')}
        </Button>
      </div>

      {/* Tabs — rounded pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          className={cn('px-3.5 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5', activeTab === 'all' ? a.chipActive : a.chipInactive)}
          onClick={() => setActiveTab('all')}
        >
          {t('Συνδέσεις', 'Connections')}
          <span className="opacity-70">({connections.length})</span>
        </button>
        <button
          className={cn('px-3.5 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5', activeTab === 'requests' ? a.chipActive : a.chipInactive)}
          onClick={() => setActiveTab('requests')}
        >
          {t('Αιτήματα', 'Requests')}
          {pendingRequests.length > 0 && <span className={`${a.requestBadge} text-white text-xs min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center`}>{pendingRequests.length}</span>}
        </button>
        <button
          className={cn('px-3.5 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5', activeTab === 'suggested' ? a.chipActive : a.chipInactive)}
          onClick={() => setActiveTab('suggested')}
        >
          <Sparkles className="w-3.5 h-3.5" /> {t('Προτάσεις', 'Suggested')}
          {suggested.length > 0 && <span className={`${a.isDark ? 'bg-gray-600' : 'bg-gray-400'} text-white text-xs min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center`}>{suggested.length}</span>}
        </button>
      </div>

      {/* Search + Filter (only on connections tab) */}
      {activeTab === 'all' && (
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${a.muted}`} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Αναζήτηση συνδέσεων...', 'Search connections...')}
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
            />
          </div>
          <div className="relative">
            <Button variant="outline" className="shrink-0 flex items-center gap-2" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="w-4 h-4" /> {t('Φίλτρα', 'Filter')} <ChevronDown className="w-3 h-3" />
            </Button>
            {filterOpen && (
              <div className={`absolute right-0 top-full mt-1 w-56 rounded-lg border shadow-lg z-50 p-3 space-y-3 ${a.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${a.muted}`}>{t('Ρόλος', 'Role')}</label>
                  <div className="flex gap-1 mt-1">
                    {(['all', 'organizer', 'user'] as const).map((r) => (
                      <button key={r} onClick={() => setRoleFilter(r)} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${roleFilter === r ? a.acceptBtn : (a.isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                        {r === 'all' ? t('Όλοι', 'All') : r === 'organizer' ? t('Διοργανωτής', 'Organizer') : t('Χρήστης', 'User')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${a.muted}`}>{t('Ταξινόμηση', 'Sort')}</label>
                  <div className="flex gap-1 mt-1">
                    {(['name', 'mutual', 'trust'] as const).map((s) => (
                      <button key={s} onClick={() => setSortBy(s)} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${sortBy === s ? a.acceptBtn : (a.isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                        {s === 'name' ? t('Όνομα', 'Name') : s === 'mutual' ? t('Κοινοί', 'Mutual') : t('Εμπιστοσύνη', 'Trust')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONNECTIONS TAB ═══ */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConnections.length === 0 && (
            <div className={`col-span-full text-center py-12 ${a.muted}`}>
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm">{search ? t('Δεν βρέθηκαν αποτελέσματα', 'No results found') : t('Δεν έχετε συνδέσεις ακόμα', 'No connections yet')}</p>
              <p className="text-xs mt-1">{t('Βρείτε Nakamas στις εκδηλώσεις!', 'Find Nakamas at events!')}</p>
            </div>
          )}
          {filteredConnections.map((conn) => (
            <Card key={conn.id} className={`p-4 flex items-center justify-between ${a.cardHover} transition-colors cursor-pointer group`} onClick={() => handleViewProfile(conn)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img referrerPolicy="no-referrer" src={conn.photoUrl || `https://i.pravatar.cc/150?u=${conn.id}`} alt={conn.name} className={`w-12 h-12 rounded-full object-cover ${a.isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
                  <TrustBadge tier={conn.trustTier} isDark={a.isDark} />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-sm truncate ${a.head} ${a.hoverText} transition-colors`}>{conn.name}</h3>
                  <p className={`text-xs flex items-center gap-1 mt-0.5 ${a.muted}`}>
                    <MapPin className="w-3 h-3 shrink-0" /> {conn.city}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="neutral" className="text-xs px-1.5 py-0">{conn.role}</Badge>
                    <span className={`text-xs font-medium ${a.muted}`}>{conn.mutual} {t('Κοινοί', 'mutuals')}</span>
                  </div>
                  {conn.sharedInterests.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {conn.sharedInterests.slice(0, 3).map((interest) => (
                        <span key={interest} className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${a.tagBg}`}>{interest}</span>
                      ))}
                      {conn.sharedInterests.length > 3 && <span className={`text-xs font-medium ${a.muted}`}>+{conn.sharedInterests.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleMessage(conn.id)} className={`p-2 rounded-full transition-colors ${a.msgIcon}`} title={t('Μήνυμα', 'Message')}>
                  <MessageCircle className="w-5 h-5" />
                </button>
                <MoreMenu
                  connId={conn.id}
                  onViewProfile={() => handleViewProfile(conn)}
                  onRemove={() => handleRemove(conn.id, conn.name)}
                  onReport={() => navigate('/report')}
                  onInvite={() => navigate('/create')}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ REQUESTS TAB ═══ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 && (
            <div className={`text-center py-12 ${a.muted}`}>
              <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm">{t('Δεν υπάρχουν αιτήματα', 'No pending requests')}</p>
              <p className="text-xs mt-1">{t('Θα ειδοποιηθείτε όταν κάποιος θέλει να συνδεθεί.', 'You\'ll be notified when someone wants to connect.')}</p>
            </div>
          )}
          {pendingRequests.map((req) => (
            <Card key={req.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => handleViewProfile(req.user)}>
                  <img referrerPolicy="no-referrer" src={req.user.photoUrl || `https://i.pravatar.cc/150?u=${req.user.id}`} alt={req.user.name} className={`w-12 h-12 rounded-full object-cover shrink-0 ${a.isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${a.head}`}>{req.user.name}</h3>
                      {req.user.isOrganizer && <Badge variant="neutral" className="text-xs px-1.5 py-0">{t('Διοργανωτής', 'Organizer')}</Badge>}
                    </div>
                    <p className={`text-xs flex items-center gap-1 mt-0.5 ${a.muted}`}>
                      <MapPin className="w-3 h-3" /> {req.user.city}
                    </p>
                    {req.message && <p className={`text-xs mt-1.5 italic ${a.isDark ? 'text-gray-300' : 'text-gray-600'}`}>"{req.message}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleAccept(req.id, req.user.name)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${a.acceptBtn}`}>
                    <Check className="w-3.5 h-3.5" /> {t('Αποδοχή', 'Accept')}
                  </button>
                  <button onClick={() => handleDecline(req.id)} className={`p-1.5 rounded-lg transition-colors ${a.isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ SUGGESTED TAB ═══ */}
      {activeTab === 'suggested' && (
        <div className="space-y-4">
          {suggested.length === 0 && (
            <div className={`text-center py-12 ${a.muted}`}>
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm">{t('Δεν υπάρχουν προτάσεις', 'No suggestions yet')}</p>
              <p className="text-xs mt-1">{t('Συμμετέχετε σε εκδηλώσεις για να βρείτε Nakamas!', 'Join events to find Nakamas!')}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggested.map((user) => (
              <Card key={user.id} className={`p-4 ${a.cardHover} transition-colors cursor-pointer group`} onClick={() => handleViewProfile(user)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img referrerPolicy="no-referrer" src={user.photoUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className={`w-12 h-12 rounded-full object-cover shrink-0 ${a.isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
                    <div className="min-w-0">
                      <h3 className={`font-bold text-sm truncate ${a.head} ${a.hoverText} transition-colors`}>{user.name}</h3>
                      <p className={`text-xs flex items-center gap-1 mt-0.5 ${a.muted}`}>
                        <MapPin className="w-3 h-3" /> {user.city}
                        {user.isOrganizer && <> · <Badge variant="neutral" className="text-xs px-1.5 py-0">{t('Διοργανωτής', 'Organizer')}</Badge></>}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {user.sharedInterests.slice(0, 3).map((interest) => (
                          <span key={interest} className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${a.tagBg}`}>{interest}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleConnect(user.id, user.name); }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${a.acceptBtn}`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {t('Σύνδεση', 'Connect')}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
