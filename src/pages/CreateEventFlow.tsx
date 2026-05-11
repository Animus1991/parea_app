import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Clock, Calendar, Users, Target, Lock, Globe, CheckCircle, Image as ImageIcon, X, Sparkles, DollarSign, Lightbulb } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useLanguage } from "../lib/i18n";

export default function CreateEventFlow() {
    const { t } = useLanguage();
    
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [showAITip, setShowAITip] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  const mockLocationSuggestions = [
    'Syntagma Square, Athens',
    'Monastiraki Flea Market, Athens',
    'Technopolis City of Athens',
    'Stavros Niarchos Foundation Cultural Center',
    'OAKA Olympic Stadium',
    'National Garden, Athens'
  ];
  const [mapCenter, setMapCenter] = useState({ lat: 37.9838, lng: 23.7275 }); // Athens default

  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [capacity, setCapacity] = useState('4');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category) newErrors.category = 'Category is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'Date is required';
    if (!time) newErrors.time = 'Time is required';
    if (!duration) newErrors.duration = 'Duration is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = true;
    if (step === 1) isValid = validateStep1();
    if (step === 2) isValid = validateStep2();
    // Step 3 is typically always valid due to defaults

    if (isValid) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      setErrors({});
    }
  };

  const categories = ['Theatre', 'Concerts', 'Cinema', 'Stand-up', 'Hiking', 'Board games', 'Workshops', 'Festivals', 'City walks'];

  return (
    <div className="max-w-full mx-auto pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[25px] md:text-[30px] font-bold text-[#111827]">{t(`Δημιουργία Εμπειρίας`, `Create Experience`)}</h1>
        <p className="text-gray-500 font-medium text-[15px] md:text-[18px] mt-1">{t(`Βήμα`, `Step`)} {step} / {totalSteps}</p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-cyan-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Τίτλος`, `Title`)}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder={t(`π.χ. Πεζοπορία στον Υμηττό`, `e.g. Hike on Hymettus`)} />
            {errors.title && <span className="text-red-500 text-[12.5px] font-bold">{errors.title}</span>}
          </div>
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Κατηγορία`, `Category`)}</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-[15px] font-bold border ${category === c ? 'bg-[#111827] text-white border-transparent' : 'border-gray-200 text-gray-600'}`}>{c}</button>
              ))}
            </div>
            {errors.category && <span className="text-red-500 text-[12.5px] font-bold">{errors.category}</span>}
          </div>
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Περιγραφή`, `Description`)}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" placeholder={t(`Περιγράψτε την εμπειρία...`, `Describe the experience...`)} />
            {errors.description && <span className="text-red-500 text-[12.5px] font-bold">{errors.description}</span>}
          </div>
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Εικόνα`, `Image`)}</label>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="mt-1.5 flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-[18px] text-gray-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors w-full justify-center">
              <ImageIcon className="w-4 h-4" /> {image ? t(`Αλλαγή εικόνας`, `Change image`) : t(`Προσθήκη εικόνας`, `Add image`)}
            </button>
            {image && <img src={image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />}
          </div>
        </Card>
      )}

      {/* Step 2: Date, Time, Location */}
      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Ημερομηνία`, `Date`)}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              {errors.date && <span className="text-red-500 text-[12.5px] font-bold">{errors.date}</span>}
            </div>
            <div>
              <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Ώρα`, `Time`)}</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              {errors.time && <span className="text-red-500 text-[12.5px] font-bold">{errors.time}</span>}
            </div>
          </div>
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Διάρκεια`, `Duration`)}</label>
            <input value={duration} onChange={e => setDuration(e.target.value)} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder={t(`π.χ. 2 ώρες`, `e.g. 2 hours`)} />
            {errors.duration && <span className="text-red-500 text-[12.5px] font-bold">{errors.duration}</span>}
          </div>
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Τοποθεσία`, `Location`)}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={location} onChange={e => { setLocation(e.target.value); setShowLocationSuggestions(true); }} onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)} className="w-full mt-1.5 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder={t(`Αναζήτηση τοποθεσίας...`, `Search location...`)} />
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {mockLocationSuggestions.filter(s => s.toLowerCase().includes(location.toLowerCase())).map(s => (
                    <button key={s} onClick={() => { setLocation(s); setShowLocationSuggestions(false); }} className="w-full text-left px-4 py-2 text-[18px] hover:bg-gray-50">{s}</button>
                  ))}
                </div>
              )}
            </div>
            {errors.location && <span className="text-red-500 text-[12.5px] font-bold">{errors.location}</span>}
          </div>

          {/* Map preview */}
          {location && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
            <div className="rounded-xl overflow-hidden h-36 border border-gray-200">
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <Map defaultCenter={mapCenter} defaultZoom={14} gestureHandling="greedy" disableDefaultUI={true} mapId="create-event-map" className="w-full h-full">
                  <AdvancedMarker position={mapCenter}>
                    <div className="w-5 h-5 bg-cyan-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Visibility & Capacity */}
      {step === 3 && (
        <Card className="p-6 space-y-5">
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Ορατότητα`, `Visibility`)}</label>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setVisibility('public')} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-[18px] font-medium ${visibility === 'public' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600'}`}>
                <Globe className="w-4 h-4" /> {t(`Δημόσια`, `Public`)}
              </button>
              <button onClick={() => setVisibility('private')} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-[18px] font-medium ${visibility === 'private' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600'}`}>
                <Lock className="w-4 h-4" /> {t(`Ιδιωτική`, `Private`)}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Μέγεθος ομάδας`, `Group size`)}</label>
            <div className="flex items-center gap-3 mt-2">
              <Users className="w-4 h-4 text-gray-400" />
              <input type="range" min="2" max="20" value={capacity} onChange={e => setCapacity(e.target.value)} className="flex-1 accent-cyan-600" />
              <span className="text-[18px] font-bold text-[#111827] w-8 text-center">{capacity}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Pricing */}
      {step === 4 && (
        <Card className="p-6 space-y-5">
          <div>
            <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Τιμολόγηση`, `Pricing`)}</label>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setIsPaid(false)} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-[18px] font-medium ${!isPaid ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600'}`}>
                {t(`Δωρεάν`, `Free`)}
              </button>
              <button onClick={() => setIsPaid(true)} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-[18px] font-medium ${isPaid ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600'}`}>
                <DollarSign className="w-4 h-4" /> {t(`Επί πληρωμή`, `Paid`)}
              </button>
            </div>
          </div>
          {isPaid && (
            <div>
              <label className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">{t(`Τιμή (€)`, `Price (€)`)}</label>
              <input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-[18px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="10.00" />
              <p className="text-[11.2px] text-gray-400 font-medium mt-1">{t(`Η πλατφόρμα κρατά 5% προμήθεια`, `Platform takes 5% commission`)}</p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-amber-800 font-medium">{t(`Συμβουλή: Οι δωρεάν εκδηλώσεις γεμίζουν 3× πιο γρήγορα.`, `Tip: Free events fill up 3× faster.`)}</p>
          </div>
        </Card>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-[23px] text-[#111827] flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-600" />{t(`Επισκόπηση`, `Review`)}</h2>
          <div className="space-y-2 text-[18px]">
            <p><span className="font-bold text-gray-500">{t(`Τίτλος`, `Title`)}:</span> {title || '-'}</p>
            <p><span className="font-bold text-gray-500">{t(`Κατηγορία`, `Category`)}:</span> {category || '-'}</p>
            <p><span className="font-bold text-gray-500">{t(`Ημερομηνία`, `Date`)}:</span> {date || '-'} {time}</p>
            <p><span className="font-bold text-gray-500">{t(`Τοποθεσία`, `Location`)}:</span> {location || '-'}</p>
            <p><span className="font-bold text-gray-500">{t(`Μέγεθος`, `Size`)}:</span> {capacity} {t(`άτομα`, `people`)}</p>
            <p><span className="font-bold text-gray-500">{t(`Ορατότητα`, `Visibility`)}:</span> {visibility === 'public' ? t(`Δημόσια`, `Public`) : t(`Ιδιωτική`, `Private`)}</p>
            <p><span className="font-bold text-gray-500">{t(`Τιμή`, `Price`)}:</span> {isPaid ? `€${price || '0'}` : t(`Δωρεάν`, `Free`)}</p>
          </div>
        </Card>
      )}

      {/* AI description tip */}
      {step === 1 && showAITip && (
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12.5px] font-bold text-purple-800">{t(`AI Βοηθός`, `AI Helper`)}</p>
            <p className="text-[11.2px] text-purple-700 mt-0.5">{t(`Γράψτε 2-3 λέξεις και θα σας προτείνουμε περιγραφή!`, `Type 2-3 keywords and we'll suggest a description!`)}</p>
          </div>
          <button onClick={() => setShowAITip(false)} className="text-purple-400 hover:text-purple-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(prev => prev - 1)}>
            {t(`Πίσω`, `Back`)}
          </Button>
        )}
        <Button className="flex-1" onClick={step === totalSteps ? () => { /* submit */ } : handleNext}>
          {step === totalSteps ? t(`Δημοσίευση`, `Publish`) : t(`Επόμενο`, `Next`)}
        </Button>
      </div>
    </div>
  );
}
