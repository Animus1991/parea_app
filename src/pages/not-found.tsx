import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../lib/i18n";
import { Button } from "../components/common/Button";
import { APP_TYPO } from "../lib/typographyTokens";
import { cn } from "../lib/utils";

const ROUTE_SUGGESTIONS: { prefix: string; path: string; labelEl: string; labelEn: string }[] = [
  { prefix: 'cal', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar' },
  { prefix: 'agenda', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar' },
  { prefix: 'chat', path: '/chats', labelEl: 'Μηνύματα', labelEn: 'Messages' },
  { prefix: 'msg', path: '/chats', labelEl: 'Μηνύματα', labelEn: 'Messages' },
  { prefix: 'buddy', path: '/buddy-seek', labelEl: 'Buddy Seek', labelEn: 'Buddy Seek' },
  { prefix: 'plan', path: '/plans', labelEl: 'Πλάνα', labelEn: 'Plans' },
  { prefix: 'near', path: '/nearby', labelEl: 'Κοντά μου', labelEn: 'Nearby' },
  { prefix: 'categ', path: '/categories', labelEl: 'Κατηγορίες', labelEn: 'Categories' },
  { prefix: 'tag', path: '/tags', labelEl: 'Ετικέτες', labelEn: 'Tags' },
  { prefix: 'set', path: '/settings', labelEl: 'Ρυθμίσεις', labelEn: 'Settings' },
];

function fuzzySuggestion(pathname: string) {
  const slug = pathname.replace(/^\//, '').toLowerCase();
  if (!slug || slug.length < 2) return null;
  return ROUTE_SUGGESTIONS.find((r) => slug.startsWith(r.prefix) || r.prefix.startsWith(slug.slice(0, 3)));
}

export default function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const suggestion = fuzzySuggestion(pathname);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-4">
          <div className="flex mb-3 gap-2 items-center">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" aria-hidden />
            <h1 className={cn(APP_TYPO.pageTitle, 'text-gray-900')}>{t('Σφάλμα 404', '404 Page Not Found')}</h1>
          </div>

          <p className={cn(APP_TYPO.pageSub, 'mt-3 text-gray-600')}>
            {t('Η σελίδα δεν βρέθηκε. Ελέγξτε τη διεύθυνση URL ή επιστρέψτε στην αρχική σελίδα.', 'The page was not found. Please check the URL or return to the home page.')}
          </p>

          {suggestion && (
            <p className="mt-4 text-sm text-gray-700">
              {t('Μήπως εννοούσατε', 'Did you mean')}{' '}
              <Link to={suggestion.path} className="font-semibold text-cyan-700 hover:underline">
                {t(suggestion.labelEl, suggestion.labelEn)}
              </Link>
              ?
            </p>
          )}

          <Button type="button" className="mt-4 w-full" onClick={() => navigate('/')}>
            {t('Πίσω στην Αρχική', 'Back to Home')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
