import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Users } from 'lucide-react';
import { useLanguage } from "../lib/i18n";

export default function Login() {
    const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4">
      <Card className="w-full max-w-md p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center text-4xl font-black tracking-tight text-[#111827] mb-4 font-['Outfit'] uppercase">
             NAKAMAS
          </div>
          <h1 className="text-2xl font-bold text-[#111827]"></h1>
          <p className="text-xs text-gray-500 font-medium"></p>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <img referrerPolicy="no-referrer" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /></button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full bg-black text-[13px] font-bold text-white hover:bg-gray-900 transition-colors shadow-sm"
          >
            <img referrerPolicy="no-referrer" src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-5 h-5 filter invert" /></button>
        </div>

        <div className="text-center mt-6">
          <p className="text-[10px] text-gray-400 font-medium leading-relaxed"><br/></p>
        </div>
      </Card>
    </div>
  );
}
