import React, { useState } from 'react';
import { Map, MapPin, Search, Compass, Users, Filter, SlidersHorizontal, Navigation, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Badge } from '../components/common/Badge';

export default function NearbyGroups() {
  const navigate = useNavigate();
  const [radius, setRadius] = useState<number>(5);

  const localGroups = mockEvents.filter(e => e.groupSize && e.groupSize > 0).slice(0, 5);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-6 -mx-4 md:-m-8 animate-in fade-in duration-500 overflow-hidden relative">
      {/* Map Background Mock */}
      <div className="absolute inset-0 bg-[#e5e3df] z-0">
        <div className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h80v80h-80z' stroke='%23000' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />
        {/* Map Streets Mock */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,50 Q100,60 200,30 T400,80 T600,40 T800,90 T1000,50" stroke="#fff" strokeWidth="8" fill="none" />
          <path d="M100,0 Q120,100 80,200 T150,400 T100,600 T200,800 T50,1000" stroke="#fff" strokeWidth="6" fill="none" />
          <path d="M300,0 Q320,100 380,200 T350,400 T400,600 T300,800 T350,1000" stroke="#fff" strokeWidth="5" fill="none" />
        </svg>

        {/* Map Pins */}
        <div className="absolute top-[30%] left-[40%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg mb-1 group-hover:scale-110 transition-transform whitespace-nowrap">
            Stand-up Comedy • 2km
          </div>
          <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-md animate-pulse"></div>
        </div>

        <div className="absolute top-[60%] left-[60%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg mb-1 group-hover:scale-110 transition-transform whitespace-nowrap">
            Board Games • 4km
          </div>
          <div className="w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-md"></div>
        </div>

        <div className="absolute top-[20%] left-[70%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg mb-1 group-hover:scale-110 transition-transform whitespace-nowrap">
            Theatre Group • 1.5km
          </div>
          <div className="w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-md"></div>
        </div>
        
        {/* User Location */}
        <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-ping absolute"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md relative z-10"></div>
          <div className="w-32 h-32 border border-blue-500/30 rounded-full absolute bg-blue-500/5 pointer-events-none"></div>
        </div>
      </div>

      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search nearby areas or groups..." 
            className="w-full h-11 pl-10 pr-4 rounded-xl border-0 bg-white/95 backdrop-blur shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium"
          />
        </div>
        <button className="h-11 px-4 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:text-indigo-600 transition-colors">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Map Controls */}
      <div className="absolute right-4 bottom-1/2 transform translate-y-1/2 z-10 flex flex-col gap-2">
        <button className="w-10 h-10 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:text-indigo-600 transition-colors">
          <Compass className="h-5 w-5" />
        </button>
        <button className="w-10 h-10 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:text-indigo-600 transition-colors">
          <Crosshair className="h-5 w-5" />
        </button>
        <div className="w-10 h-20 bg-white/95 backdrop-blur rounded-xl shadow-lg flex flex-col items-center justify-between py-2 text-gray-700 font-bold divide-y divide-gray-100">
          <button className="hover:text-indigo-600 w-full pb-1">+</button>
          <button className="hover:text-indigo-600 w-full pt-1">−</button>
        </div>
      </div>

      {/* Slide-up Panel for Mobile, Sidebar for Desktop */}
      <div className="absolute bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:right-auto md:w-96 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-[10px_0_40px_rgba(0,0,0,0.1)] z-20 flex flex-col rounded-t-3xl md:rounded-none transition-transform duration-300 transform translate-y-0 max-h-[60vh] md:max-h-full">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 md:hidden shrink-0"></div>
        
        <div className="p-4 md:p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-[#111827]">Local Groups</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">
            <Navigation className="h-3 w-3" /> Showing results within {radius}km
          </p>
          
          <div className="mt-4 flex items-center gap-3">
             <input type="range" min="1" max="25" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="flex-1 accent-indigo-600" />
             <span className="text-xs font-bold text-indigo-600 w-8">{radius}km</span>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto noscrollbar pb-1">
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold whitespace-nowrap shadow-sm">All Matches</button>
            <button className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs font-bold whitespace-nowrap hover:bg-gray-100">Today</button>
            <button className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs font-bold whitespace-nowrap hover:bg-gray-100">Friends Going</button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-3 noscrollbar">
          {localGroups.map((group, idx) => (
             <div 
                key={idx}
                className="p-3 border border-gray-100 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex gap-3 bg-white"
                onClick={() => navigate(`/events/${group.id}`)}
             >
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  <img src={group.imageUrl} alt={group.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-sm text-[#111827] line-clamp-1 group-hover:text-indigo-600 transition-colors">{group.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{group.location}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="neutral" className="text-[9px] px-1.5 py-0">{group.category}</Badge>
                    <div className="flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      <MapPin className="h-2.5 w-2.5 mr-1" /> {(1.2 + idx * 0.8).toFixed(1)}km
                    </div>
                  </div>
                </div>
             </div>
          ))}
          
          <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
               <Map className="h-6 w-6" />
             </div>
             <h3 className="text-sm font-bold text-[#111827]">Expand your radius</h3>
             <p className="text-xs text-gray-500 mt-1 mb-4">Discover more local groups by increasing your search area.</p>
             <button onClick={() => setRadius(15)} className="text-xs font-bold text-white bg-[#111827] px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
               Set radius to 15km
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
