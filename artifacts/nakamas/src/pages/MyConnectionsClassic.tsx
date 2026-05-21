import React, { useState } from 'react';
import { Users, Search, MessageCircle, MoreVertical, MapPin, UserPlus, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

export default function MyConnectionsClassic() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const users = useStore(state => state.users);
  const currentUser = useStore(state => state.currentUser);
  const connectionRequests = useStore(state => state.connectionRequests);
  const acceptConnectionRequest = useStore(state => state.acceptConnectionRequest);
  const declineConnectionRequest = useStore(state => state.declineConnectionRequest);

  const calculateMutualConnections = (userConnections: string[] = []) => {
    const myConnections = currentUser?.connections || [];
    return myConnections.filter(id => userConnections.includes(id) && id !== currentUser?.id).length;
  };

  const allConnections = users.filter(u => u.id !== currentUser?.id).map(u => ({
    id: u.id,
    name: u.name,
    role: u.isOrganizer ? t('Διοργανωτής', 'Organizer') : (u.reliabilityScore > 80 ? t('Εξερευνητής', 'Explorer') : t('Αρχάριος', 'Newbie')),
    mutual: calculateMutualConnections(u.connections),
    location: u.city || 'Downtown',
    image: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`
  }));

  const filteredConnections = searchQuery.trim()
    ? allConnections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allConnections;

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
            <Button variant="outline" className="shrink-0 flex items-center gap-2">
              <Filter className="w-4 h-4" /> {t('Φίλτρα', 'Filter')}
            </Button>
          </div>

          {filteredConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnections.map(conn => (
                <Card key={conn.id} className="p-4 flex items-center justify-between hover:border-cyan-200 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <img referrerPolicy="no-referrer" src={conn.image} alt={conn.name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                    <div>
                      <h3 className="font-bold text-[#111827] text-sm group-hover:text-cyan-600 transition-colors">{conn.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {conn.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="neutral" className="text-[9px] px-1.5 py-0">{conn.role}</Badge>
                        <span className="text-[10px] text-gray-400 font-medium">{conn.mutual} {t('Κοινοί', 'mutuals')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/chat/${conn.id}`)}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"
                      title={t('Μήνυμα', 'Message')}
                      aria-label={t('Μήνυμα', 'Message')}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label={t('Περισσότερες επιλογές', 'More options')}
                      title={t('Περισσότερες επιλογές', 'More options')}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
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
