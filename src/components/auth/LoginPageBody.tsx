import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { HomeGuestHero } from '../home/HomeGuestHero';
import { LoginGuestHeroStrip } from './LoginGuestHeroStrip';
import { LoginExploreDemoButton } from './LoginExploreDemoButton';
import { tryGoogleSignIn } from '../../lib/loginHandlers';
import { cn } from '../../lib/utils';

export type LoginVariant =
  | 'classic'
  | 'vibrant'
  | 'vibrant-dark'
  | 'neon'
  | 'neon-dark'
  | 'bento'
  | 'bento-dark';

/**
 * Η login σελίδα τρέχει εκτός AppShell (χωρίς data-theme context), οπότε τα
 * semantic tokens δεν ακολουθούν το επιλεγμένο θέμα — κάθε variant ορίζει
 * ρητά τις κλάσεις του (ίδιο πρότυπο με HOME_THEMED_TOKENS).
 */
interface LoginVariantTokens {
  pageBg: string;
  hero: 'full' | 'strip';
  stripDark?: boolean;
  stripAccent?: string;
  cardClass: string;
  wordmarkClass?: string;
  userBtnClass: string;
  avatarBg: string;
  avatarText: string;
  nameHoverClass: string;
  mutedText: string;
  dividerLine: string;
  dividerChip: string;
  googleBtnClass: string;
}

const LIGHT_USER_BTN =
  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white transition-colors shadow-soft text-left group';
const DARK_USER_BTN =
  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-700 bg-gray-800 transition-colors shadow-soft text-left group';

const TOKENS: Record<LoginVariant, LoginVariantTokens> = {
  classic: {
    pageBg: 'bg-[#FDFCFB]',
    hero: 'full',
    cardClass: 'border-gray-100',
    wordmarkClass: 'text-ink',
    userBtnClass: cn(LIGHT_USER_BTN, 'border-gray-100 hover:bg-cyan-50 hover:border-[#a5f3fc]'),
    avatarBg: 'bg-cyan-100',
    avatarText: 'text-cyan-700',
    nameHoverClass: 'group-hover:text-cyan-700',
    mutedText: 'text-gray-500',
    dividerLine: 'border-gray-200',
    dividerChip: 'bg-white text-gray-400',
    googleBtnClass: 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50',
  },
  vibrant: {
    pageBg: 'bg-gradient-to-br from-fuchsia-50 via-white to-orange-50',
    hero: 'strip',
    stripAccent: 'bg-fuchsia-50 text-fuchsia-600',
    cardClass: 'border-fuchsia-100/50',
    wordmarkClass: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-orange-500',
    userBtnClass: cn(LIGHT_USER_BTN, 'border-gray-200 hover:bg-fuchsia-50 hover:border-fuchsia-200'),
    avatarBg: 'bg-fuchsia-100',
    avatarText: 'text-fuchsia-700',
    nameHoverClass: 'group-hover:text-fuchsia-700',
    mutedText: 'text-gray-500',
    dividerLine: 'border-gray-200',
    dividerChip: 'bg-white text-gray-400',
    googleBtnClass: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
  'vibrant-dark': {
    pageBg: 'bg-gradient-to-br from-gray-950 via-fuchsia-950 to-gray-950',
    hero: 'strip',
    stripDark: true,
    stripAccent: 'bg-fuchsia-900/40 text-fuchsia-400',
    cardClass: 'border-gray-800 bg-gray-800/70',
    wordmarkClass: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-orange-400',
    userBtnClass: cn(DARK_USER_BTN, 'hover:bg-fuchsia-900/30 hover:border-fuchsia-800'),
    avatarBg: 'bg-fuchsia-900/50',
    avatarText: 'text-fuchsia-400',
    nameHoverClass: 'group-hover:text-fuchsia-400',
    mutedText: 'text-gray-300',
    dividerLine: 'border-gray-700',
    dividerChip: 'bg-gray-800 text-gray-300',
    googleBtnClass: 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700/60',
  },
  neon: {
    pageBg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
    hero: 'strip',
    stripAccent: 'bg-emerald-50 text-emerald-600',
    cardClass: 'border-emerald-100/50',
    wordmarkClass: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500',
    userBtnClass: cn(LIGHT_USER_BTN, 'border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'),
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-700',
    nameHoverClass: 'group-hover:text-emerald-700',
    mutedText: 'text-gray-500',
    dividerLine: 'border-gray-200',
    dividerChip: 'bg-white text-gray-400',
    googleBtnClass: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
  'neon-dark': {
    pageBg: 'bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950',
    hero: 'strip',
    stripDark: true,
    stripAccent: 'bg-emerald-900/40 text-emerald-400',
    cardClass: 'border-gray-800 bg-gray-800/70',
    wordmarkClass: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400',
    userBtnClass: cn(DARK_USER_BTN, 'hover:bg-emerald-900/30 hover:border-emerald-800'),
    avatarBg: 'bg-emerald-900/50',
    avatarText: 'text-emerald-400',
    nameHoverClass: 'group-hover:text-emerald-400',
    mutedText: 'text-gray-300',
    dividerLine: 'border-gray-700',
    dividerChip: 'bg-gray-800 text-gray-300',
    googleBtnClass: 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700/60',
  },
  bento: {
    pageBg: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50',
    hero: 'strip',
    stripAccent: 'bg-indigo-50 text-indigo-600',
    cardClass: 'border-indigo-100/50',
    wordmarkClass: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600',
    userBtnClass: cn(LIGHT_USER_BTN, 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'),
    avatarBg: 'bg-indigo-100',
    avatarText: 'text-indigo-700',
    nameHoverClass: 'group-hover:text-indigo-700',
    mutedText: 'text-gray-500',
    dividerLine: 'border-gray-200',
    dividerChip: 'bg-white text-gray-400',
    googleBtnClass: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
  'bento-dark': {
    pageBg: 'bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950',
    hero: 'strip',
    stripDark: true,
    stripAccent: 'bg-indigo-900/40 text-indigo-400',
    cardClass: 'border-gray-800 bg-gray-800/70',
    wordmarkClass: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400',
    userBtnClass: cn(DARK_USER_BTN, 'hover:bg-indigo-900/30 hover:border-indigo-800'),
    avatarBg: 'bg-indigo-900/50',
    avatarText: 'text-indigo-400',
    nameHoverClass: 'group-hover:text-indigo-400',
    mutedText: 'text-gray-300',
    dividerLine: 'border-gray-700',
    dividerChip: 'bg-gray-800 text-gray-300',
    googleBtnClass: 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700/60',
  },
};

export default function LoginPageBody({ variant }: { variant: LoginVariant }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const users = useStore((state) => state.users);
  const login = useStore((state) => state.login);
  const tok = TOKENS[variant];

  const handleLogin = (userId: string) => {
    login(userId);
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    const viaFirebase = await tryGoogleSignIn();
    if (!viaFirebase) handleLogin(users[0].id);
  };

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-screen px-4 py-10', tok.pageBg)}>
      {tok.hero === 'full' ? (
        <HomeGuestHero />
      ) : (
        <LoginGuestHeroStrip variant={tok.stripDark ? 'dark' : undefined} accentClass={tok.stripAccent ?? ''} />
      )}
      <Card className={cn('w-full max-w-md p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 shadow-soft-lg', tok.cardClass)}>
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center text-4xl font-black tracking-tight mb-4 font-['Outfit']">
            <span className={tok.wordmarkClass}>NAKAMAS</span>
          </div>
          <h1 className={cn('text-2xl font-bold', tok.stripDark ? 'text-white' : 'text-ink')}>{t('Καλώς ήρθατε', 'Welcome back')}</h1>
          <p className={cn('text-xs font-medium', tok.mutedText)}>
            {t('Συνδεθείτε για να ανακαλύψετε αξιόπιστες ομάδες και εμπειρίες.', 'Log in to discover trusted groups and experiences.')}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <LoginExploreDemoButton />

          <div className={cn('text-center text-xs font-bold tracking-wide mb-4', tok.mutedText)}>
            {t('Επιλέξτε Λογαριασμό (Demo)', 'Select Account (Demo)')}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {users.slice(0, 3).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleLogin(user.id)}
                className={tok.userBtnClass}
              >
                <div className={cn('h-10 w-10 rounded-full overflow-hidden flex-shrink-0', tok.avatarBg)}>
                  {user.photoUrl ? (
                    <img referrerPolicy="no-referrer" src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={cn('w-full h-full flex items-center justify-center font-bold', tok.avatarText)}>
                      {user.name.substring(0, 2)}
                    </div>
                  )}
                </div>
                <div>
                  <div className={cn('text-sm font-bold', tok.stripDark ? 'text-white' : 'text-gray-900', tok.nameHoverClass)}>{user.name}</div>
                  <div className={cn('text-xs', tok.mutedText)}>
                    {user.isOrganizer ? t('Διοργανωτής', 'Organizer') : t('Χρήστης', 'User')} • {user.city}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className={cn('w-full border-t', tok.dividerLine)} />
            </div>
            <div className="relative flex justify-center">
              <span className={cn('px-2 text-xs tracking-wide', tok.dividerChip)}>{t('Ή συνεχίστε με', 'Or continue with')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            className={cn('w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full border text-sm font-bold transition-colors shadow-soft', tok.googleBtnClass)}
          >
            <img referrerPolicy="no-referrer" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            {t('Συνέχεια με Google', 'Continue with Google')}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className={cn('text-xs font-medium leading-relaxed', tok.mutedText)}>
            {t('Συνεχίζοντας, συμφωνείτε με τους Όρους Χρήσης και την Πολιτική Απορρήτου του Nakamas.', "By continuing, you agree to Nakamas's Terms of Service and Privacy Policy.")}
            <br />
            {t('Ίσως απαιτείται επαλήθευση για ορισμένες εκδηλώσεις υψηλής εμπιστοσύνης.', 'Verification may be required for certain high-trust events.')}
          </p>
        </div>
      </Card>
    </div>
  );
}
