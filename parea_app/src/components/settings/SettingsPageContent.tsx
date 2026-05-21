import React, { useState } from 'react';
import { Settings, Bell, Lock, Eye, Globe, Shield, CreditCard, LogOut, Trash2, Smartphone, Mail, Download, Laptop, Info, Palette, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

function useAccent() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  const base = {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-600',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    sectionHead: isDark ? 'text-gray-500' : 'text-gray-400',
    itemHover: isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50',
    divider: isDark ? 'divide-gray-700/40' : 'divide-gray-100',
    borderT: isDark ? 'border-gray-700/40' : 'border-gray-100',
    inputBg: isDark ? 'bg-gray-800/50 border-gray-700/50 text-white' : 'bg-white border-gray-200',
  };

  if (theme === 'vibrant' || theme === 'vibrant-dark') return {
    ...base,
    toggleOn: 'bg-fuchsia-600',
    link: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    catOn: isDark ? 'bg-fuchsia-900/30 border-fuchsia-700 text-fuchsia-400' : 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700',
    catOff: isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500',
    twofaBg: isDark ? 'border-fuchsia-800/40 bg-fuchsia-900/10' : 'border-fuchsia-200 bg-fuchsia-50/30',
    sessionBadge: isDark ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-600 bg-emerald-50',
    iconColor: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
  };
  if (theme === 'neon' || theme === 'neon-dark' || theme === 'bento-dark') return {
    ...base,
    toggleOn: 'bg-emerald-600',
    link: isDark ? 'text-emerald-400' : 'text-emerald-600',
    catOn: isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700',
    catOff: isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500',
    twofaBg: isDark ? 'border-emerald-800/40 bg-emerald-900/10' : 'border-emerald-200 bg-emerald-50/30',
    sessionBadge: isDark ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-600 bg-emerald-50',
    iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
  };
  if (theme === 'bento') return {
    ...base,
    toggleOn: 'bg-indigo-600',
    link: 'text-indigo-600',
    catOn: 'bg-indigo-50 border-indigo-300 text-indigo-700',
    catOff: 'bg-white border-gray-200 text-gray-500',
    twofaBg: 'border-indigo-200 bg-indigo-50/30',
    sessionBadge: 'text-emerald-600 bg-emerald-50',
    iconColor: 'text-indigo-600',
  };
  // Classic
  return {
    ...base,
    toggleOn: 'bg-cyan-600',
    link: 'text-cyan-600',
    catOn: 'bg-cyan-50 border-cyan-300 text-cyan-700',
    catOff: 'bg-white border-gray-200 text-gray-500',
    twofaBg: 'border-cyan-200 bg-cyan-50/30',
    sessionBadge: 'text-emerald-600 bg-emerald-50',
    iconColor: 'text-cyan-600',
  };
}

const THEMES = [
  { id: 'classic' as const, label: 'Classic', color: 'bg-cyan-500' },
  { id: 'vibrant' as const, label: 'Vibrant', color: 'bg-fuchsia-500' },
  { id: 'vibrant-dark' as const, label: 'Vibrant Dark', color: 'bg-fuchsia-700' },
  { id: 'neon' as const, label: 'Neon', color: 'bg-emerald-500' },
  { id: 'neon-dark' as const, label: 'Neon Dark', color: 'bg-emerald-700' },
  { id: 'bento' as const, label: 'Bento', color: 'bg-indigo-500' },
  { id: 'bento-dark' as const, label: 'Bento Dark', color: 'bg-indigo-700' },
];

export default function SettingsPageContent() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const a = useAccent();

  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState({
    pushMessages: true,
    pushReminders: true,
    pushGroupUpdates: true,
    pushNewEvents: true,
    emailMarketing: false,
    emailUpdates: true,
  });

  const [categoryPrefs, setCategoryPrefs] = useState({
    liveMusic: true,
    theater: true,
    hiking: true,
    cinema: false,
    boardGames: true,
    wellness: false,
    festivals: true,
    workshops: false,
  });

  const handleTogglePref = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: t('Ρυθμίσεις Λογαριασμού', 'Account Settings'),
      items: [
        { icon: Globe, label: t('Γλώσσα', 'Language'), value: language === 'el' ? 'Ελληνικά' : 'English', onClick: () => setLanguage(language === 'el' ? 'en' : 'el') },
        { icon: Palette, label: t('Θέμα', 'Theme'), value: THEMES.find(th => th.id === theme)?.label || 'Classic', onClick: () => setShowThemePicker(!showThemePicker) },
        { icon: CreditCard, label: t('Μέθοδοι Πληρωμής', 'Payment Methods'), value: t('1 κάρτα', '1 card') },
      ],
    },
    {
      title: t('Απόρρητο & Ασφάλεια', 'Privacy & Security'),
      items: [
        { icon: Eye, label: t('Ορατότητα Προφίλ', 'Profile Visibility'), value: t('Δημόσιο', 'Public') },
        { icon: Shield, label: t('Μπλοκαρισμένοι', 'Blocked Users'), value: t('Κανένας', 'None') },
        { icon: Lock, label: t('2FA', '2FA'), value: twoFactorEnabled ? t('Ενεργό', 'Active') : t('Ανενεργό', 'Inactive'), onClick: () => setShow2FASetup(!show2FASetup) },
      ],
    },
    {
      title: t('Ειδοποιήσεις', 'Notifications'),
      items: [
        { icon: Bell, label: t('Προτιμήσεις Ειδοποιήσεων', 'Notification Preferences'), value: t('Προσαρμοσμένες', 'Custom'), onClick: () => setShowNotifications(!showNotifications) },
      ],
    },
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="mb-2">
        <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Ρυθμίσεις & Απόρρητο', 'Settings & Privacy')}</h1>
        <p className={cn("font-medium text-sm mt-1", a.sub)}>{t('Διαχειριστείτε τον λογαριασμό σας', 'Manage your account')}</p>
      </div>

      {sections.map((section, idx) => (
        <div key={idx}>
          <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{section.title}</h2>
          <Card className={a.divider}>
            <div className={cn("divide-y", a.divider)}>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} onClick={item.onClick} className={cn("flex items-center justify-between p-4 transition-colors", item.onClick ? cn("cursor-pointer", a.itemHover) : '')}>
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", a.muted)} />
                      <span className={cn("text-sm font-medium", a.head)}>{item.label}</span>
                    </div>
                    <span className={cn("text-[13px] font-medium", a.sub)}>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ))}

      {/* Theme Picker */}
      {showThemePicker && (
        <Card className="p-5">
          <h3 className={cn("font-bold text-base mb-3", a.head)}>{t('Επιλογή Θέματος', 'Choose Theme')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEMES.map(th => (
              <button
                key={th.id}
                onClick={() => { setTheme(th.id); setShowThemePicker(false); }}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all",
                  theme === th.id
                    ? cn(a.isDark ? "border-white/30 bg-white/5" : "border-gray-900/20 bg-gray-50", a.head)
                    : cn(a.isDark ? "border-gray-700/40 hover:border-gray-600" : "border-gray-200 hover:border-gray-300", a.sub)
                )}
              >
                <span className={cn("w-4 h-4 rounded-full shrink-0", th.color)} />
                {th.label}
                {theme === th.id && <CheckCircle2 className={cn("w-3.5 h-3.5 ml-auto", a.link)} />}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* 2FA Setup */}
      {show2FASetup && (
        <Card className={cn("p-5 border", a.twofaBg)}>
          <h3 className={cn("font-bold text-base mb-2", a.head)}>{t('Ρύθμιση 2FA', 'Setup 2FA')}</h3>
          <p className={cn("text-sm mb-4", a.sub)}>{t('Προσθέστε ένα επιπλέον επίπεδο ασφάλειας', 'Add an extra layer of security')}</p>
          <Button size="sm" onClick={() => { setTwoFactorEnabled(true); setShow2FASetup(false); }}>
            {t('Ενεργοποίηση', 'Enable')}
          </Button>
        </Card>
      )}

      {/* Notifications Prefs */}
      {showNotifications && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className={cn("font-bold text-base mb-4", a.head)}>{t('Γενικές Ειδοποιήσεις', 'General Notifications')}</h3>
            <div className="space-y-3">
              {[
                { key: 'pushMessages', label: t('Μηνύματα ομάδας', 'Group messages') },
                { key: 'pushReminders', label: t('Υπενθυμίσεις', 'Event reminders') },
                { key: 'pushGroupUpdates', label: t('Ενημερώσεις ομάδας', 'Group updates') },
                { key: 'pushNewEvents', label: t('Νέες εκδηλώσεις', 'New events nearby') },
                { key: 'emailMarketing', label: t('Email προωθητικά', 'Promotional emails') },
                { key: 'emailUpdates', label: t('Email ενημερώσεις', 'Email updates') },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", a.sub)}>{label}</span>
                  <div
                    className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer", notificationPrefs[key as keyof typeof notificationPrefs] ? a.toggleOn : (a.isDark ? 'bg-gray-700' : 'bg-gray-300'))}
                    onClick={() => handleTogglePref(key as keyof typeof notificationPrefs)}
                  >
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", notificationPrefs[key as keyof typeof notificationPrefs] ? 'translate-x-4' : 'translate-x-0.5')} />
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className={cn("font-bold text-base mb-1", a.head)}>{t('Κατηγορίες', 'Categories')}</h3>
            <p className={cn("text-xs mb-4", a.muted)}>{t('Ειδοποίηση μόνο για αυτές τις κατηγορίες', 'Get notified for these categories only')}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'liveMusic', label: t('Μουσική', 'Live Music') },
                { key: 'theater', label: t('Θέατρο', 'Theater') },
                { key: 'hiking', label: t('Πεζοπορία', 'Hiking') },
                { key: 'cinema', label: t('Σινεμά', 'Cinema') },
                { key: 'boardGames', label: t('Επιτραπέζια', 'Board Games') },
                { key: 'wellness', label: t('Ευεξία', 'Wellness') },
                { key: 'festivals', label: t('Φεστιβάλ', 'Festivals') },
                { key: 'workshops', label: t('Εργαστήρια', 'Workshops') },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCategoryPrefs(prev => ({ ...prev, [key]: !prev[key as keyof typeof categoryPrefs] }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    categoryPrefs[key as keyof typeof categoryPrefs] ? a.catOn : a.catOff
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Active Sessions */}
      <div>
        <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{t('Ενεργές Συνεδρίες', 'Active Sessions')}</h2>
        <Card>
          <div className={cn("divide-y", a.divider)}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Smartphone className={cn("w-4 h-4", a.iconColor)} />
                <div>
                  <span className={cn("text-sm font-medium", a.head)}>iPhone 15 Pro</span>
                  <p className={cn("text-xs font-medium", a.muted)}>Athens, GR • {t('Τώρα', 'Now')}</p>
                </div>
              </div>
              <span className={cn("text-[10.5px] font-bold px-2 py-0.5 rounded-full", a.sessionBadge)}>{t('Τρέχουσα', 'Current')}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Laptop className={cn("w-4 h-4", a.muted)} />
                <div>
                  <span className={cn("text-sm font-medium", a.head)}>Chrome • Windows</span>
                  <p className={cn("text-xs font-medium", a.muted)}>Athens, GR • 2h {t('πριν', 'ago')}</p>
                </div>
              </div>
              <button className="text-[10.5px] font-bold text-red-500 hover:text-red-700">{t('Αποσύνδεση', 'Log out')}</button>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Export */}
      <div>
        <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{t('Δεδομένα', 'Data')}</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className={cn("w-4 h-4", a.muted)} />
              <div>
                <span className={cn("text-sm font-medium", a.head)}>{t('Εξαγωγή δεδομένων', 'Export your data')}</span>
                <p className={cn("text-xs font-medium", a.muted)}>{t('Κατεβάστε αντίγραφο', 'Download a copy of your data')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs">{t('Λήψη', 'Download')}</Button>
          </div>
        </Card>
      </div>

      {/* Logout / Delete */}
      <div className="pt-4 space-y-3">
        <Button
          variant="outline"
          className={cn("w-full", a.isDark ? "text-red-400 border-red-800/40 hover:bg-red-900/10" : "text-red-600 border-red-200 hover:bg-red-50")}
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut className="w-4 h-4 mr-2" /> {t('Αποσύνδεση', 'Log out')}
        </Button>
        <button className={cn("w-full text-sm font-medium transition-colors py-2", a.isDark ? "text-red-500/70 hover:text-red-400" : "text-red-400 hover:text-red-600")}>
          {t('Διαγραφή λογαριασμού', 'Delete account')}
        </button>
      </div>

      {/* Version */}
      <div className="text-center pt-2 pb-4">
        <div className={cn("flex items-center justify-center gap-1 text-xs font-medium", a.isDark ? "text-gray-600" : "text-gray-300")}>
          <Info className="w-3 h-3" />
          <span>Parea v1.2.0 • Build 2024.10</span>
        </div>
      </div>
    </div>
  );
}
