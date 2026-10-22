import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  FileCheck, 
  Send, 
  XCircle,
  CreditCard,
  UserCheck
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  let label = status;
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Activity;

  switch (normalized) {
    case 'awaiting_payment':
    case 'pending':
      label = 'Awaiting Payment';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      break;

    case 'payment_approved':
    case 'approved':
      label = 'Payment Approved';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      break;

    case 'waiting_consultation':
      label = 'Waiting Doctor';
      bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
      Icon = Clock;
      break;

    case 'in_consultation':
      label = 'In Consultation';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = Activity;
      break;

    case 'lab_pending':
      label = 'Tests Ordered';
      bgClass = 'bg-orange-50 text-orange-700 border-orange-200';
      Icon = Clock;
      break;

    case 'in_progress':
      label = 'In Progress';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = Activity;
      break;

    case 'results_ready':
      label = 'Results Ready';
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
      Icon = FileCheck;
      break;

    case 'sent_to_doctor':
      label = 'Sent to Doctor';
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Send;
      break;

    case 'completed':
    case 'final':
      label = 'Completed';
      bgClass = 'bg-green-50 text-green-700 border-green-200';
      Icon = CheckCircle2;
      break;

    case 'rejected':
    case 'cancelled':
      label = 'Cancelled';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = XCircle;
      break;

    case 'registered':
      label = 'Registered';
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
      Icon = UserCheck;
      break;

    case 'active':
      label = 'Active';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      break;

    case 'urgent':
      label = 'URGENT';
      bgClass = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse';
      Icon = AlertCircle;
      break;

    default:
      label = status.replace(/_/g, ' ');
  }

  const sizeClasses = size === 'xs'
    ? 'text-xs px-2 py-0.5'
    : size === 'lg'
    ? 'text-sm px-3 py-1 font-semibold'
    : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm capitalize ${sizeClasses} ${bgClass}`}>
      <Icon className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  );
};

export default StatusBadge;
