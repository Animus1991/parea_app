import React, { useState } from 'react';
import { Settings, Bell, Lock, Eye, Globe, Shield, CreditCard, LogOut, Trash2, Smartphone, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useLanguage } from '../lib/i18n';

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
      title: t('Ρυθμίσεις Λογαριασμού', 'Account Settings'),
      items: [
        { icon: Globe, label: t('Γλώσσα & Δημογραφικά', 'Language & Region'), value: t('Ελληνικά (GR)', 'English (US)') },
        { icon: CreditCard, label: t('Μέθοδοι Πληρωμής', 'Payment Methods'), value: t('1 κάρτα', '1 saved card') },
      ]
    },
    {
      title: t('Απόρρητο & Ορατότητα', 'Privacy & Visibility'),
      items: [
        { icon: Eye, label: t('Ορατότητα Προφίλ', 'Profile Visibility'), value: t('Δημόσιο', 'Public') },
        { icon: Shield, label: t('Αποκλεισμένοι', 'Blocked Users'), value: t('Κανένας', 'None') },
        { icon: Lock, label: t('Επαλήθευση Δύο Βημάτων', 'Two-Factor Authentication'), value: twoFactorEnabled ? t('Ενεργό', 'On') : t('Ανενεργό', 'Off'), onClick: () => setShow2FASetup(!show2FASetup) },
      ]
    },
    {
      title: t('Ειδοποιήσεις', 'Notifications'),
      items: [
        { icon: Bell, label: t('Προτιμήσεις Ειδοποιήσεων', 'Notification Preferences'), value: t('Προσαρμοσμένο', 'Custom'), onClick: () => setShowNotifications(!showNotifications) },
      ]
    }
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-[#111827]">{t('Ρυθμίσεις & Απόρρητο', 'Settings & Privacy')}</h1>
        <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">{t('Διαχειριστείτε τις προτιμήσεις του λογαριασμού και τα δεδομένα σας.', 'Manage your account preferences and data.')}</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{section.title}</h2>
            <Card className="divide-y divide-gray-100 overflow-hidden">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx}>
                  <div 
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-[#111827]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {item.value}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${item.onClick && (item.label === t('Επαλήθευση Δύο Βημάτων', 'Two-Factor Authentication') && show2FASetup || item.label === t('Προτιμήσεις Ειδοποιήσεων', 'Notification Preferences') && showNotifications) ? 'rotate-90' : 'group-hover:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Expandable 2FA Section */}
                  {item.label === t('Επαλήθευση Δύο Βημάτων', 'Two-Factor Authentication') && show2FASetup && (
                    <div className="p-5 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2">
                      {!twoFactorEnabled ? (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">{t('Προστατέψτε το λογαριασμό σας χρησιμοποιώντας εφαρμογή ταυτοποίησης ή SMS.', 'Protect your account using an authenticator app or SMS text messages.')}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Card className="p-4 border-indigo-100 hover:border-indigo-300 cursor-pointer" onClick={() => setTwoFactorEnabled(true)}>
                              <Smartphone className="w-6 h-6 text-indigo-600 mb-2" />
                              <h4 className="font-bold text-sm text-gray-900 mb-1">{t('Εφαρμογή Ταυτοποίησης', 'Authenticator App')}</h4>
                              <p className="text-xs text-gray-500">{t('Χρησιμοποιήστε εφαρμογές όπως Google Authenticator ή Authy (Προτείνεται).', 'Use apps like Google Authenticator or Authy (Recommended).')}</p>
                            </Card>
                            <Card className="p-4 border-gray-200 hover:border-gray-300 cursor-pointer" onClick={() => setTwoFactorEnabled(true)}>
                              <MessageSquare className="w-6 h-6 text-gray-600 mb-2" />
                              <h4 className="font-bold text-sm text-gray-900 mb-1">{t('Μήνυμα SMS', 'Text Message (SMS)')}</h4>
                              <p className="text-xs text-gray-500">{t('Λάβετε κωδικό μέσω SMS στο επιβεβαιωμένο κινητό σας.', 'Receive a code via SMS to your verified phone number.')}</p>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-sm text-emerald-900 tracking-tight">{t('Η Επαλήθευση Δύο Βημάτων είναι ενεργή', 'Two-Factor Authentication is On')}</h4>
                              <p className="text-xs text-emerald-700 mt-0.5">{t('Ο λογαριασμός σας είναι ασφαλής. Θα ζητάμε κωδικό από νέες συσκευές.', 'Your account is secured. We\'ll ask for a code when you sign in from unrecognized devices.')}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setTwoFactorEnabled(false)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                            {t('Απενεργοποίηση 2FA', 'Disable 2FA')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Notifications Section */}
                  {item.label === t('Προτιμήσεις Ειδοποιήσεων', 'Notification Preferences') && showNotifications && (
                    <div className="p-5 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 space-y-6">
                      
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Bell className="w-3.5 h-3.5" /> {t('Ειδοποιήσεις Συσκευής', 'Push Notifications')}</h4>
                        <div className="space-y-3 pl-1">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">{t('Προσωπικά μηνύματα & Ομάδες', 'Direct Messages & Group Chats')}</span>
                            <input type="checkbox" checked={notificationPrefs.pushMessages} onChange={() => handleTogglePref('pushMessages')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600" />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">{t('Ειδοποιήσεις & Υπενθυμίσεις Εκδηλώσεων', 'Event Reminders & Updates')}</span>
                            <input type="checkbox" checked={notificationPrefs.pushReminders} onChange={() => handleTogglePref('pushReminders')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600" />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {t('Ειδοποιήσεις Email', 'Email Notifications')}</h4>
                        <div className="space-y-3 pl-1">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">{t('Σημαντικές ενημερώσεις λογαριασμού', 'Important Account Updates')}</span>
                            <input type="checkbox" checked={notificationPrefs.emailUpdates} onChange={() => handleTogglePref('emailUpdates')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600" />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">{t('Προσφορές & Νέα', 'Marketing & Promotional')}</span>
                            <input type="checkbox" checked={notificationPrefs.emailMarketing} onChange={() => handleTogglePref('emailMarketing')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600" />
                          </label>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </Card>
          </div>
        ))}

        <div className="pt-6">
          <Card className="divide-y divide-gray-100 border-rose-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer text-rose-600 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">{t('Αποσύνδεση', 'Log Out')}</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer text-rose-600 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">{t('Διαγραφή Λογαριασμού', 'Delete Account')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
