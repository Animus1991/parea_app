import React, { useState } from 'react';
import { Settings, Bell, Lock, Eye, Globe, Shield, CreditCard, LogOut, Trash2, Smartphone, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useLanguage } from "../lib/i18n";

export default function SettingsAndPrivacy() {
    const { t } = useLanguage();
    
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    pushMessages: true,
    pushReminders: true,
    emailMarketing: false,
    emailUpdates: true
  });

  const handleTogglePref = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: t(`Ρυθμίσεις Λογαριασμού`, `Account Settings`),
      items: [
        { icon: Globe, label: t(`Γλώσσα & Περιοχή`, `Language & Region`), value: t(`Ελληνικά (GR)`, `Greek (GR)`) },
        { icon: CreditCard, label: t(`Μέθοδοι Πληρωμής`, `Payment Methods`), value: t(`1 αποθηκευμένη κάρτα`, `1 saved card`) },
      ]
    },
    {
      title: t(`Απόρρητο & Ορατότητα`, `Privacy & Visibility`),
      items: [
        { icon: Eye, label: t(`Ορατότητα Προφίλ`, `Profile Visibility`), value: t(`Δημόσιο`, `Public`) },
        { icon: Shield, label: t(`Μπλοκαρισμένοι Χρήστες`, `Blocked Users`), value: t(`Κανένας`, `None`) },
        { icon: Lock, label: t(`Έλεγχος Ταυτότητας 2 Παραγόντων`, `Two-Factor Authentication`), value: twoFactorEnabled ? t(`Ενεργό`, `Active`) : t(`Ανενεργό`, `Inactive`), onClick: () => setShow2FASetup(!show2FASetup) },
      ]
    },
    {
      title: t(`Ειδοποιήσεις`, `Notifications`),
      items: [
        { icon: Bell, label: t(`Προτιμήσεις Ειδοποιήσεων`, `Notification Preferences`), value: t(`Προσαρμοσμένες`, `Custom`), onClick: () => setShowNotifications(!showNotifications) },
      ]
    }
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-[#111827]">
</h1>
</div>
</div>
  );
}
