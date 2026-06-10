import { useParams, useNavigate } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../../store";
import { useLanguage } from "../../lib/i18n";
import { useThemeStyles } from "../../hooks/useThemeStyles";

/**
 * Prominent banner shown on the EventDetail page when a platform-curated event
 * still has no group host. Lets any member step up as the group's organizer.
 * Self-contained (reads the route param + store) so a single mount covers all
 * theme variants of the detail page. Renders nothing when not applicable.
 */
export function PlatformEventBanner() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const becomeEventHost = useStore((s) => s.becomeEventHost);
  const tok = useThemeStyles();

  const event = events.find((e) => e.id === eventId);
  if (!event) return null;

  const seeksHost =
    !!event.isPlatformEvent &&
    !groups.find((g) => g.eventId === event.id && g.hostId);
  if (!seeksHost) return null;

  const handleBecomeHost = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    becomeEventHost(event.id);
    toast.success(
      t("Έγινες ο διοργανωτής της ομάδας! 🎉", "You're now the group's organizer! 🎉"),
    );
  };

  return (
    <div
      className={`mb-6 rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-4 ${
        tok.isDark
          ? "bg-amber-950/25 border-amber-800/40"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h3
            className={`text-[15px] font-bold ${
              tok.isDark ? "text-amber-100" : "text-amber-900"
            }`}
          >
            {t("Προτεινόμενη εκδήλωση από το Nakamas", "Curated by Nakamas")}
          </h3>
          <p
            className={`text-[12.5px] font-medium mt-0.5 leading-relaxed ${
              tok.isDark ? "text-amber-200/80" : "text-amber-800"
            }`}
          >
            {t(
              "Αυτή η εκδήλωση δεν έχει ακόμη διοργανωτή. Γίνε εσύ ο διοργανωτής της παρέας και ξεκίνα να συγκεντρώνεις κόσμο!",
              "This event has no organizer yet. Step up as the group organizer and start gathering people!",
            )}
          </p>
        </div>
      </div>
      <button
        onClick={handleBecomeHost}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-2xl px-4 py-2.5 text-[13px] transition-colors shadow-soft"
      >
        <Crown className="w-4 h-4" />
        {t("Γίνε Διοργανωτής Παρέας", "Become group organizer")}
      </button>
    </div>
  );
}
