import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Clock, Calendar, Users, Target, Lock, Globe, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useLanguage } from "../lib/i18n";

export default function CreateEventFlow() {
    const { t } = useLanguage();
    
  const [step, setStep] = useState(1);
  const totalSteps = 4;

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

  return (
    <div className="max-w-full mx-auto pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">
</h1>
</div>
</div>
  );
}
