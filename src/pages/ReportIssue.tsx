import React, { useState } from 'react';
import { Flag, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReportIssue() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Report an Issue</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Help us maintain a safe community.</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#111827] transition-colors rounded-full p-2 bg-white border border-gray-200 shadow-sm">
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 1 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827] text-sm">Emergency Info</h3>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">If you or anyone else is in immediate danger, please contact local emergency services (112) first. Nakamas staff are not first responders.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-2">What is this regarding?</label>
              <select className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium" required>
                <option value="">Select an option...</option>
                <option value="user_behavior">Inappropriate User Behavior</option>
                <option value="event_safety">Event Safety Concern</option>
                <option value="fake_profile">Fake Profile or Scam</option>
                <option value="no_show">Repeated No-shows</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-2">Description of the issue</label>
              <textarea 
                className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium resize-none" 
                rows={5} 
                placeholder="Please provide as much detail as possible. This information is kept strictly confidential."
                required
              ></textarea>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Your report is private. The reported party will <span className="font-bold text-[#111827]">never</span> see who reported them. Our Trust & Safety team will review this within 24 hours.
              </p>
            </div>

            <button type="submit" className="w-full bg-[#111827] text-white py-3 rounded-full text-xs font-bold shadow-sm hover:bg-black transition-colors uppercase tracking-wider">
              Submit Report
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">Report Submitted</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Thank you for helping keep the Nakamas community safe. Our Trust & Safety team will review your report and take appropriate action.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-100 text-[#111827] px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
