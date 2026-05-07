import { mockNotifications } from '../data/mockNotifications';

export default function Notifications() {
  return (
    <div className="mx-auto max-w-full space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Notifications</h1>
          <p className="mt-1 text-xs text-gray-500 font-medium">Updates, reminders, and messages.</p>
        </div>
        <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
          Enable Push
        </button>
      </div>

      <div className="space-y-3">
        {mockNotifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div 
              key={notif.id} 
              className={`flex items-start gap-4 p-4 rounded-xl border ${notif.read ? 'bg-white border-gray-100' : 'bg-indigo-50/50 border-indigo-100'} shadow-sm transition-colors cursor-pointer hover:border-indigo-200`}
            >
              <div className={`mt-0.5 p-2 rounded-full shrink-0 ${notif.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-[#111827] font-medium'}`}>
                  {notif.message}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {notif.time}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
