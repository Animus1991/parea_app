import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useLanguage } from "../lib/i18n";
import { ShieldCheck, Users, MapPin, Star, Sparkles } from 'lucide-react';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-cyan-100/40 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-purple-100/40 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-amber-100/30 animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

      <Card className="p-8 w-full max-w-sm space-y-6 text-center relative">
        <div>
          <div className="text-[#18D8DB] font-bold text-[30px] font-['Poppins'] tracking-tight mb-2">Nakamas</div>
          <h1 className="text-[18.093837007329px] font-bold text-[#111827]">{t(`Καλώς ήρθατε`, `Welcome`)}</h1>
          <p className="text-[14.626916949961px] text-gray-500 font-medium mt-1">{t(`Βρείτε παρέα για εμπειρίες που ήδη θέλετε να ζήσετε`, `Find company for experiences you already want to enjoy`)}</p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-50 flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 leading-tight block">{t(`Μικρές Ομάδες`, `Small Groups`)}</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-purple-50 flex items-center justify-center mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 leading-tight block">{t(`Ασφαλές`, `Safe & Verified`)}</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-amber-50 flex items-center justify-center mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 leading-tight block">{t(`Gamification`, `Gamification`)}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button className="w-full" onClick={() => navigate('/')}>
            {t(`Σύνδεση με Google`, `Sign in with Google`)}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            {t(`Σύνδεση με Apple`, `Sign in with Apple`)}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            {t(`Σύνδεση με Email`, `Sign in with Email`)}
          </Button>
        </div>

        {/* Testimonial */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-1 justify-center mb-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-[12.5px] text-gray-600 italic font-medium">"{t(`Βρήκα φανταστική παρέα για πεζοπορία μέσα σε 2 μέρες!`, `Found an amazing hiking group within 2 days!`)}"</p>
          <p className="text-[11.2px] text-gray-400 font-bold mt-1">— Maria K., Athens</p>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <span className="flex items-center gap-1 text-[11.2px] text-gray-400 font-medium"><ShieldCheck className="w-3 h-3 text-green-500" />{t(`Ασφαλής`, `Secure`)}</span>
          <span className="flex items-center gap-1 text-[11.2px] text-gray-400 font-medium"><Users className="w-3 h-3 text-cyan-500" />{t(`2K+ μέλη`, `2K+ members`)}</span>
          <span className="flex items-center gap-1 text-[11.2px] text-gray-400 font-medium"><MapPin className="w-3 h-3 text-cyan-500" />{t(`Αθήνα`, `Athens`)}</span>
        </div>
        <p className="text-[11.2px] text-gray-400 font-medium pt-1">
          {t(`Συνεχίζοντας, αποδέχεστε τους Όρους Χρήσης`, `By continuing, you agree to our Terms of Service`)}
        </p>
      </Card>
    </div>
  );
}
