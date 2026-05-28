import React, { useState, useMemo } from 'react';
import { Users, Search, MessageCircle, MoreVertical, MapPin, Filter, Zap, Star, Bell } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { motion } from 'motion/react';

const ONLINE_IDS = new Set(['u1', 'u2', 'org1']);

function computeMatchScore(myInterests: string[], theirInterests: string[]): number {
  if (!myInterests.length || !theirInterests.length) return 0;
  const common = myInterests.filter((i) => theirInterests.includes(i)).length;
  return Math.round((common / Math.max(myInterests.length, theirInterests.length)) * 100);
}

function MatchBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-amber-400' : 'bg-gray-300';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400">{score}%</span>
    </div>
  );
}

export default function MyConnectionsClassic() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set());

  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  const connectionRequests = useStore((state) => state.connectionRequests);

  const calculateMutuals = (userConnections: string[] = []) => {
    const myConnections = currentUser?.connections || [];
    return myConnections.filter((id) => userConnections.includes(id) && id !== currentUser?.id).length;
  };

  const connections = useMemo(() => {
    return users
      .filter((u) => u.id !== currentUser?.id)
      .map((u) => ({
        id: u.id,
        name: u.name,
        role: u.isOrganizer
          ? t('Διοργανωτής', 'Organizer')
          : u.reliabilityScore > 80
          ? t('Εξερευνητής', 'Explorer')
          : t('Αρχάριος', 'Newbie'),
        mutual: calculateMutuals(u.connections),
        location: u.city || 'Athens',
        image: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`,
        isOnline: ONLINE_IDS.has(u.id),
        matchScore: computeMatchScore(currentUser?.interests ?? [], u.interests ?? []),
        reliabilityScore: u.reliabilityScore ?? 50,
        interests: u.interests ?? [],
      }))
      .filter((c) =>
        !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [users, currentUser, searchQuery, t]);

  const pendingRequests = connectionRequests.filter(
    (r) => r.toUserId === currentUser?.id && r.status === 'pending',
  );

  const handleNudge = (id: string, name: string) => {
    setNudgedIds((prev) => new Set(prev).add(id));
    setTimeout(() => setNudgedIds((prev) => { const next = new Set(prev); next.delete(id); return next; }), 3000);
  };

  return (
    <div className="max-w-full mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[16px] md:text-[18px] font-bold text-[#111827]">
            {t('Οι Συνδέσεις μου', 'My Nakamas')}
          </h1>
          <p className="text-gray-500 font-medium text-[13px] md:text-sm mt-1">
            {t('Άτομα με τα οποία συνδεθήκατε μέσα από εκδηλώσεις.', "People you've connected with through events.")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 self-start">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {ONLINE_IDS.size} {t('online τώρα', 'online now')}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'all' ? 'border-cyan-600 text-[#0E8B8D]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('all')}
        >
          {t('Συνδέσεις', 'Connections')} ({connections.length})
        </button>
        <button
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'requests' ? 'border-cyan-600 text-[#0E8B8D]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          {t('Αιτήματα', 'Requests')}
          {pendingRequests.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Αναζήτηση συνδέσεων...', 'Search connections...')}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 bg-gray-50"
          />
        </div>
        <Button variant="outline" className="shrink-0 flex items-center gap-2">
          <Filter className="w-4 h-4" /> {t('Φίλτρα', 'Filter')}
        </Button>
      </div>

      {/* Connection cards */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {connections.map((conn, i) => {
            const nudged = nudgedIds.has(conn.id);
            return (
              <motion.div
                key={conn.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
              >
                <Card className="p-4 hover:border-cyan-200 transition-colors group">
                  <div className="flex items-start gap-3">
                    {/* Avatar + online dot */}
                    <div className="relative shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={conn.image}
                        alt={conn.name}
                        className="w-12 h-12 rounded-full object-cover bg-gray-100 ring-1 ring-gray-100"
                      />
                      {conn.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#111827] text-[13.5px] group-hover:text-[#0E8B8D] transition-colors truncate">
                          {conn.name}
                        </h3>
                        {conn.isOnline && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
                            {t('Online', 'Online')}
                          </span>
                        )}
                      </div>

                      <p className="text-[11.5px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 shrink-0" /> {conn.location}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="neutral" className="text-[9px] px-1.5 py-0">
                          {conn.role}
                        </Badge>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {conn.mutual} {t('κοινοί', 'mutuals')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-amber-400" /> {conn.reliabilityScore}%
                        </span>
                      </div>

                      {/* Match score bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {t('Ταίριασμα:', 'Match:')}
                        </span>
                        <MatchBar score={conn.matchScore} />
                      </div>

                      {/* Common interests chips */}
                      {conn.interests.filter((i) => (currentUser?.interests ?? []).includes(i)).length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {conn.interests
                            .filter((i) => (currentUser?.interests ?? []).includes(i))
                            .slice(0, 3)
                            .map((interest) => (
                              <span
                                key={interest}
                                className="text-[9px] font-semibold bg-cyan-50 text-[#0E8B8D] px-1.5 py-0.5 rounded-full border border-[#a5f3fc]/50"
                              >
                                {interest}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"
                        title={t('Μήνυμα', 'Message')}
                        aria-label={t('Μήνυμα', 'Message')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNudge(conn.id, conn.name)}
                        disabled={nudged}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${
                          nudged
                            ? 'bg-amber-50 text-amber-500 border border-amber-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 border border-transparent'
                        }`}
                        title={t('Στείλε nudge', 'Send nudge')}
                      >
                        <Bell className="w-3 h-3" />
                        {nudged ? t('Στάλθηκε!', 'Sent!') : 'Nudge'}
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {connections.length === 0 && (
            <div className="col-span-2">
              <Card className="p-8 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-medium">
                  {t('Δεν βρέθηκαν συνδέσεις.', 'No connections found.')}
                </p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-400 text-sm font-medium">
                {t('Δεν υπάρχουν εκκρεμή αιτήματα.', 'No pending requests.')}
              </p>
            </Card>
          ) : (
            pendingRequests.map((req) => {
              const sender = users.find((u) => u.id === req.fromUserId);
              if (!sender) return null;
              return (
                <Card key={req.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={sender.photoUrl || `https://i.pravatar.cc/150?u=${sender.id}`}
                        alt={sender.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      {ONLINE_IDS.has(sender.id) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#111827] text-[13px]">{sender.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {t('Σε αιτείται ως Nakama', 'Wants to connect with you')}
                      </p>
                      <div className="mt-1">
                        <MatchBar score={computeMatchScore(currentUser?.interests ?? [], sender.interests ?? [])} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 rounded-xl bg-[#111827] text-white text-[12px] font-bold hover:bg-black transition-all">
                      {t('Αποδοχή', 'Accept')}
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-[12px] font-bold hover:bg-gray-200 transition-all">
                      {t('Απόρριψη', 'Decline')}
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
