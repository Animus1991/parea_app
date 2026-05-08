import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEvents } from '../../data/mockEvents';
import { mockGroups } from '../../data/mockGroups';
import { Button } from '../common/Button';
import { Ticket, Users, CheckCircle, Split, ShieldCheck, Tag } from 'lucide-react';
import { useLanguage } from "../../lib/i18n";

export default function JoinGroupFlow() {
    const { t } = useLanguage();
    
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find(e => e.id === eventId);
  const eventGroups = mockGroups.filter(g => g.eventId === eventId);
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState<'existing' | 'new'>('new');
  const [newGroupSize, setNewGroupSize] = useState(4);

  if (!event) return null;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 mt-8">
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
</h2>
</div>
</div>
</div>
  );
}
