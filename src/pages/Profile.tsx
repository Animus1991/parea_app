import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton, ProfileSkeleton } from '../components/common/Skeleton';
import { currentUser } from '../data/mockUsers';
import { Shield, ShieldCheck, CheckCircle2, History, Camera, Edit2, X, Plus } from 'lucide-react';
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
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">
</h1>
</div>
</div>
  );
}
