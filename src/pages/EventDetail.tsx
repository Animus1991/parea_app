import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { mockEvents } from '../data/mockEvents';
import { mockGroups } from '../data/mockGroups';
import { mockUsers, currentUser } from '../data/mockUsers';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton, EventDetailSkeleton } from '../components/common/Skeleton';
import { Calendar, MapPin, Users, Ticket, ShieldCheck, Clock, CheckCircle, AlertTriangle, Share, Bookmark, Hash, ExternalLink, Maximize, Minimize, QrCode, X, MessageSquare, Info, Filter, ArrowDownUp, Check, UserMinus, ShieldAlert, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useLanguage } from "../lib/i18n";

function Group({ group, event, navigate }: { group: any; event: any; navigate: any; key?: any }) {
    const { t } = useLanguage();
  const spotsLeft = group.targetSize - group.members.length;
  const isDiscountEligible = event.groupDiscount && group.targetSize >= event.groupDiscount.minSize;
  const discountUnlockedTemp = event.groupDiscount && group.members.length >= event.groupDiscount.minSize;
  const membersNeededForDiscount = event.groupDiscount ? Math.max(0, event.groupDiscount.minSize - group.members.length) : 0;
  
  const hostId = group.hostId || group.members[0];
  const groupHost = mockUsers.find(u => u.id === hostId);
  
  return (
    <div 
      className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-cyan-300 hover:shadow-sm transition-all cursor-pointer overflow-hidden mt-2" 
      onClick={() => navigate(`/events/${event.id}/join`)}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      
    </div>
  );
}
export default function EventDetail() { return <div className="p-8 text-center">Event Detail</div>; }
