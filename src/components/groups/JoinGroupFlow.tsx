import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEvents } from '../../data/mockEvents';
import { mockGroups } from '../../data/mockGroups';
import { Button } from '../common/Button';
import { Users, CheckCircle, ShieldCheck, Tag } from 'lucide-react';
import { useLanguage } from "../../lib/i18n";

export default function JoinGroupFlow() {
  const { t } = useLanguage();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find(e => e.id === eventId);
  const eventGroups = mockGroups.filter(g => g.eventId === eventId && g.status === 'pending');
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState<'existing' | 'new'>('new');
  const [newGroupSize, setNewGroupSize] = useState(4);

  if (!event) return null;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 mt-8">
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[22.33807213275px] font-bold text-[#111827]">
              {t(`Συμμετοχή στο`, `Join`)} {event.title}
            </h2>
            <p className="text-[16.56547605484px] text-gray-500 mt-2">
              {t(`Επιλέξτε πώς θέλετε να συμμετάσχετε. Η ομαδική συμμετοχή μπορεί να ξεκλειδώσει εκπτώσεις.`, `Select how you want to join this event. Joining a group can unlock discounts.`)}
            </p>
          </div>

          {/* Group type selection */}
          <div className="space-y-3">
            {eventGroups.length > 0 && (
              <button
                onClick={() => setGroupType('existing')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${groupType === 'existing' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="font-bold text-[#111827] text-[16.75971px]">{t(`Υπάρχουσα ομάδα`, `Join existing group`)}</p>
                    <p className="text-[14.535px] text-gray-500 mt-0.5">{eventGroups.length} {t(`ομάδες σχηματίζονται`, `groups forming`)}</p>
                  </div>
                </div>
              </button>
            )}
            <button
              onClick={() => setGroupType('new')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${groupType === 'new' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="font-bold text-[#111827] text-[16.75971px]">{t(`Νέα ομάδα`, `Start a new group`)}</p>
                  <p className="text-[14.535px] text-gray-500 mt-0.5">{t(`Επιλέξτε μέγεθος ομάδας`, `Choose your group size`)}</p>
                </div>
              </div>
            </button>
          </div>

          {/* Group size selector (for new groups) */}
          {groupType === 'new' && (
            <div className="space-y-2">
              <label className="text-[12.1125px] font-bold text-gray-600 uppercase tracking-wider">
                {t(`Μέγεθος ομάδας`, `Group Size`)}
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map(size => (
                  <button
                    key={size}
                    onClick={() => setNewGroupSize(size)}
                    className={`flex-1 py-2 rounded-lg text-[16.75971px] font-bold transition-all ${newGroupSize === size ? 'bg-cyan-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={() => setStep(2)}>
            {t(`Συνέχεια`, `Continue`)}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[22.33807213275px] font-bold text-[#111827]">
              {event.isPaid ? t(`Ασφαλίστε τη θέση σας`, `Secure Your Spot`) : t(`Επιβεβαίωση δέσμευσης`, `Commitment Confirmation`)}
            </h2>
            <p className="mt-2 text-[14.535px] text-gray-500 font-medium bg-gray-50 p-2 rounded inline-block">
              {groupType === 'new'
                ? `${t(`Νέα ομάδα`, `New group`)} — ${newGroupSize} ${t(`άτομα`, `people`)}`
                : t(`Ένταξη σε υπάρχουσα ομάδα`, `Joining existing group`)}
            </p>
          </div>

          {event.isPaid ? (
            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between text-[16.75971px]">
                <span className="text-gray-600">{t(`Τιμή εισιτηρίου`, `Base Ticket Price`)}</span>
                <span className="font-bold">€{event.price.toFixed(2)}</span>
              </div>
              {event.groupDiscount && newGroupSize >= event.groupDiscount.minSize && (
                <div className="flex justify-between text-[18px] text-emerald-600 font-medium">
                  <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> {t(`Ομαδική έκπτωση`, `Group Discount`)} ({event.groupDiscount.percentage}%)</span>
                  <span>-€{(event.price * (event.groupDiscount.percentage / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[16.75971px]">
                <span className="text-gray-600">{t(`Τέλος συντονισμού`, `Coordination Fee`)}</span>
                <span className="font-bold">€1.50</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-[20.731614957278874px] text-cyan-700">
                <span>{t(`Σύνολο`, `Total`)}</span>
                <span>€{((event.groupDiscount && newGroupSize >= event.groupDiscount.minSize ? event.price * (1 - event.groupDiscount.percentage / 100) : event.price) + 1.5).toFixed(2)}</span>
              </div>
              <div className="bg-yellow-50 text-yellow-800 text-[14.535px] p-3 rounded-lg font-medium flex items-start gap-2 mt-2 leading-relaxed">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                {t(`Η πληρωμή προεγκρίνεται και ολοκληρώνεται μόνο μετά την επιβεβαίωση της ομάδας.`, `Payment is pre-authorized and processed only after the group is confirmed.`)}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-[14.535px] text-red-800 font-medium bg-red-50 border border-red-200 p-4 rounded-xl leading-relaxed">
                <strong>{t(`Υποχρεωτική δέσμευση:`, `Mandatory Commitment:`)}</strong> {t(`Αυτή είναι δωρεάν εκδήλωση, αλλά η θέση σας είναι πολύτιμη. Αν δεν εμφανιστείτε χωρίς λόγο, η βαθμολογία αξιοπιστίας σας θα μειωθεί σημαντικά.`, `This is a free event, but your spot is valuable. If you fail to show up without a valid reason, your reliability score will decrease significantly.`)}
              </div>
              <div className="rounded-xl border border-gray-200 p-4 flex justify-between text-[16.75971px] font-bold text-cyan-700">
                <span>{t(`Κατάσταση εγγραφής`, `Registration Status`)}</span>
                <span>{t(`Εκκρεμεί επιβεβαίωση`, `Pending Confirmation`)}</span>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={() => setStep(3)}>
            {event.isPaid ? t(`Προέγκριση πληρωμής`, `Pre-Authorize Payment`) : t(`Δεσμεύομαι να παρευρεθώ`, `I Commit to Attend`)}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-2">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-[30px] font-extrabold text-[#111827]">{t(`Είστε μέσα!`, `You're In!`)}</h2>
            <p className="mt-2 text-[18px] text-gray-600 font-medium leading-relaxed max-w-[280px] mx-auto">
              {t(`Η θέση σας είναι κρατημένη. Θα σας στείλουμε το σημείο συνάντησης 24 ώρες πριν.`, `Your spot is reserved. We'll send you the exact meeting location 24h prior.`)}
            </p>
          </div>

          {/* Verification nudge */}
          <div className="mt-8 bg-gradient-to-br from-cyan-50/80 to-white border border-cyan-100/50 rounded-2xl p-6 text-left relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-cyan-100/50 p-1.5 rounded-lg text-cyan-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-[18px] font-bold text-cyan-950">{t(`Μια τελευταία λεπτομέρεια`, `One last, quick thing`)}</h3>
              </div>
              <p className="text-[16.2px] text-gray-600 font-medium mb-5 leading-relaxed pr-4">
                {t(`Πάνω από 85% των μελών αποκτούν το Verified Badge πριν την πρώτη τους εκδήλωση.`, `Over 85% of members claim their Verified Badge before their first event.`)}
              </p>
              <Button className="w-full sm:w-auto" onClick={() => navigate('/verification')}>
                {t(`Απόκτηση Verified Badge (~60δ)`, `Get Verified Badge (~60s)`)}
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button variant="ghost" className="w-full text-gray-500 font-bold hover:bg-gray-50 text-[18px] h-11" onClick={() => navigate('/plans')}>
              {t(`Παράλειψη, πήγαινε στα Σχέδιά μου`, `Skip for now, go to My Plans`)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}