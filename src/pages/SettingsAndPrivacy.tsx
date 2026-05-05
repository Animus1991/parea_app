import React from 'react';
import { Settings, Bell, Lock, Eye, Globe, Shield, CreditCard, LogOut, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function SettingsAndPrivacy() {
  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: Globe, label: 'Language & Region', value: 'English (US)' },
        { icon: CreditCard, label: 'Payment Methods', value: '1 saved card' },
      ]
    },
    {
      title: 'Privacy & Visibility',
      items: [
        { icon: Eye, label: 'Profile Visibility', value: 'Public' },
        { icon: Shield, label: 'Blocked Users', value: 'None' },
        { icon: Lock, label: 'Two-Factor Authentication', value: 'Off' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { icon: Bell, label: 'Push Notifications', value: 'All Activity' },
        { icon: Bell, label: 'Email Preferences', value: 'Important Only' },
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Settings & Privacy</h1>
        <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Manage your account preferences and data.</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{section.title}</h2>
            <Card className="divide-y divide-gray-100 overflow-hidden">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-[#111827]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.value}
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}

        <div className="pt-6">
          <Card className="divide-y divide-gray-100 border-rose-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer text-rose-600 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Log Out</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer text-rose-600 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Delete Account</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
