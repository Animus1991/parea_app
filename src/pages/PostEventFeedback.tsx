import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Star, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLanguage } from "../lib/i18n";

export default function PostEventFeedback() {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]"></h1>
        <p className="text-gray-500 font-medium text-xs md:text-sm mt-1"></p>
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4"></h3>
              <p className="text-xs text-gray-500 font-medium mb-3"></p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <Star className="w-8 h-8 text-gray-300 hover:text-amber-400 hover:fill-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4 mt-6"></h3>
              <p className="text-xs text-gray-500 font-medium mb-3"></p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={`vibe-${star}`} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <Star className="w-8 h-8 text-gray-300 hover:text-cyan-400 hover:fill-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4"></h3>
              <p className="text-xs text-gray-500 font-medium mb-3"></p>
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="attendance" className="h-4 w-4 text-cyan-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-gray-700"></span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="attendance" className="h-4 w-4 text-cyan-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-gray-700"></span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-4"></h3>
              <p className="text-xs text-gray-500 font-medium mb-3"></p>
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50 rounded-lg cursor-pointer">
                  <input type="radio" name="comfort" className="h-4 w-4 text-emerald-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-emerald-800"></span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer">
                  <input type="radio" name="comfort" className="h-4 w-4 text-amber-600 rounded-full border-gray-300" />
                  <span className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /></span>
                </label>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep(2)}></Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto flex h-[50px] w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#111827]"></h2>
              <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed max-w-sm mx-auto"></p>
            </div>
            <div className="pt-4">
              <Button onClick={() => navigate('/history')}></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
