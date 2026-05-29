import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { Button } from '../common/Button';
import { Ticket, Users, CheckCircle, Split, ShieldCheck, Tag } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { canAccessEvent } from '../../lib/trust';
import { computeDiscountedPrice } from '../../lib/groupUtils';
import { toast } from 'sonner';

export default function JoinGroupFlow() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const preSelectedGroupId = searchParams.get('groupId');

  const events = useStore((state) => state.events);
  const groups = useStore((state) => state.groups);
  const currentUser = useStore((state) => state.currentUser);
  const joinGroup = useStore((state) => state.joinGroup);
  const createGroup = useStore((state) => state.createGroup);
  const placeCommitmentHold = useStore((state) => state.placeCommitmentHold);
  const hasCommitmentHold = useStore((state) => state.hasCommitmentHold);
  const canJoinEvent = useStore((state) => state.canJoinEvent);

  const event = events.find((e) => e.id === eventId);
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState<'existing' | 'new'>(
    preSelectedGroupId ? 'existing' : 'new',
  );
  const [newGroupSize, setNewGroupSize] = useState(4);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(preSelectedGroupId);
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);

  if (!event || !eventId) return null;

  const gate = canAccessEvent(currentUser, event);
  const storeGate = canJoinEvent(eventId);
  const needsCommitment = !event.isPaid && !hasCommitmentHold(eventId);

  const availableGroups = groups.filter(
    (g) => g.eventId === eventId && g.members.length < g.targetSize,
  );

  const discountedPrice =
    event.isPaid && event.groupDiscount
      ? computeDiscountedPrice(event, event.groupDiscount.minSize)
      : event.price;

  const handleConfirm = () => {
    if (!gate.allowed) {
      toast.error(t(gate.messageEl, gate.messageEn));
      return;
    }
    if (!storeGate.ok) {
      toast.error(t(storeGate.messageEl, storeGate.messageEn));
      return;
    }
    if (needsCommitment && !commitmentAccepted) {
      toast.error(
        t(
          'Αποδεχτείτε τη δέσμευση συμμετοχής για δωρεάν εκδηλώσεις.',
          'Accept the participation commitment for free events.',
        ),
      );
      return;
    }
    if (needsCommitment) placeCommitmentHold(eventId);

    if (groupType === 'existing') {
      if (selectedGroupId) joinGroup(selectedGroupId);
      else {
        const first = availableGroups[0];
        if (first) joinGroup(first.id);
      }
    } else {
      createGroup(event.id, newGroupSize);
    }
    setStep(3);
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-soft sm:p-8 mt-8">
      {!gate.allowed && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {t(gate.messageEl, gate.messageEn)}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              {t('Συμμετοχή ή δημιουργία ομάδας', 'Join or Create a Group')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 font-medium">{event.title}</p>
          </div>

          <p className="text-xs text-gray-600 font-medium p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-900 leading-relaxed">
            {t(
              'Συνιστάμε ομάδες 3–5 ατόμων — πιο ασφαλές και άνετο.',
              'We recommend groups of 3–5 people — safer and more comfortable.',
            )}
            {event.isPaid && event.groupDiscount
              ? ` ${t('Έκπτωση', 'Discount')} -${event.groupDiscount.percentage}% ${t('από', 'from')} ${event.groupDiscount.minSize}+ ${t('μέλη', 'members')}.`
              : ''}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGroupType('existing')}
              className={`p-4 rounded-2xl border text-left min-h-[88px] ${groupType === 'existing' ? 'border-[#18D8DB] bg-cyan-50 ring-1 ring-[#18D8DB]' : 'border-gray-100'}`}
            >
              <Users className={`h-5 w-5 mb-2 ${groupType === 'existing' ? 'text-cyan-600' : 'text-gray-400'}`} />
              <p className="font-bold text-sm">{t('Υπάρχουσα ομάδα', 'Join Existing')}</p>
            </button>
            <button
              type="button"
              onClick={() => setGroupType('new')}
              className={`p-4 rounded-2xl border text-left min-h-[88px] ${groupType === 'new' ? 'border-[#18D8DB] bg-cyan-50 ring-1 ring-[#18D8DB]' : 'border-gray-100'}`}
            >
              <Split className={`h-5 w-5 mb-2 ${groupType === 'new' ? 'text-cyan-600' : 'text-gray-400'}`} />
              <p className="font-bold text-sm">{t('Νέα ομάδα', 'Start New Group')}</p>
            </button>
          </div>

          {groupType === 'new' && (
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setNewGroupSize(size)}
                  className={`flex-1 py-2 min-h-11 rounded-xl font-bold text-sm ${newGroupSize === size ? 'bg-[#111827] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          <Button className="w-full min-h-11" onClick={() => setStep(2)} disabled={!gate.allowed}>
            {t('Συνέχεια', 'Continue')}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h3 className="font-bold text-lg">{t('Επιβεβαίωση', 'Confirmation')}</h3>

          {event.isPaid ? (
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{t('Τιμή', 'Price')}</span>
                <span>€{event.price}</span>
              </div>
              {event.groupDiscount && (
                <div className="flex justify-between text-sm font-bold text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {t('Με ομαδική έκπτωση', 'With group discount')}
                  </span>
                  <span>€{discountedPrice}</span>
                </div>
              )}
              <p className="text-[10px] text-gray-500">
                {t(
                  'Προεξουσιοδότηση — χρέωση μόνο μετά την επιβεβαίωση της ομάδας.',
                  'Pre-authorization — charged only after group confirmation.',
                )}
              </p>
            </div>
          ) : (
            <label className="flex gap-3 p-4 rounded-xl border border-cyan-100 bg-cyan-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={commitmentAccepted}
                onChange={(e) => setCommitmentAccepted(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-xs font-medium text-cyan-900 leading-relaxed">
                {t(
                  'Αποδέχομαι δέσμευση συμμετοχής (hold) για δωρεάν εκδήλωση — ακύρωση εντός 24ω πριν χωρίς ποινή.',
                  'I accept a participation commitment hold for this free event — cancel 24h before without penalty.',
                )}
              </span>
            </label>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 min-h-11" onClick={() => setStep(1)}>
              {t('Πίσω', 'Back')}
            </Button>
            <Button variant="primary" className="flex-[2] min-h-11" onClick={handleConfirm}>
              {t('Επιβεβαίωση συμμετοχής', 'Confirm join')}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-4">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold">{t('Είστε μέσα!', "You're in!")}</h3>
          <p className="text-sm text-gray-500 font-medium">
            {t('Το group chat ξεκλειδώνει όταν η ομάδα επιβεβαιωθεί.', 'Group chat unlocks when the group is confirmed.')}
          </p>
          <Button className="w-full min-h-11" onClick={() => navigate(`/events/${eventId}`)}>
            {t('Επιστροφή στην εκδήλωση', 'Back to event')}
          </Button>
        </div>
      )}
    </div>
  );
}
