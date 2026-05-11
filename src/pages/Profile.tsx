import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton, ProfileSkeleton } from '../components/common/Skeleton';
import { currentUser } from '../data/mockUsers';
import { Shield, ShieldCheck, CheckCircle2, History, Camera, Edit2, X, Plus, Calendar, Users, Star, Flame, TrendingUp, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../lib/i18n";

export default function Profile() {
    const { t } = useLanguage();
    
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('Passionate about finding cool local events and meeting new people.');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(bio);

  const [interests, setInterests] = useState(currentUser.interests);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Create a temporary object URL to simulate immediate upload feedback
      const newUrl = URL.createObjectURL(e.target.files[0]);
      setPhotoUrl(newUrl);
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-full px-4 py-8"><ProfileSkeleton /></div>;
  }

  return (
    <div className="w-full space-y-8 pb-20 md:pb-12">
      <div>
        <h1 className="text-[20.104264919475px] md:text-[26.7902365993px] font-bold tracking-tight text-[#111827]">{t(`Το Προφίλ μου`, `My Profile`)}</h1>
        <p className="text-gray-500 font-medium text-[13.551608211075px] md:text-[16.25212883329px] mt-1">{t(`Διαχειριστείτε τις πληροφορίες σας`, `Manage your information`)}</p>
      </div>

      {/* Avatar & Name */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src={photoUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover border-4 border-gray-100" />
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-1.5 bg-cyan-600 text-white rounded-full shadow-sm hover:bg-cyan-700 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div>
            <h2 className="text-[20.731614957278874px] font-bold text-[#111827]">{currentUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success" className="text-[12.1125px]"><ShieldCheck className="w-3 h-3 mr-0.5" />{currentUser.trustTier}</Badge>
              <span className="text-[12.1125px] text-gray-500 font-medium">{t(`Αξιοπιστία`, `Reliability`)}: {currentUser.reliabilityScore}%</span>
            </div>
            <p className="text-[13.5px] text-gray-500 mt-1">{currentUser.city} • {currentUser.ageRange}</p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Calendar className="w-4 h-4 mx-auto text-cyan-600 mb-1" />
          <p className="text-[23px] font-black text-[#111827]">12</p>
          <p className="text-[12.1125px] text-gray-500 font-medium uppercase tracking-wider">{t(`Εκδηλώσεις`, `Events`)}</p>
        </Card>
        <Card className="p-4 text-center">
          <Users className="w-4 h-4 mx-auto text-cyan-600 mb-1" />
          <p className="text-[23px] font-black text-[#111827]">5</p>
          <p className="text-[12.1125px] text-gray-500 font-medium uppercase tracking-wider">{t(`Ομάδες`, `Groups`)}</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <p className="text-[23px] font-black text-[#111827]">4.8</p>
          <p className="text-[12.1125px] text-gray-500 font-medium uppercase tracking-wider">{t(`Βαθμολογία`, `Rating`)}</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto text-green-600 mb-1" />
          <p className="text-[23px] font-black text-[#111827]">98%</p>
          <p className="text-[12.1125px] text-gray-500 font-medium uppercase tracking-wider">{t(`Αξιοπιστία`, `Reliability`)}</p>
        </Card>
      </div>

      {/* Activity Streak */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[14.535px] font-bold text-[#111827]">{t(`Σερί 3 εβδομάδων!`, `3-week streak!`)}</p>
              <p className="text-[11.2px] text-gray-500 font-medium">{t(`Συμμετέχετε κάθε εβδομάδα`, `You've been active every week`)}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[true, true, true, false, false, false, false].map((active, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${active ? 'bg-orange-400' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-[12.1125px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />{t(`Πρόσφατη Δραστηριότητα`, `Recent Activity`)}
        </h3>
        <div className="space-y-3">
          {[
            { icon: Users, text: t(`Ενταχθήκατε σε ομάδα για "Release Athens"`, `Joined a group for "Release Athens"`), time: t(`Πριν 2 ώρες`, `2 hours ago`) },
            { icon: Star, text: t(`Αξιολογήσατε το "Comedy Night" με 5/5`, `Rated "Comedy Night" 5/5`), time: t(`Χθες`, `Yesterday`) },
            { icon: MapPin, text: t(`Συμμετείχατε στην "Πεζοπορία Υμηττός"`, `Attended "Hymettus Hike"`), time: t(`Πριν 3 μέρες`, `3 days ago`) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <item.icon className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.8px] font-medium text-[#111827] truncate">{item.text}</p>
                <span className="text-[11.2px] text-gray-400 font-medium">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bio */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16.2px] font-bold text-[#111827]">{t(`Σχετικά`, `About`)}</h3>
          {!isEditingBio && (
            <button onClick={() => { setIsEditingBio(true); setTempBio(bio); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {isEditingBio ? (
          <div className="space-y-2">
            <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[16.2px] focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setBio(tempBio); setIsEditingBio(false); }}>{t(`Αποθήκευση`, `Save`)}</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditingBio(false)}>{t(`Ακύρωση`, `Cancel`)}</Button>
            </div>
          </div>
        ) : (
          <p className="text-[16.2px] text-gray-600 leading-relaxed">{bio}</p>
        )}
      </Card>

      {/* Interests */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16.2px] font-bold text-[#111827]">{t(`Ενδιαφέροντα`, `Interests`)}</h3>
          <button onClick={() => setIsAddingInterest(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {interests.map(interest => (
            <Badge key={interest} variant="neutral" className="px-3 py-1">
              {interest}
              <button onClick={() => setInterests(interests.filter(i => i !== interest))} className="ml-1.5 text-gray-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        {isAddingInterest && (
          <div className="flex gap-2 mt-3">
            <input value={newInterest} onChange={e => setNewInterest(e.target.value)} placeholder={t(`Νέο ενδιαφέρον...`, `New interest...`)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-[16.2px] focus:outline-none focus:ring-2 focus:ring-cyan-500" onKeyDown={e => { if (e.key === 'Enter' && newInterest.trim()) { setInterests([...interests, newInterest.trim()]); setNewInterest(''); setIsAddingInterest(false); } }} />
            <Button size="sm" onClick={() => { if (newInterest.trim()) { setInterests([...interests, newInterest.trim()]); setNewInterest(''); setIsAddingInterest(false); } }}>{t(`Προσθήκη`, `Add`)}</Button>
          </div>
        )}
      </Card>

      {/* Identity Tiers */}
      <Card className="p-6">
        <h3 className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t(`Επίπεδα Ταυτότητας`, `Identity Tiers`)}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[13.8px] font-bold text-[#111827]">{t(`Tier 1: Explorer`, `Tier 1: Explorer`)}</p>
              <p className="text-[11.2px] text-gray-500 font-medium">{t(`Email/τηλέφωνο επαληθεύτηκε. Δωρεάν δημόσιες εκδηλώσεις.`, `Email/phone verified. Public free events.`)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="border border-emerald-200 bg-emerald-50/50 p-2 rounded-lg flex-1">
              <p className="text-[13.8px] font-bold text-emerald-800">{t(`Tier 2: Confirmed`, `Tier 2: Confirmed`)}</p>
              <p className="text-[11.2px] text-emerald-600/80 font-medium">{t(`Μέθοδος πληρωμής ή αγορά εισιτηρίου. Πρόσβαση σε ομαδικές εκδηλώσεις.`, `Payment method or ticket purchase. Access to group events.`)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[13.8px] font-bold text-gray-700">{t(`Tier 3: High Trust`, `Tier 3: High Trust`)}</p>
              <p className="text-[11.2px] text-gray-500 font-medium">{t(`Ταυτότητα/selfie + θετικό σκορ. Ιδιωτικές εκδηλώσεις & πεζοπορίες.`, `ID/selfie verified + positive score. Private events & hikes.`)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Group Preferences */}
      <Card className="p-6">
        <h3 className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t(`Προτιμήσεις Ομάδας`, `Group Preferences`)}</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border border-cyan-200 bg-cyan-50/30 rounded-xl cursor-pointer">
            <input type="radio" name="groupsize" defaultChecked className="mt-0.5 h-4 w-4 text-cyan-600 rounded-full" />
            <div>
              <span className="text-[13.8px] font-bold text-[#111827] block">{t(`Ομάδες (3-5 άτομα)`, `Groups (3-5 people)`)}</span>
              <span className="text-[11.2px] text-gray-500 font-medium block mt-0.5">{t(`Προτείνεται. Μικρές ομάδες για ασφάλεια.`, `Recommended. Small groups for safety.`)}</span>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer opacity-60">
            <input type="radio" name="groupsize" disabled className="mt-0.5 h-4 w-4 text-gray-400 rounded-full" />
            <div>
              <span className="text-[13.8px] font-bold text-gray-700 block">{t(`1-σε-1 Εμπειρίες`, `1-on-1 Experiences`)}</span>
              <span className="text-[11.2px] text-gray-500 font-medium">{t(`Απαιτεί Tier 3`, `Requires Tier 3`)}</span>
            </div>
          </label>
        </div>
      </Card>

      {/* Visibility */}
      <Card className="p-6">
        <h3 className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t(`Ορατότητα & Συνδέσεις`, `Visibility & Connections`)}</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 text-cyan-600 rounded border-gray-300" />
            <span className="text-[13.8px] text-gray-700 font-medium">{t(`Αποκάλυψη φωτογραφίας 2ω πριν`, `Reveal photo 2h before event`)}</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 text-cyan-600 rounded border-gray-300" />
            <span className="text-[13.8px] text-gray-700 font-medium">{t(`Αιτήματα "Κράτα επαφή" μετά`, `Allow "Keep in touch" requests after`)}</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4 text-cyan-600 rounded border-gray-300" />
            <span className="text-[13.8px] text-gray-700 font-medium">{t(`Μηνύματα διοργανωτών μετά`, `Allow organizer messages after event`)}</span>
          </label>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 cursor-pointer hover:border-cyan-200 transition-colors" onClick={() => navigate('/trust')}>
          <Shield className="w-5 h-5 text-cyan-600 mb-2" />
          <h4 className="text-[13.5px] font-bold text-[#111827]">{t(`Κέντρο Εμπιστοσύνης`, `Trust Center`)}</h4>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-cyan-200 transition-colors" onClick={() => navigate('/history')}>
          <History className="w-5 h-5 text-cyan-600 mb-2" />
          <h4 className="text-[13.5px] font-bold text-[#111827]">{t(`Ιστορικό`, `History`)}</h4>
        </Card>
      </div>

      {/* Sign Out */}
      <div className="flex justify-center pb-4">
        <Button onClick={() => navigate('/login')} variant="ghost" className="text-gray-400 hover:text-red-600 font-bold uppercase tracking-wider text-[12.5px]">
          {t(`Αποσύνδεση`, `Sign Out`)}
        </Button>
      </div>
    </div>
  );
}
