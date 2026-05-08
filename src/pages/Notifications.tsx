import { Bell, Calendar, MessageCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from "../lib/i18n";

export default function Notifications() {
    const { t } = useLanguage();
    
  const notifications = [
    {
      id: 'n1',
      type: 'match',
      message: "Νέο Ταίριασμα! Τοποθετηθήκατε σε ομάδα υψηλής εμπιστοσύνης για το 'Σαββατοκύριακο στην Αράχωβα'.",
      time: t(`Πριν 10 λεπτά`, `10 minutes ago`),
      read: false,
      icon: AlertTriangle, // We will change this to Users below
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 'n2',
      type: 'message',
      message: "Ο διοργανωτής Alex έστειλε ένα μήνυμα: 'Γεια σε όλους! Δείτε το νέο σημείο συνάντησης για την αυριανή πεζοπορία.'",
      time: t(`Πριν 1 ώρα`, `1 hour ago`),
      read: false,
      icon: MessageCircle,
      color: 'bg-cyan-100 text-cyan-600'
    },
    {
      id: 'n3',
      type: 'reminder',
      message: "Υπενθύμιση: Το 'Stand-up Comedy' ξεκινά σε 24 ώρες. Μην ξεχάσετε τα εισιτήριά σας!",
      time: 'Πριν 3 ώρες',
      read: true,
      icon: Calendar,
      color: 'bg-gray-100 text-gray-600'
    },
    {
      id: 'n4',
      type: 'system',
      message: t(`Η βαθμολογία αξιοπιστίας σας αυξήθηκε στο 95%. Ευχαριστούμε που είστε ένα εξαιρετικό μέλος της κοινότητας!`, `Your reliability score increased to 95%. Thank you for being a great community member!`),
      time: t(`Πριν 2 μέρες`, `2 days ago`),
      read: true,
      icon: AlertTriangle,
      color: 'bg-gray-100 text-gray-600'
    }
  ];

  return (
    <div className="mx-auto max-w-full space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
</h1>
</div>
</div>
</div>
  );
}
