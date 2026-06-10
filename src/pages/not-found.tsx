import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

const ROUTE_SUGGESTIONS: { prefix: string; path: string; labelEl: string; labelEn: string }[] = [
  { prefix: 'cal', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar' },
  { prefix: 'agenda', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar' },
  { prefix: 'chat', path: '/chats', labelEl: 'Μηνύματα', labelEn: 'Messages' },
  { prefix: 'msg', path: '/chats', labelEl: 'Μηνύματα', labelEn: 'Messages' },
  { prefix: 'buddy', path: '/buddy-seek', labelEl: 'Buddy Seek', labelEn: 'Buddy Seek' },
  { prefix: 'plan', path: '/plans', labelEl: 'Πλάνα', labelEn: 'Plans' },
  { prefix: 'near', path: '/nearby', labelEl: 'Κοντά μου', labelEn: 'Nearby' },
  { prefix: 'categ', path: '/categories', labelEl: 'Κατηγορίες', labelEn: 'Categories' },
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
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t('Σφάλμα 404', '404 Page Not Found')}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
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

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 w-full bg-cyan-600 rounded-2xl text-white py-3 px-4 font-semibold hover:bg-cyan-700 transition-colors"
          >
            {t('Πίσω στην Αρχική', 'Back to Home')}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
