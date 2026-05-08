import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
