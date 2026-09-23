import React, { useState } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  User,
  Scissors,
  AlertCircle,
  CheckCircle,
  Phone,
  MessageCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Appointment } from '../types';
import { api } from '../services/api';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookNew: () => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  onBookNew
}) => {
  const [searchMode, setSearchMode] = useState<'reference' | 'phone'>('reference');
  const [bookingRef, setBookingRef] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [singleAppointment, setSingleAppointment] = useState<Appointment | null>(null);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (searchMode === 'reference') {
        if (!bookingRef.trim()) throw new Error('Please enter your DPR-XXXXXX booking reference');
        const res = await api.lookupAppointment(bookingRef.trim());
        setSingleAppointment(res);
        setAppointmentsList([]);
      } else {
        if (!phoneNumber.trim()) throw new Error('Please enter your mobile phone number');
        const res = await api.customerAuth(phoneNumber.trim());
        setAppointmentsList(res.appointments || []);
        setSingleAppointment(null);
        if ((res.appointments || []).length === 0) {
          setErrorMsg('No reservations found for this phone number.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lookup failed');
      setSingleAppointment(null);
      setAppointmentsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you wish to cancel this appointment?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.cancelAppointment(id, 'Customer requested via portal');
      setSuccessMsg('Your appointment has been cancelled successfully.');

      // Refresh view
      if (singleAppointment && singleAppointment.id === id) {
        setSingleAppointment({ ...singleAppointment, status: 'Cancelled' });
      }
      setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel');
    }
  };

  const handleRescheduleSubmit = async (id: string) => {
    if (!newDate || !newTime) {
      setErrorMsg('Please select a new date and time');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.rescheduleAppointment(id, newDate, newTime);
      setSuccessMsg('Your appointment has been rescheduled successfully.');
      setReschedulingId(null);

      // Refresh single view
      if (singleAppointment && singleAppointment.id === id) {
        setSingleAppointment({
          ...singleAppointment,
          date: newDate,
          start_time: newTime,
          status: 'Confirmed'
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'The selected time is unavailable');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-theme-main border border-theme-card rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-theme-card flex items-center justify-between glass-panel">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20">
              <span className="font-display text-sm font-bold text-accent-cyan">D</span>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-accent-cyan font-semibold">
                Gentleman Portal
              </div>
              <h3 className="text-xl font-display font-medium text-theme-title">
                MY APPOINTMENTS & RESCHEDULE
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-title rounded-xl hover:bg-theme-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Mode Switcher */}
          <div className="flex border-b border-theme-card gap-4">
            <button
              onClick={() => setSearchMode('reference')}
              className={`pb-2.5 px-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                searchMode === 'reference'
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-theme-muted hover:text-theme-title'
              }`}
            >
              Lookup By Booking Ref
            </button>
            <button
              onClick={() => setSearchMode('phone')}
              className={`pb-2.5 px-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                searchMode === 'phone'
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-theme-muted hover:text-theme-title'
              }`}
            >
              Lookup By Phone
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleLookup} className="flex gap-3">
            {searchMode === 'reference' ? (
              <input
                type="text"
                placeholder="e.g. DPR-847291"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                className="flex-1 bg-theme-subtle border border-theme-card rounded-xl px-4 h-11 text-theme-title text-sm focus:outline-none focus:border-cyan-500 font-mono uppercase"
              />
            ) : (
              <input
                type="tel"
                placeholder="0335 XXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-theme-subtle border border-theme-card rounded-xl px-4 h-11 text-theme-title text-sm focus:outline-none focus:border-cyan-500 font-mono"
              />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-11 px-6 text-xs uppercase tracking-wider font-semibold btn-primary-action disabled:opacity-50 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-md active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Searching...' : 'Find'}</span>
            </button>
          </form>

          {/* Messages */}
          {errorMsg && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Single Appointment Card */}
          {singleAppointment && (
            <div className="glass-panel border border-cyan-500/30 rounded-2xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-theme-card">
                <div>
                  <span className="text-theme-muted block text-[10px] uppercase tracking-wider">
                    Reference
                  </span>
                  <span className="font-mono text-base font-bold text-accent-cyan">
                    {singleAppointment.booking_reference}
                  </span>
                </div>

                <span
                  className={`px-3 py-1 text-[11px] font-semibold uppercase rounded-md ${
                    singleAppointment.status === 'Confirmed'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                      : singleAppointment.status === 'Completed'
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-red-950/60 text-red-400 border border-red-500/30'
                  }`}
                >
                  {singleAppointment.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-b border-theme-card">
                <div>
                  <span className="text-theme-muted block mb-0.5">Service</span>
                  <span className="text-theme-title font-medium text-sm">
                    {singleAppointment.service_title || 'Bespoke Grooming'}
                  </span>
                </div>
                <div>
                  <span className="text-theme-muted block mb-0.5">Barber Artisan</span>
                  <span className="text-accent-lime font-medium">
                    {singleAppointment.staff_name || 'Master Barber'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-b border-theme-card">
                <div>
                  <span className="text-theme-muted block mb-0.5">Date & Time</span>
                  <span className="text-theme-title font-medium">
                    {singleAppointment.date} · {singleAppointment.start_time}
                  </span>
                </div>
                <div>
                  <span className="text-theme-muted block mb-0.5">Duration & Price</span>
                  <div className="flex items-baseline gap-1.5 text-theme-title font-medium">
                    <span>{singleAppointment.duration} mins</span>
                    <span className="text-theme-muted">·</span>
                    <span className="font-bold text-accent-lime font-mono">
                      Rs. {singleAppointment.price?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-theme-muted">PKR</span>
                  </div>
                </div>
              </div>

              {/* Reschedule inline drawer */}
              {reschedulingId === singleAppointment.id ? (
                <div className="pt-4 border-t border-theme-card space-y-3 bg-theme-subtle p-4 rounded-xl">
                  <div className="font-semibold text-theme-title">Select New Date & Time</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      min={todayStr}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="bg-theme-main border border-theme-card rounded-lg p-2 text-theme-title text-xs"
                    />
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="bg-theme-main border border-theme-card rounded-lg p-2 text-theme-title text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleRescheduleSubmit(singleAppointment.id)}
                      className="px-4 py-2 btn-primary-action text-xs font-semibold uppercase rounded-lg"
                    >
                      Confirm New Time
                    </button>
                    <button
                      onClick={() => setReschedulingId(null)}
                      className="px-4 py-2 bg-theme-subtle text-theme-title text-xs rounded-lg border border-theme-card"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                singleAppointment.status === 'Confirmed' && (
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setReschedulingId(singleAppointment.id);
                        setNewDate(singleAppointment.date);
                        setNewTime(singleAppointment.start_time);
                      }}
                      className="text-xs uppercase tracking-wider text-accent-cyan hover:underline font-semibold"
                    >
                      Reschedule Slot
                    </button>

                    <button
                      onClick={() => handleCancelAppointment(singleAppointment.id)}
                      className="text-xs uppercase tracking-wider text-red-400 hover:text-red-300 font-semibold"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* List of Appointments (Phone Search) */}
          {appointmentsList.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs text-theme-muted">
                Found {appointmentsList.length} appointment(s)
              </div>
              {appointmentsList.map((appt) => (
                <div
                  key={appt.id}
                  className="glass-panel border border-theme-card p-4 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent-cyan">
                        {appt.booking_reference}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md ${
                          appt.status === 'Confirmed'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <div className="text-theme-title font-medium mt-1">
                      {appt.service_title || 'Service'}
                    </div>
                    <div className="text-theme-muted mt-0.5">
                      {appt.date} · {appt.start_time} · {appt.staff_name || 'Barber'}
                    </div>
                  </div>

                  {appt.status === 'Confirmed' && (
                    <button
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Book CTA if empty */}
          {!singleAppointment && appointmentsList.length === 0 && !isLoading && (
            <div className="p-8 text-center glass-panel border border-theme-card rounded-2xl">
              <Scissors className="w-8 h-8 text-accent-cyan mx-auto mb-3" />
              <h5 className="text-sm font-semibold text-theme-title mb-1">
                Looking to schedule fresh grooming?
              </h5>
              <p className="text-xs text-theme-muted mb-4 max-w-sm mx-auto">
                Select your service, preferred barber artisan and time slot in our smart booking system.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onBookNew();
                }}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider btn-primary-action rounded-xl"
              >
                Book An Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
