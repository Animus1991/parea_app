import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { HomeGuestHero } from '../home/HomeGuestHero';
import { LoginGuestHeroStrip } from './LoginGuestHeroStrip';
import { LoginExploreDemoButton } from './LoginExploreDemoButton';
import { appEnv } from '../../lib/config/env';
import { isProductionGoogleOAuthAvailable, tryGoogleSignIn } from '../../lib/loginHandlers';
import { cn } from '../../lib/utils';

export type LoginVariant =
  | 'classic'
  | 'vibrant'
  | 'vibrant-dark'
  | 'neon'
  | 'neon-dark'
  | 'bento'
  | 'bento-dark'
  | 'activebuddies'
  | 'activebuddies-dark';

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
    dividerChip: 'bg-white text-gray-600',
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
    dividerChip: 'bg-white text-gray-600',
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
    dividerChip: 'bg-white text-gray-600',
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
    dividerChip: 'bg-white text-gray-600',
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
  activebuddies: {
    pageBg: 'bg-[hsl(0_0%_99%)]',
    hero: 'strip',
    stripAccent: 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)]',
    cardClass: 'border-[hsl(220_13%_92%)] bg-white',
    wordmarkClass: 'text-[hsl(220_14%_12%)]',
    userBtnClass: cn(LIGHT_USER_BTN, 'border-[hsl(220_13%_92%)] hover:bg-[hsl(220_14%_96%)]'),
    avatarBg: 'bg-[hsl(220_14%_96%)]',
    avatarText: 'text-[hsl(220_14%_12%)]',
    nameHoverClass: 'group-hover:text-black',
    mutedText: 'text-[hsl(220_9%_40%)]',
    dividerLine: 'border-[hsl(220_13%_92%)]',
    dividerChip: 'bg-white text-[hsl(220_9%_40%)]',
    googleBtnClass: 'border-[hsl(220_13%_92%)] bg-white text-[hsl(220_14%_12%)] hover:bg-[hsl(220_14%_96%)]',
  },
  'activebuddies-dark': {
    pageBg: 'bg-[hsl(220_16%_8%)]',
    hero: 'strip',
    stripDark: true,
    stripAccent: 'bg-[hsl(220_16%_18%)] text-[hsl(210_20%_92%)]',
    cardClass: 'border-[hsl(220_13%_18%)] bg-[hsl(220_16%_11%)]',
    wordmarkClass: 'text-[hsl(210_20%_92%)]',
    userBtnClass: cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-[hsl(220_13%_18%)] bg-[hsl(220_16%_14%)] transition-colors shadow-soft text-left group hover:bg-[hsl(220_16%_18%)]',
    ),
    avatarBg: 'bg-[hsl(220_16%_18%)]',
    avatarText: 'text-[hsl(210_20%_92%)]',
    nameHoverClass: 'group-hover:text-white',
    mutedText: 'text-[hsl(220_12%_70%)]',
    dividerLine: 'border-[hsl(220_13%_18%)]',
    dividerChip: 'bg-[hsl(220_16%_11%)] text-[hsl(220_12%_70%)]',
    googleBtnClass:
      'border-[hsl(220_13%_18%)] bg-[hsl(220_16%_14%)] text-[hsl(210_20%_92%)] hover:bg-[hsl(220_16%_18%)]',
  },
};

export default function LoginPageBody({ variant }: { variant: LoginVariant }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const users = useStore((state) => state.users);
  const login = useStore((state) => state.login);
  const loginWithUser = useStore((state) => state.loginWithUser);
  const tok = TOKENS[variant];

  const handleLogin = (userId: string) => {
    login(userId);
    navigate('/');
  };

  const googleOAuthReady = isProductionGoogleOAuthAvailable();
  const demoLogin = appEnv.demoLogin;

  const handleGoogleLogin = async () => {
    const result = await tryGoogleSignIn();
    if (result.ok) {
      if (result.via === 'google_identity') {
        loginWithUser(result.user);
        navigate('/');
      }
      // Firebase path: useFirebaseAuth bridge updates the store.
      return;
    }
    if (!demoLogin) {
      // Real sign-in only: never fall back to a demo identity.
      toast.error(t('Η σύνδεση με Google απέτυχε. Δοκιμάστε ξανά.', 'Google sign-in failed. Please try again.'));
      return;
    }
    toast.info(
      t(
        'Google OAuth μη διαθέσιμο — σύνδεση demo λογαριασμού',
        'Google OAuth unavailable — signing in with demo account',
      ),
    );
    handleLogin(users[0].id);
  };

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-screen px-4 py-5', tok.pageBg)}>
      {tok.hero === 'full' ? (
        <HomeGuestHero />
      ) : (
        <LoginGuestHeroStrip variant={tok.stripDark ? 'dark' : undefined} accentClass={tok.stripAccent ?? ''} />
      )}
      <Card className={cn('w-full max-w-md p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 shadow-soft-lg', tok.cardClass)}>
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center text-sm md:text-base font-black tracking-tight mb-4 font-['Outfit']">
            <span className={tok.wordmarkClass}>NAKAMAS</span>
          </div>
          <h1 className={cn('text-sm md:text-base font-bold', tok.stripDark ? 'text-white' : 'text-ink')}>{t('Καλώς ήρθατε', 'Welcome back')}</h1>
          <p className={cn('text-xs font-medium', tok.mutedText)}>
            {t('Συνδεθείτε για να ανακαλύψετε αξιόπιστες ομάδες και εμπειρίες.', 'Log in to discover trusted groups and experiences.')}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          {demoLogin && (
            <>
          <LoginExploreDemoButton />

          <div className={cn('text-center text-xs font-bold tracking-wide mb-4', tok.mutedText)}>
            {t('Επιλέξτε Λογαριασμό (Demo)', 'Select Account (Demo)')}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {/* Three member accounts plus one seeded moderator, so Admin stays demo-able
                now that hosting no longer grants admin rights. */}
            {[...users.slice(0, 3), ...users.filter((u) => u.isAdmin).slice(0, 1)].map((user) => (
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
                    {user.isAdmin ? t('Συντονιστής', 'Moderator') : user.isOrganizer ? t('Διοργανωτής', 'Organizer') : t('Χρήστης', 'User')} • {user.city}
                  </div>
                </div>
              </button>
            ))}
          </div>

            </>
          )}

          {demoLogin && (
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className={cn('w-full border-t', tok.dividerLine)} />
            </div>
            <div className="relative flex justify-center">
              <span className={cn('px-2 text-xs tracking-wide', tok.dividerChip)}>{t('Ή συνεχίστε με', 'Or continue with')}</span>
            </div>
          </div>
          )}

          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            className={cn('w-full flex items-center justify-center gap-3 px-4 py-3 min-h-11 rounded-full border text-sm font-bold transition-colors shadow-soft', tok.googleBtnClass)}
          >
            <img referrerPolicy="no-referrer" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" aria-hidden />
            {googleOAuthReady
              ? t('Συνέχεια με Google', 'Continue with Google')
              : t('Συνέχεια με Google (Demo)', 'Continue with Google (Demo)')}
          </button>
        </div>

        <div className="text-center mt-4">
          <p className={cn('text-xs font-medium leading-relaxed', tok.mutedText)}>
            {t('Συνεχίζοντας, συμφωνείτε με τους', 'By continuing, you agree to Nakamas')}{' '}
            <Link to="/help" className="underline font-semibold hover:opacity-80">
              {t('Όρους Χρήσης', 'Terms of Service')}
            </Link>
            {' '}{t('και την', 'and')}{' '}
            <Link to="/help" className="underline font-semibold hover:opacity-80">
              {t('Πολιτική Απορρήτου', 'Privacy Policy')}
            </Link>
            .
            <br />
            {t('Ίσως απαιτείται επαλήθευση για ορισμένες εκδηλώσεις υψηλής εμπιστοσύνης.', 'Verification may be required for certain high-trust events.')}
          </p>
        </div>
      </Card>
    </div>
  );
}
