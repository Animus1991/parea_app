import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Star, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PostEventFeedback() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">Post-Event Feedback</h1>
        <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Your feedback remains private and helps maintain Nakamas's high-trust community.</p>
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4">Rate the Organizer & Event Quality</h3>
              <p className="text-xs text-gray-500 font-medium mb-3">
                 Did the organizer deliver on the promise? Was the event well organized?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <Star className="w-8 h-8 text-gray-300 hover:text-amber-400 hover:fill-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4 mt-6">Rate the Group Vibe</h3>
              <p className="text-xs text-gray-500 font-medium mb-3">
                 Was the group chemistry good? Did everyone respect the etiquette?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={`vibe-${star}`} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <Star className="w-8 h-8 text-gray-300 hover:text-indigo-400 hover:fill-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4">Did all members attend?</h3>
              <p className="text-xs text-gray-500 font-medium mb-3">
                No-shows negatively impact everyone's reliability score. Please report accurately.
              </p>
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="attendance" className="h-4 w-4 text-indigo-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-gray-700">Yes, everyone showed up.</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="attendance" className="h-4 w-4 text-indigo-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-gray-700">No, someone was missing.</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4">Group Comfort & Safety</h3>
              <p className="text-xs text-gray-500 font-medium mb-3">
                Did you feel safe and comfortable with this group? If there was any inappropriate behavior or dating-like advances, report it here.
              </p>
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50 rounded-lg cursor-pointer">
                  <input type="radio" name="comfort" className="h-4 w-4 text-emerald-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-emerald-800">Yes, it was a great group.</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer">
                  <input type="radio" name="comfort" className="h-4 w-4 text-amber-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    No, I felt uncomfortable.
                  </span>
                </label>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              Submit Feedback
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#111827]">Thank you!</h2>
              <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed max-w-sm mx-auto">
                Your feedback has been securely transmitted. This helps us reward reliable members and restrict access for those who violate our policies.
              </p>
            </div>
            <div className="pt-4">
              <Button onClick={() => navigate('/history')}>
                Return to History
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
