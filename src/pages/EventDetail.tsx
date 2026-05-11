import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { mockGroups } from '../data/mockGroups';
import { mockUsers } from '../data/mockUsers';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EventDetailSkeleton } from '../components/common/Skeleton';
import { Calendar, MapPin, Users, ShieldCheck, Clock, Share, Bookmark, CheckCircle, Hash, ExternalLink, QrCode, X, Image as ImageIcon, Star, CloudSun, ThumbsUp, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { el as elLocale } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../lib/i18n';

function GroupCard({ group, event, navigate, t }: { group: any; event: any; navigate: any; t: any; key?: any }) {
  const spotsLeft = group.targetSize - group.members.length;
  const isDiscountEligible = event.groupDiscount && group.targetSize >= event.groupDiscount.minSize;
  const discountUnlocked = event.groupDiscount && group.members.length >= event.groupDiscount.minSize;
  const membersNeededForDiscount = event.groupDiscount ? Math.max(0, event.groupDiscount.minSize - group.members.length) : 0;
  const hostId = group.hostId || group.members[0];
  const groupHost = mockUsers.find((u: any) => u.id === hostId);

  return (
    <div
      className="group relative rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm hover:border-cyan-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
      onClick={() => navigate(`/events/${event.id}/join`)}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      {discountUnlocked && event.groupDiscount && (
        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[11.2px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1 uppercase z-10">
          <CheckCircle className="h-2.5 w-2.5" /> -{event.groupDiscount.percentage}%
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            <Users className="h-3 w-3" />
            {t(`Ομάδα`, `Group`)} #{group.id.replace('g', '')}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-bold text-gray-900">{group.members.length}</span>
            <span className="text-[12.5px] font-medium text-gray-500">/ {group.targetSize} {t(`μέλη`, `members`)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={spotsLeft <= 2 ? 'warning' : 'outline'} className={spotsLeft <= 2 ? 'font-bold text-[11.2px]' : 'text-[11.2px]'}>
            {spotsLeft} {t(`θέσεις`, `spots`)}
          </Badge>
          {groupHost && (
            <div className="flex items-center gap-1.5">
              <img referrerPolicy="no-referrer" src={groupHost.photoUrl} alt={groupHost.name} className="w-5 h-5 rounded-full object-cover border border-gray-200" />
              <span className="text-[11.2px] font-bold text-gray-400 uppercase">Host</span>
            </div>
          )}
        </div>
      </div>

      {isDiscountEligible && !discountUnlocked && (
        <div className="bg-amber-50/80 border border-amber-200/50 p-2 rounded-lg mb-2">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[11.2px] text-amber-800 font-bold uppercase tracking-wider">{t(`Πρόοδος Έκπτωσης`, `Discount Progress`)}</p>
            <span className="text-[11.2px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">-{event.groupDiscount.percentage}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-amber-200/50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(group.members.length / event.groupDiscount.minSize) * 100}%` }} />
            </div>
            <span className="text-[11.2px] font-bold text-amber-700">{membersNeededForDiscount} {t(`ακόμη`, `more`)}</span>
          </div>
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        className="w-full mt-2 text-[12.5px]"
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/events/${event.id}/join`); }}
      >
        {t(`Προβολή & Συμμετοχή`, `View & Join`)}
      </Button>
    </div>
  );
}

export default function EventDetail() {
  const { t } = useLanguage();
  const { eventId: id } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [groupSizeFilter, setGroupSizeFilter] = useState<'All' | '3' | '4' | '5' | '6+'>('All');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [id]);

  const event = mockEvents.find(e => e.id === id);

  let eventGroups = mockGroups
    .filter(g => g.eventId === id)
    .sort((a, b) => {
      const aSpotsLeft = a.targetSize - a.members.length;
      const bSpotsLeft = b.targetSize - b.members.length;
      return aSpotsLeft - bSpotsLeft;
    });

  if (groupSizeFilter !== 'All') {
    if (groupSizeFilter === '6+') {
      eventGroups = eventGroups.filter(g => g.targetSize >= 6);
    } else {
      eventGroups = eventGroups.filter(g => g.targetSize === parseInt(groupSizeFilter));
    }
  }

  const organizer = event ? mockUsers.find(u => u.id === event.organizerId) : null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    try {
      const d = new Date(`${event.date}T${event.time}`);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const toLocalICS = (dt: Date) =>
        `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
      const startDate = toLocalICS(d);
      let addMinutes = 60;
      if (event.duration) {
        let parsedMins = 0;
        const hMatch = event.duration.match(/(\d+)h/);
        const mMatch = event.duration.match(/(\d+)m/);
        if (hMatch) parsedMins += parseInt(hMatch[1]) * 60;
        if (mMatch) parsedMins += parseInt(mMatch[1]);
        if (parsedMins > 0) addMinutes = parsedMins;
      }
      const endD = new Date(d.getTime() + addMinutes * 60000);
      const endDate = toLocalICS(endD);
      const title = event.title || 'Parea Event';
      const description = event.description || '';
      const location = event.locationArea || '';
      const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Parea App//EN', 'BEGIN:VEVENT',
        `DTSTART:${startDate}`, `DTEND:${endDate}`, `SUMMARY:${title}`,
        `DESCRIPTION:${description}`, `LOCATION:${location}`, 'END:VEVENT', 'END:VCALENDAR',
      ].join('\n');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error('Invalid date', e);
    }
  };

  if (isLoading) return <EventDetailSkeleton />;
  if (!event) return (
    <div className="text-center py-16">
      <h2 className="text-[20px] font-bold text-gray-700">{t(`Δεν βρέθηκε η εκδήλωση`, `Event not found`)}</h2>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>{t(`Επιστροφή`, `Go back`)}</Button>
    </div>
  );

  const totalMembers = eventGroups.reduce((acc, g) => acc + g.members.length, 0);
  const spotsLeftEvent = (event.maxParticipants || 100) - totalMembers;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header actions */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="text-[12.5px] font-bold uppercase tracking-wider text-gray-500 hover:text-[#111827]">
          &larr; {t(`Πίσω`, `Back`)}
        </button>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`flex items-center gap-1.5 text-[11.2px] font-bold uppercase tracking-wider transition-colors px-2.5 py-1 rounded-full ${isSaved ? 'text-cyan-800 bg-cyan-100' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
          >
            <Bookmark className={`h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? t(`Αποθηκ.`, `Saved`) : t(`Αποθήκευση`, `Save`)}
          </button>
          <button onClick={() => setShowQRCode(true)} className="flex items-center gap-1.5 text-[11.2px] font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full hover:bg-cyan-100 transition-colors">
            <QrCode className="h-3 w-3" /> QR
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-[11.2px] font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full hover:bg-cyan-100 transition-colors">
            <Share className="h-3 w-3" />
            {isCopied ? t(`Αντιγράφηκε!`, `Copied!`) : t(`Κοινοποίηση`, `Share`)}
          </button>
          <button onClick={handleAddToCalendar} className="flex items-center gap-1.5 text-[11.2px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors">
            <Calendar className="h-3 w-3" />
            {t(`Ημερολόγιο`, `Calendar`)}
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="neutral">{event.category}</Badge>
        {event.isPaid ? <Badge variant="outline">€{event.price}</Badge> : <Badge variant="outline">{t(`Δωρεάν`, `Free`)}</Badge>}
        {event.groupDiscount && (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-0.5" />-{event.groupDiscount.percentage}% {t(`για`, `for`)} {event.groupDiscount.minSize}+
          </Badge>
        )}
        {event.minTrustTierAccess === '3_high_trust' && (
          <Badge variant="outline" className="text-cyan-700 bg-cyan-50 border-cyan-100">
            <ShieldCheck className="h-3 w-3 mr-0.5" />{t(`Επαληθευμένη Πρόσβαση`, `Verified Access`)}
          </Badge>
        )}
      </div>

      <h1 className="text-[25px] md:text-[30px] font-extrabold text-[#111827] leading-tight">{event.title}</h1>

      {/* Urgency & Social Proof */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[11.2px] font-bold text-red-700">{t(`12 κοιτάνε τώρα`, `12 viewing now`)}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
          <div className="flex -space-x-1">
            <img src="https://i.pravatar.cc/16?u=f1" className="w-4 h-4 rounded-full border border-white" alt="" />
            <img src="https://i.pravatar.cc/16?u=f2" className="w-4 h-4 rounded-full border border-white" alt="" />
          </div>
          <span className="text-[11.2px] font-bold text-purple-700">{t(`2 φίλοι ενδιαφέρονται`, `2 friends interested`)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11.2px] font-medium text-gray-400">
          <ThumbsUp className="w-3 h-3" /> 47 {t(`κοινοποιήσεις`, `shares`)}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left — details */}
        <div className="space-y-5 md:col-span-3">
          <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-widest text-[11.2px]">
                  <Calendar className="h-3 w-3" /> {t(`Ημερομηνία`, `Date`)}
                </div>
                <p className="font-medium text-[15px]">{format(parseISO(event.date), 'EEEE, d MMMM yyyy', { locale: elLocale })}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-widest text-[11.2px]">
                  <Clock className="h-3 w-3" /> {t(`Ώρα`, `Time`)}
                </div>
                <p className="font-medium text-[14.85px]">{event.time} ({event.duration})</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-widest text-[11.2px]">
                  <MapPin className="h-3 w-3" /> {t(`Τοποθεσία`, `Location`)}
                </div>
                <p className="font-medium text-[15px]">{event.locationArea}</p>
                <p className="text-[12.5px] text-gray-400">{t(`Ακριβές σημείο μετά την επιβεβαίωση.`, `Exact point revealed upon confirmation.`)}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-widest text-[11.2px]">
                  <ShieldCheck className="h-3 w-3" /> {t(`Κανόνες`, `Rules`)}
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-[15px] capitalize">{event.minTrustTierAccess?.split('_')[1] || 'basic'}</p>
                  <Link to="/trust" className="text-[12.5px] text-cyan-600 font-bold underline">{t(`Γιατί;`, `Why?`)}</Link>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-[12.5px] font-bold text-[#111827] mb-1.5 uppercase tracking-widest">{t(`Σχετικά με την εμπειρία`, `About the experience`)}</h3>
              <p className="text-[15px] text-gray-600 leading-relaxed font-medium">{event.description}</p>
              {event.externalLink && (
                <a href={event.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-[12.5px] font-bold uppercase tracking-wider rounded-lg">
                  <ExternalLink className="w-3 h-3" /> {t(`Επίσημη Σελίδα`, `Official Page`)}
                </a>
              )}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  {event.tags.map((tag: string) => (
                    <Badge key={tag} variant="neutral" className="bg-gray-100 text-gray-600 text-[12.5px] cursor-pointer hover:bg-gray-200" onClick={() => navigate(`/?search=${tag}`)}>
                      <Hash className="h-3 w-3 mr-0.5 text-gray-400" />{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer */}
            {organizer && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-[12.5px] font-bold text-[#111827] mb-2 uppercase tracking-widest">{t(`Διοργανωτής`, `Organizer`)}</h3>
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-cyan-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <img referrerPolicy="no-referrer" src={organizer.photoUrl || `https://i.pravatar.cc/150?u=${organizer.id}`} alt={organizer.name} className="w-10 h-10 rounded-full object-cover border-2 border-white ring-2 ring-gray-100" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link to="/profile" className="text-[15px] font-bold text-[#111827] hover:text-cyan-600 transition-colors">{organizer.name}</Link>
                        <Badge variant="outline" className="text-[10px] py-0 px-1 shadow-none bg-green-50 text-green-700 border-green-200">
                          {organizer.reliabilityScore}%
                        </Badge>
                      </div>
                      <p className="text-[12.5px] text-gray-500 font-medium">{organizer.bio || t(`Επαληθευμένος Διοργανωτής`, `Verified Organizer`)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="hidden sm:flex text-[11.2px]" onClick={() => navigate('/profile')}>
                    {t(`Προφίλ`, `Profile`)}
                  </Button>
                </div>
              </div>
            )}

            {/* Hiking/outdoor details */}
            {(event.category === 'Hiking' || event.category === 'Nearby escapes') && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-[12.5px] font-bold text-[#111827] mb-2 uppercase tracking-widest">{t(`Λεπτομέρειες Περιπέτειας`, `Adventure Details`)}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
                    <div className="text-[11.2px] uppercase font-bold text-emerald-700 mb-0.5 tracking-wider">{t(`Δυσκολία`, `Difficulty`)}</div>
                    <div className="text-[13.8px] font-bold text-gray-900">{event.category === 'Hiking' ? t(`Μέτρια`, `Moderate`) : t(`Εύκολη`, `Easy`)}</div>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                    <div className="text-[11.2px] uppercase font-bold text-amber-700 mb-0.5 tracking-wider">{t(`Εξοπλισμός`, `Equipment`)}</div>
                    <div className="text-[13.8px] font-bold text-gray-900">{event.category === 'Hiking' ? t(`Ορειβατικά παπούτσια`, `Hiking boots`) : t(`Κοινά έξοδα`, `Shared expenses`)}</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Why reliable */}
          <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <h3 className="text-[12.5px] font-bold text-[#111827] mb-2.5 uppercase tracking-widest">{t(`Γιατί αυτή η ομάδα είναι αξιόπιστη`, `Why this group is reliable`)}</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2 text-[13.8px]">
                <Users className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">{t(`Μικρές ομάδες.`, `Small groups.`)}</strong> {t(`Μέγιστο`, `Max`)} {event.maxParticipants || '3-6'} {t(`άτομα για καλύτερο συντονισμό.`, `people for better coordination.`)}</span>
              </li>
              <li className="flex items-start gap-2 text-[13.8px]">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">{t(`Επιβεβαιωμένη συμμετοχή.`, `Confirmed participation.`)}</strong> {t(`Οι αθετήσεις παρακολουθούνται.`, `No-shows are tracked.`)}</span>
              </li>
              <li className="flex items-start gap-2 text-[13.8px]">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">{t(`Δημόσιο σημείο.`, `Public point.`)}</strong> {t(`Αποκαλύπτεται μόνο μετά την επιβεβαίωση.`, `Revealed only after confirmation.`)}</span>
              </li>
              <li className="flex items-start gap-2 text-[13.8px]">
                <CheckCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">{t(`Ιδιωτικές αναφορές.`, `Private reports.`)}</strong> {t(`Επηρεάζουν τη βαθμολογία αξιοπιστίας.`, `Affect reliability scores.`)}</span>
              </li>
            </ul>
          </section>

          {/* Photo Gallery */}
          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12.5px] font-bold text-[#111827] uppercase tracking-widest">{t(`Φωτογραφίες Συμμετεχόντων`, `Participant Photos`)}</h3>
              <button className="text-[11.2px] font-bold text-cyan-600 hover:text-cyan-700">{t(`+ Ανέβασμα`, `+ Upload`)}</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={`https://picsum.photos/seed/gallery${event.id}${i}/200/200`} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                </div>
              ))}
            </div>
            <p className="text-[11.2px] text-gray-400 font-medium mt-2 text-center">{t(`Οι φωτογραφίες είναι ορατές μόνο στα μέλη της ομάδας`, `Photos are visible only to group members`)}</p>
          </section>

          {/* Event Reviews */}
          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12.5px] font-bold text-[#111827] uppercase tracking-widest">{t(`Αξιολογήσεις`, `Reviews`)}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[15px] font-bold text-[#111827]">4.7</span>
                <span className="text-[11.2px] text-gray-400 font-medium">(23)</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Maria K.', rating: 5, text: t(`Εξαιρετική εμπειρία! Η ομάδα ήταν φανταστική.`, `Amazing experience! The group was fantastic.`), time: t(`Πριν 2 εβδομάδες`, `2 weeks ago`) },
                { name: 'Nikos P.', rating: 4, text: t(`Πολύ καλή οργάνωση. Θα ξαναπήγαινα!`, `Very well organized. Would go again!`), time: t(`Πριν 1 μήνα`, `1 month ago`) },
              ].map((review, i) => (
                <div key={i} className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13.8px] font-bold text-[#111827]">{review.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, s) => <Star key={s} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />)}
                    </div>
                  </div>
                  <p className="text-[13.8px] text-gray-600 leading-relaxed">{review.text}</p>
                  <span className="text-[11.2px] text-gray-400 font-medium mt-1 block">{review.time}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Weather Widget */}
          <section className="rounded-xl border border-gray-100 bg-gradient-to-br from-sky-50 to-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CloudSun className="w-4 h-4 text-sky-600" />
              <h3 className="text-[12.5px] font-bold text-[#111827] uppercase tracking-widest">{t(`Πρόβλεψη Καιρού`, `Weather Forecast`)}</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[30px] font-black text-[#111827]">24°C</p>
                <p className="text-[12.5px] text-gray-600 font-medium">{t(`Αίθριος, ασθενής άνεμος`, `Clear skies, light breeze`)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11.2px] text-gray-500 font-medium">{format(parseISO(event.date), 'EEEE', { locale: elLocale })}</p>
                <p className="text-[11.2px] text-gray-500 font-medium">{t(`Ιδανικό για εξωτερική δραστηριότητα`, `Ideal for outdoor activity`)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right — groups & actions */}
        <div className="space-y-4 md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:sticky md:top-20">
            <h3 className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t(`Διαθέσιμες Ομάδες`, `Available Groups`)}</h3>

            <div className="mb-3 bg-cyan-50 border border-cyan-100 rounded-lg p-2.5 flex justify-between items-center text-[13.8px] font-bold text-cyan-900">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t(`Χωρητικότητα`, `Capacity`)}</span>
              <span>{Math.max(0, spotsLeftEvent)} {t(`θέσεις`, `spots`)}</span>
            </div>

            {/* Smart match suggestion */}
            <div className="mb-3 bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3 h-3 text-purple-600" />
                <span className="text-[11.2px] font-bold text-purple-700 uppercase tracking-wider">{t(`Προτεινόμενη Ομάδα`, `Suggested Match`)}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex -space-x-1.5">
                  <img src="https://i.pravatar.cc/24?u=sm1" className="w-5 h-5 rounded-full border border-white" alt="" />
                  <img src="https://i.pravatar.cc/24?u=sm2" className="w-5 h-5 rounded-full border border-white" alt="" />
                  <img src="https://i.pravatar.cc/24?u=sm3" className="w-5 h-5 rounded-full border border-white" alt="" />
                </div>
                <span className="text-[12.5px] text-gray-600 font-medium">{t(`3 συμβατά μέλη βρέθηκαν`, `3 compatible members found`)}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                <span className="text-[10px] bg-white/80 border border-gray-200 px-1.5 py-0.5 rounded font-medium text-gray-600">{t(`Κοινά ενδιαφέροντα`, `Shared interests`)}</span>
                <span className="text-[10px] bg-white/80 border border-gray-200 px-1.5 py-0.5 rounded font-medium text-gray-600">{t(`Ίδια ηλικιακή ομάδα`, `Same age group`)}</span>
              </div>
            </div>

            <Button className="w-full mb-3" size="sm" onClick={() => navigate(`/events/${id}/join`)}>
              <Users className="w-3.5 h-3.5 mr-1.5" /> {t(`Δημιουργία Νέας Ομάδας`, `Create New Group`)}
            </Button>

            {eventGroups.length > 0 && (
              <div className="flex gap-1.5 mb-3 items-center">
                <span className="text-[11.2px] font-bold uppercase text-gray-400">{t(`Φίλτρο`, `Filter`)}:</span>
                <select
                  value={groupSizeFilter}
                  onChange={(e) => setGroupSizeFilter(e.target.value as any)}
                  className="text-[12.5px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-medium focus:outline-none"
                >
                  <option value="All">{t(`Οποιοδήποτε`, `Any Size`)}</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6+">6+</option>
                </select>
              </div>
            )}

            {eventGroups.length === 0 ? (
              <div className="text-[13.8px] text-gray-500 bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200 font-medium">
                {t(`Δεν υπάρχουν ομάδες ακόμη. Δημιουργήστε πρώτοι!`, `No groups yet. Be the first to start one!`)}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                {eventGroups.map(group => (
                  <GroupCard key={group.id} group={group} event={event} navigate={navigate} t={t} />
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button variant="outline" className="w-full text-[12.5px]" size="sm" onClick={() => alert(t(`Προστέθηκε σε λίστα αναμονής`, `Added to waitlist`))}>
                {t(`Λίστα Αναμονής`, `Join Waitlist`)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden z-50 flex gap-2">
        <Button variant="outline" className="flex-1 text-[12.5px]" onClick={() => navigate(`/events/${id}/join`)}>
          {t(`Αναμονή`, `Waitlist`)}
        </Button>
        <Button className="flex-[2] text-[12.5px]" onClick={() => navigate(`/events/${id}/join`)}>
          {t(`Δημιουργία Ομάδας`, `Create Group`)}
        </Button>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowQRCode(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQRCode(false)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-[19.8px] font-bold text-gray-900 mb-1">{t(`Κοινοποίηση Εκδήλωσης`, `Share Event`)}</h3>
            <p className="text-[13.8px] text-gray-500 mb-4">{t(`Σκανάρετε τον κωδικό QR`, `Scan this QR code`)}</p>
            <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-100 inline-block">
              <QRCodeSVG value={window.location.href} size={180} bgColor="#ffffff" fgColor="#111827" level="H" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
