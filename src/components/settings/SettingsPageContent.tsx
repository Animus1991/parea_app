import React, { useState } from 'react';
import { Settings, Bell, Lock, Eye, Globe, Shield, CreditCard, LogOut, Trash2, Smartphone, Mail, Download, Laptop, Info, Palette, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { ThemePicker } from '../common/ThemePicker';
import { THEME_LABELS, type ThemeId } from '../../lib/themes';
import { usePageContrast } from '../../hooks/usePageContrast';

export default function SettingsPageContent() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

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
        { icon: Palette, label: t('Εμφάνιση & Θέμα', 'Appearance & Theme'), value: language === 'el' ? THEME_LABELS[theme as ThemeId]?.el : THEME_LABELS[theme as ThemeId]?.en, onClick: () => setShowThemePicker(!showThemePicker) },
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
          <p className={cn("text-xs font-medium mb-4", a.sub)}>{t('9 επαγγελματικά θέματα — επιλέξτε αυτό που σας ταιριάζει', '9 polished themes — pick what fits you best')}</p>
          <ThemePicker variant="grid" />
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
