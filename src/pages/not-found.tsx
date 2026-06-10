import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t('Σφάλμα 404', '404 Page Not Found')}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t('Η σελίδα δεν βρέθηκε. Ελέγξτε τη διεύθυνση URL ή επιστρέψτε στην αρχική σελίδα.', 'The page was not found. Please check the URL or return to the home page.')}
          </p>

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
