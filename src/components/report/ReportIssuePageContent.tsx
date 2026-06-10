import React, { useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, X, Upload, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { useStore } from '../../store';

export default function ReportIssuePageContent() {
  const { t } = useLanguage();
  const p = usePageContrast();
  const c = useContrastTheme();
  const submitIssueReport = useStore((s) => s.submitIssueReport);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceNames, setEvidenceNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !severity || !description.trim()) return;
    submitIssueReport({ category, severity, description: description.trim(), evidenceNames });
    toast.success(t('Η αναφορά υποβλήθηκε', 'Report submitted'));
    setStep(2);
  };

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const names = Array.from(files).map((f) => f.name);
    setEvidenceNames((prev) => [...prev, ...names]);
    e.target.value = '';
  };

  const removeEvidence = (name: string) => {
    setEvidenceNames((prev) => prev.filter((n) => n !== name));
  };

  const inputClass = cn(
    'w-full rounded-2xl border shadow-soft focus:outline-none focus:ring-2 text-[16.2px] font-medium transition-all duration-200',
    c.inputBg,
    c.inputFg,
    c.placeholder,
    p.ring,
  );

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={cn('text-[16px] md:text-[18px] font-bold', p.head)}>
            {t('Αναφορά Προβλήματος', 'Report an Issue')}
          </h1>
          <p className={cn('font-medium text-[13.55px] md:text-[16.25px] mt-1', p.sub)}>
            {t('Βοηθήστε μας να κρατήσουμε την κοινότητα ασφαλή', 'Help us keep the community safe')}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className={cn(
            'transition-all duration-200 rounded-full p-2 border shadow-soft',
            c.surfaceElevated,
            c.border,
            p.muted,
            p.isDark ? 'hover:text-white' : 'hover:text-[#111827]',
          )}
          aria-label={t('Κλείσιμο', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 1 ? (
        <div className={cn('rounded-2xl shadow-soft border overflow-hidden', c.surfaceElevated, c.border)}>
          <div
            className={cn(
              'p-4 md:p-6 border-b flex items-start gap-4',
              p.isDark ? 'bg-red-950/30 border-red-900/40' : 'bg-red-50 border-red-100',
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                p.isDark ? 'bg-red-900/40' : 'bg-red-100',
              )}
            >
              <AlertTriangle className={cn('w-5 h-5', p.isDark ? 'text-red-300' : 'text-red-600')} />
            </div>
            <div>
              <h3 className={cn('font-bold text-[16.76px]', p.head)}>
                {t('Αναφορά Ζητήματος Ασφαλείας', 'Report a Safety Concern')}
              </h3>
              <p className={cn('text-[14.5px] mt-1 leading-relaxed', p.isDark ? 'text-red-200' : 'text-red-800')}>
                {t(
                  'Η αναφορά σας θα εξεταστεί από την ομάδα μας εντός 24 ωρών.',
                  'Your report will be reviewed by our team within 24 hours.',
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
            <div>
              <label className={cn('block text-[10.9px] font-bold tracking-wider mb-2', p.head)}>
                {t('Κατηγορία', 'Category')}
              </label>
              <select
                className={cn(inputClass, 'h-11 px-3')}
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t('Επιλέξτε κατηγορία...', 'Select a category...')}</option>
                <option value="user_behavior">{t('Ανάρμοστη συμπεριφορά', 'Inappropriate behavior')}</option>
                <option value="event_safety">{t('Ασφάλεια εκδήλωσης', 'Event safety')}</option>
                <option value="fake_profile">{t('Ψεύτικο προφίλ', 'Fake profile')}</option>
                <option value="no_show">{t('No-show', 'No-show')}</option>
                <option value="other">{t('Άλλο', 'Other')}</option>
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className={cn('block text-[10.9px] font-bold tracking-wider mb-2', p.head)}>
                {t('Σοβαρότητα', 'Severity')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity('low')}
                  aria-pressed={severity === 'low'}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all hover:ring-2 hover:ring-amber-300',
                    p.isDark ? 'border-amber-800/50 bg-amber-950/30' : 'border-amber-200 bg-amber-50',
                    severity === 'low' && 'ring-2 ring-amber-400',
                  )}
                >
                  <span className={cn('text-[12.1px] font-bold block', p.isDark ? 'text-amber-200' : 'text-amber-800')}>
                    {t('Χαμηλή', 'Low')}
                  </span>
                  <span className={cn('text-[10px]', p.isDark ? 'text-amber-300/80' : 'text-amber-600')}>
                    {t('Ενόχληση', 'Annoyance')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('medium')}
                  aria-pressed={severity === 'medium'}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all hover:ring-2 hover:ring-orange-300',
                    p.isDark ? 'border-orange-800/50 bg-orange-950/30' : 'border-orange-200 bg-orange-50',
                    severity === 'medium' && 'ring-2 ring-orange-400',
                  )}
                >
                  <span
                    className={cn('text-[12.1px] font-bold block', p.isDark ? 'text-orange-200' : 'text-orange-800')}
                  >
                    {t('Μέτρια', 'Medium')}
                  </span>
                  <span className={cn('text-[10px]', p.isDark ? 'text-orange-300/80' : 'text-orange-600')}>
                    {t('Ανησυχία', 'Concern')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('high')}
                  aria-pressed={severity === 'high'}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all hover:ring-2 hover:ring-red-300',
                    p.isDark ? 'border-red-800/50 bg-red-950/30' : 'border-red-200 bg-red-50',
                    severity === 'high' && 'ring-2 ring-red-400',
                  )}
                >
                  <span className={cn('text-[12.1px] font-bold block', p.isDark ? 'text-red-200' : 'text-red-800')}>
                    {t('Υψηλή', 'High')}
                  </span>
                  <span className={cn('text-[10px]', p.isDark ? 'text-red-300/80' : 'text-red-600')}>
                    {t('Κίνδυνος', 'Danger')}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className={cn('block text-[10.9px] font-bold tracking-wider mb-2', p.head)}>
                {t('Περιγραφή', 'Description')}
              </label>
              <textarea
                className={cn(inputClass, 'px-3 py-2.5 resize-none')}
                rows={5}
                placeholder={t('Περιγράψτε τι συνέβη...', 'Describe what happened...')}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Evidence Upload */}
            <div>
              <label className={cn('block text-[12.15px] font-bold tracking-wider mb-2', p.head)}>
                {t('Αποδεικτικά (προαιρετικά)', 'Evidence (optional)')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                className="hidden"
                onChange={handleEvidenceChange}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-200 cursor-pointer',
                  p.uploadArea,
                  p.cardHover,
                )}
              >
                <Upload className={cn('w-5 h-5 mx-auto mb-1', p.muted)} />
                <p className={cn('text-[12.5px] font-medium', p.uploadText)}>
                  {t('Ανεβάστε screenshots ή φωτογραφίες', 'Upload screenshots or photos')}
                </p>
                <p className={cn('text-[10px] mt-0.5', p.muted)}>
                  PNG, JPG {t('έως', 'up to')} 5MB
                </p>
              </div>
              {evidenceNames.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {evidenceNames.map((name) => (
                    <li
                      key={name}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-[12px]',
                        p.isDark ? 'bg-gray-800/50' : 'bg-gray-50',
                      )}
                    >
                      <span className={cn('truncate', p.sub)}>{name}</span>
                      <button
                        type="button"
                        onClick={() => removeEvidence(name)}
                        className={cn('shrink-0 p-0.5 rounded', p.muted, 'hover:text-red-500')}
                        aria-label={t('Αφαίρεση', 'Remove')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cn('rounded-lg p-4 flex items-start gap-3', p.infoBg)}>
              <ShieldCheck className={cn('w-5 h-5 shrink-0 mt-0.5', p.iconAccent)} />
              <p className={cn('text-[13.5px] font-medium leading-relaxed', p.sub)}>
                <span className={cn('font-bold', p.head)}>{t('Απόρρητο:', 'Privacy:')}</span>{' '}
                {t('Η αναφορά σας είναι εμπιστευτική.', 'Your report is confidential.')}
              </p>
            </div>

            {/* Expected response time */}
            <div className={cn('flex items-center gap-2 justify-center text-[12.5px] font-medium', p.muted)}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {t('Αναμενόμενος χρόνος απόκρισης: <24 ώρες', 'Expected response time: <24 hours')}
              </span>
            </div>

            <button
              type="submit"
              disabled={!category || !severity || !description.trim()}
              className={cn(
                'w-full py-2.5 rounded-full text-[12.15px] font-bold shadow-soft transition-all duration-200 tracking-wider disabled:opacity-50',
                p.chipActive,
                p.isDark ? '' : 'hover:opacity-90',
              )}
            >
              {t('Υποβολή Αναφοράς', 'Submit Report')}
            </button>
          </form>
        </div>
      ) : (
        <div className={cn('rounded-2xl shadow-soft border p-8 text-center', c.surfaceElevated, c.border)}>
          <div
            className={cn(
              'w-16 h-[58px] rounded-full flex items-center justify-center mx-auto mb-4',
              p.isDark ? 'bg-emerald-900/40' : 'bg-emerald-100',
            )}
          >
            <CheckCircle2 className={cn('w-8 h-8', p.isDark ? 'text-emerald-300' : 'text-emerald-600')} />
          </div>
          <h2 className={cn('text-[25px] font-bold mb-2', p.head)}>{t('Η αναφορά υποβλήθηκε', 'Report Submitted')}</h2>
          <p className={cn('text-[18px] max-w-md mx-auto mb-6', p.sub)}>
            {t(
              'Ευχαριστούμε. Θα εξετάσουμε την αναφορά σας και θα σας ενημερώσουμε.',
              "Thank you. We'll review your report and get back to you.",
            )}
          </p>
          <button
            onClick={() => navigate('/')}
            className={cn('px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-colors tracking-wider', p.chipInactive)}
          >
            {t('Επιστροφή', 'Go Back')}
          </button>
        </div>
      )}
    </div>
  );
}
