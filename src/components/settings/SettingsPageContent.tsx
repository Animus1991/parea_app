import React, { useState } from 'react';
import { Settings, Bell, Lock, Eye, Globe, Shield, CreditCard, LogOut, Trash2, Smartphone, Mail, Download, Laptop, Info, Palette, CheckCircle2, LayoutGrid } from 'lucide-react';
import { HomeHeroModeSetting } from './HomeHeroModeSetting';
import { BuddySeekPrivacySettings } from '../buddySeek/BuddySeekPrivacySettings';
import { ChatPrivacySettingsPanel } from '../chat/ChatPrivacySettingsPanel';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { ThemePicker } from '../common/ThemePicker';
import { THEME_LABELS, type ThemeId } from '../../lib/themes';
import { usePageContrast } from '../../hooks/usePageContrast';
import { toast } from 'sonner';

const CATEGORY_KEYS = ['liveMusic', 'theater', 'hiking', 'cinema', 'boardGames', 'wellness', 'festivals', 'workshops'] as const;

const NOTIF_MAP: Record<string, keyof import('../../store').UserSettings['notificationPrefs']> = {
  pushMessages: 'messages',
  pushReminders: 'reminders',
  pushGroupUpdates: 'matches',
  pushNewEvents: 'matches',
  emailMarketing: 'promos',
  emailUpdates: 'reminders',
};

export default function SettingsPageContent() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);
  const userSettings = useStore((s) => s.userSettings);
  const updateUserSettings = useStore((s) => s.updateUserSettings);
  const currentUser = useStore((s) => s.currentUser);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showHomeLayout, setShowHomeLayout] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const homeHeroMode = useStore((s) => s.homeHeroMode);

  const twoFactorEnabled = userSettings.twoFactorEnabled;

  const notificationPrefs = {
    pushMessages: userSettings.notificationPrefs.messages,
    pushReminders: userSettings.notificationPrefs.reminders,
    pushGroupUpdates: userSettings.notificationPrefs.matches,
    pushNewEvents: userSettings.notificationPrefs.matches,
    emailMarketing: userSettings.notificationPrefs.promos,
    emailUpdates: userSettings.notificationPrefs.reminders,
  };

  const categoryPrefs = Object.fromEntries(
    CATEGORY_KEYS.map((key) => [key, userSettings.categoryPrefs.includes(key)]),
  ) as Record<(typeof CATEGORY_KEYS)[number], boolean>;

  const handleTogglePref = (key: keyof typeof notificationPrefs) => {
    const storeKey = NOTIF_MAP[key];
    updateUserSettings({
      notificationPrefs: {
        ...userSettings.notificationPrefs,
        [storeKey]: !userSettings.notificationPrefs[storeKey],
      },
    });
    toast.success(t('Οι προτιμήσεις αποθηκεύτηκαν', 'Preferences saved'));
  };

  const handleToggleCategory = (key: (typeof CATEGORY_KEYS)[number]) => {
    const next = categoryPrefs[key]
      ? userSettings.categoryPrefs.filter((c) => c !== key)
      : [...userSettings.categoryPrefs, key];
    updateUserSettings({ categoryPrefs: next });
  };

  const toggleAvailability = (slot: string) => {
    const next = userSettings.availability.includes(slot)
      ? userSettings.availability.filter((s) => s !== slot)
      : [...userSettings.availability, slot];
    updateUserSettings({ availability: next });
    toast.success(t('Η διαθεσιμότητα ενημερώθηκε', 'Availability updated'));
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      settings: userSettings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parea-data-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('Η εξαγωγή ξεκίνησε', 'Export started'));
  };

  const handleComingSoon = (label: string) => {
    toast.info(t(`${label} — σύντομα διαθέσιμο`, `${label} — coming soon`));
  };

  const visibilityLabel =
    userSettings.privacy.profileVisibility === 'public'
      ? t('Δημόσιο', 'Public')
      : userSettings.privacy.profileVisibility === 'connections'
        ? t('Συνδέσεις', 'Connections only')
        : t('Ιδιωτικό', 'Private');

  const sections = [
    {
      title: t('Ρυθμίσεις Λογαριασμού', 'Account Settings'),
      items: [
        { icon: Globe, label: t('Γλώσσα', 'Language'), value: language === 'el' ? 'Ελληνικά' : 'English', onClick: () => setLanguage(language === 'el' ? 'en' : 'el') },
        { icon: Palette, label: t('Εμφάνιση & Θέμα', 'Appearance & Theme'), value: language === 'el' ? THEME_LABELS[theme as ThemeId]?.el : THEME_LABELS[theme as ThemeId]?.en, onClick: () => setShowThemePicker(!showThemePicker) },
        { icon: LayoutGrid, label: t('Προβολή αρχικής', 'Home layout'), value: homeHeroMode === 'light' ? t('Σύντομο', 'Compact') : homeHeroMode === 'rich' ? t('Πλήρες', 'Full') : t('Ισορροπημένο', 'Balanced'), onClick: () => setShowHomeLayout(!showHomeLayout) },
        { icon: CreditCard, label: t('Μέθοδοι Πληρωμής', 'Payment Methods'), value: t('1 κάρτα', '1 card'), onClick: () => handleComingSoon(t('Μέθοδοι Πληρωμής', 'Payment Methods')) },
      ],
    },
    {
      title: t('Απόρρητο & Ασφάλεια', 'Privacy & Security'),
      items: [
        { icon: Eye, label: t('Ορατότητα Προφίλ', 'Profile Visibility'), value: visibilityLabel, onClick: () => navigate('/profile') },
        { icon: Shield, label: t('Μπλοκαρισμένοι', 'Blocked Users'), value: t('Κανένας', 'None'), onClick: () => handleComingSoon(t('Μπλοκαρισμένοι', 'Blocked Users')) },
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

      <BuddySeekPrivacySettings />
      <ChatPrivacySettingsPanel />

      {showHomeLayout && (
        <Card className="p-5">
          <h3 className={cn("font-bold text-base mb-1", a.head)}>{t('Προβολή αρχικής', 'Home layout')}</h3>
          <p className={cn("text-xs font-medium mb-4", a.sub)}>
            {t(
              'Επιλέξτε πόσο πλούσιο είναι το hero στην αρχική — ισχύει σε όλα τα θέματα.',
              'Choose how rich the home hero is — applies across all themes.',
            )}
          </p>
          <HomeHeroModeSetting />
        </Card>
      )}

      {/* Theme Picker */}
      {showThemePicker && (
        <Card className="p-5">
          <h3 className={cn("font-bold text-base mb-3", a.head)}>{t('Επιλογή Θέματος', 'Choose Theme')}</h3>
          <p className={cn("text-xs font-medium mb-4", a.sub)}>{t('7 επαγγελματικά θέματα — επιλέξτε αυτό που σας ταιριάζει', '7 polished themes — pick what fits you best')}</p>
          <ThemePicker variant="grid" />
        </Card>
      )}

      {/* 2FA Setup */}
      {show2FASetup && (
        <Card className={cn("p-5 border", a.twofaBg)}>
          <h3 className={cn("font-bold text-base mb-2", a.head)}>{t('Ρύθμιση 2FA', 'Setup 2FA')}</h3>
          <p className={cn("text-sm mb-4", a.sub)}>{t('Προσθέστε ένα επιπλέον επίπεδο ασφάλειας', 'Add an extra layer of security')}</p>
          <Button size="sm" onClick={() => { updateUserSettings({ twoFactorEnabled: true }); setShow2FASetup(false); toast.success(t('Το 2FA ενεργοποιήθηκε', '2FA enabled')); }}>
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
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationPrefs[key as keyof typeof notificationPrefs]}
                    aria-label={label}
                    className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer", notificationPrefs[key as keyof typeof notificationPrefs] ? a.toggleOn : (a.isDark ? 'bg-gray-700' : 'bg-gray-300'))}
                    onClick={() => handleTogglePref(key as keyof typeof notificationPrefs)}
                  >
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", notificationPrefs[key as keyof typeof notificationPrefs] ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
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
                  onClick={() => handleToggleCategory(key as (typeof CATEGORY_KEYS)[number])}
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

      <div>
        <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{t('Διαθεσιμότητα', 'Availability')}</h2>
        <Card className={a.divider}>
          <div
            className={cn("flex items-center justify-between p-4 cursor-pointer transition-colors", a.itemHover)}
            onClick={() => setShowAvailability(!showAvailability)}
          >
            <span className={cn("text-sm font-medium", a.head)}>{t('Πότε είστε διαθέσιμοι', 'When you are available')}</span>
            <Badge variant="neutral">{userSettings.availability.length} {t('χρονοθήκες', 'slots')}</Badge>
          </div>
          {showAvailability && (
            <div className={cn("px-4 pb-4 flex flex-wrap gap-2 border-t pt-4", a.divider)}>
              {[
                { id: 'weekends', label: t('Σαββατοκύριακα', 'Weekends') },
                { id: 'weekday_evenings', label: t('Βράδια καθημερινών', 'Weekday evenings') },
                { id: 'weekday_mornings', label: t('Πρωινά καθημερινών', 'Weekday mornings') },
              ].map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => toggleAvailability(slot.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                    userSettings.availability.includes(slot.id) ? a.catOn : a.catOff,
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

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
              <button
                type="button"
                className="text-[10.5px] font-bold text-red-500 hover:text-red-700"
                onClick={() => toast.success(t('Η συνεδρία τερματίστηκε (demo)', 'Session ended (demo)'))}
              >
                {t('Αποσύνδεση', 'Log out')}
              </button>
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
            <Button variant="outline" size="sm" className="text-xs" onClick={handleExportData}>{t('Λήψη', 'Download')}</Button>
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
        <button
          type="button"
          className={cn("w-full text-sm font-medium transition-colors py-2", a.isDark ? "text-red-500/70 hover:text-red-400" : "text-red-400 hover:text-red-600")}
          onClick={() => setShowDeleteModal(true)}
        >
          {t('Διαγραφή λογαριασμού', 'Delete account')}
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" onClick={() => setShowDeleteModal(false)}>
          <Card className="max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className={cn('font-bold text-lg mb-2', a.head)}>{t('Διαγραφή λογαριασμού;', 'Delete account?')}</h3>
            <p className={cn('text-sm mb-4', a.sub)}>
              {t('Αυτή είναι demo ροή — καμία πραγματική διαγραφή δεν γίνεται.', 'This is a demo flow — no real deletion occurs.')}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>{t('Ακύρωση', 'Cancel')}</Button>
              <Button variant="outline" className="text-red-600 border-red-200" onClick={() => { setShowDeleteModal(false); toast.info(t('Η διαγραφή ακυρώθηκε (demo)', 'Deletion cancelled (demo)')); }}>
                {t('Επιβεβαίωση demo', 'Confirm demo')}
              </Button>
            </div>
          </Card>
        </div>
      )}

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
