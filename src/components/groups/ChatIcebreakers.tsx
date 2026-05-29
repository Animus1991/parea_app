import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { generateGroupIcebreakers, isGeminiConfigured } from '../../services/gemini';
import { toast } from 'sonner';

interface ChatIcebreakersProps {
  eventTitle: string;
  interests: string[];
  onSuggest: (text: string) => void;
}

export function ChatIcebreakers({ eventTitle, interests, onSuggest }: ChatIcebreakersProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!isGeminiConfigured()) {
      const fallbacks =
        language === 'el'
          ? [
              'Ποια είναι η αγαπημένη σας στιγμή από παρόμοιες εκδηλώσεις;',
              'Τι σας έφερε εδώ σήμερα;',
              'Έχετε ξαναπάει σε κάτι παρόμοιο;',
            ]
          : [
              'What is your favorite moment from similar events?',
              'What brought you here today?',
              'Have you been to something like this before?',
            ];
      const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      onSuggest(pick);
      toast.message(t('Πρόταση icebreaker (τοπική)', 'Icebreaker suggestion (offline)'));
      return;
    }

    setLoading(true);
    const ideas = await generateGroupIcebreakers(eventTitle, interests, language);
    setLoading(false);
    if (ideas?.[0]) {
      onSuggest(ideas[0]);
      toast.success(t('Νέα πρόταση από AI', 'New AI suggestion'));
    } else {
      toast.error(t('Δεν ήταν δυνατή η δημιουργία. Δοκιμάστε ξανά.', 'Could not generate. Try again.'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-gray-400 hover:text-[#0E8B8D] hover:bg-cyan-50 rounded-full transition-colors p-2 min-h-11 min-w-11 flex items-center justify-center disabled:opacity-50"
      title={t('Πρόταση icebreaker (AI)', 'AI icebreaker suggestion')}
      aria-label={t('Πρόταση icebreaker', 'Icebreaker suggestion')}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
    </button>
  );
}
