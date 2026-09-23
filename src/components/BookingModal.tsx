import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Download,
  Share2,
  Scissors,
  Sparkles
} from 'lucide-react';
import { Service, ServicePackage, Staff, TimeSlot } from '../types';
import { api } from '../services/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  packages: ServicePackage[];
  staff: Staff[];
  preselectedService?: Service | null;
  preselectedPackage?: ServicePackage | null;
  onBookingComplete?: (ref: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  packages,
  staff,
  preselectedService,
  preselectedPackage,
  onBookingComplete
}) => {
  // Steps: 1: Service, 2: Barber, 3: Date, 4: Time, 5: Customer Info, 6: Summary, 7: Confirmation
  const [step, setStep] = useState<number>(1);

  // Form selections
  const [serviceType, setServiceType] = useState<'service' | 'package'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Availability query state
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [dayClosedReason, setDayClosedReason] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Initialize with preselected values
  useEffect(() => {
    if (preselectedService) {
      setServiceType('service');
      setSelectedService(preselectedService);
      setSelectedPackage(null);
      setStep(2); // Jump to Barber selection
    } else if (preselectedPackage) {
      setServiceType('package');
      setSelectedPackage(preselectedPackage);
      setSelectedService(null);
      setStep(2);
    }
  }, [preselectedService, preselectedPackage]);

  // Set default date to today
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [selectedDate]);

  // Fetch slots whenever date, service/package, or barber changes
  useEffect(() => {
    if (!selectedDate || (step !== 4 && step !== 3)) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setDayClosedReason(null);
      setSelectedSlot(null);
      try {
        const res = await api.getAvailability({
          date: selectedDate,
          service_id: selectedService?.id,
          package_id: selectedPackage?.id,
          staff_id: selectedBarberId
        });

        if (!isMounted) return;

        if (!res.isOpen) {
          setDayClosedReason(res.reason || "We are closed on this day.");
          setAvailableSlots([]);
        } else {
          setAvailableSlots(res.slots || []);
          if (res.slots.length === 0) {
            setDayClosedReason('Sorry, there are no appointments available for this date.');
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setDayClosedReason('Unable to load schedule. Please select another date.');
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedService, selectedPackage, selectedBarberId, step]);

  if (!isOpen) return null;

  // Selected item title, price, duration
  const activeTitle = selectedService ? selectedService.name : selectedPackage ? selectedPackage.name : 'Service';
  const activeDuration = selectedService ? selectedService.duration : selectedPackage ? selectedPackage.duration : 45;
  const activePrice = selectedService ? selectedService.price : selectedPackage ? selectedPackage.price : 1200;

  const selectedBarberObj = staff.find(s => s.id === selectedBarberId);
  const barberDisplayName = selectedBarberId === 'any' ? 'Any Available Master Barber' : selectedBarberObj?.name || 'Selected Barber';

  // Handle final submission
  const handleConfirmBooking = async () => {
    setBookingError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        service_id: selectedService?.id,
        package_id: selectedPackage?.id,
        staff_id: selectedBarberId,
        date: selectedDate,
        time: selectedSlot!.time,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        notes: customerNotes.trim() || undefined
      };

      const result = await api.createAppointment(payload);
      setConfirmedBooking(result);
      setStep(7); // Show confirmation step
      if (onBookingComplete) onBookingComplete(result.booking_reference);
    } catch (err: any) {
      setBookingError(err.message || 'This time was just booked. Please select another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate .ics calendar file
  const downloadCalendarFile = () => {
    if (!confirmedBooking) return;
    const dateFormatted = confirmedBooking.date.replace(/-/g, '');
    const [h, m] = confirmedBooking.time.split(':');
    const startIso = `${dateFormatted}T${h}${m}00`;

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dappers The Gentleman Choice//Appointment//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Dappers: ${confirmedBooking.service_name}`,
      `DESCRIPTION:Appointment Reference: ${confirmedBooking.booking_reference}\\nBarber: ${confirmedBooking.barber_name}\\nLocation: Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi\\nPhone: 0335 7792524`,
      'LOCATION:W3VX+J98, Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi, Pakistan',
      `DTSTART:${startIso}`,
      `DURATION:PT${confirmedBooking.duration}M`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Dappers-${confirmedBooking.booking_reference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Min selectable date = today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-theme-main border border-theme-card rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-theme-card flex items-center justify-between glass-panel">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20">
              <span className="font-display text-sm font-bold text-accent-cyan">D</span>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-accent-cyan font-semibold">
                Dappers Appointment Booking
              </div>
              <h3 className="text-lg sm:text-xl font-display font-medium text-theme-title">
                {step === 1 && 'Select Service or Package'}
                {step === 2 && 'Select Master Barber'}
                {step === 3 && 'Choose Reservation Date'}
                {step === 4 && 'Choose Time Slot'}
                {step === 5 && 'Gentleman Contact Details'}
                {step === 6 && 'Review & Confirm'}
                {step === 7 && 'Appointment Confirmed'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-title rounded-xl hover:bg-theme-subtle transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* STEP 01: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-display text-theme-title mb-1">
                  Select Service or Package
                </h4>
                <p className="text-xs text-theme-muted">
                  Choose your desired grooming treatment or curated ritual.
                </p>
              </div>

              {/* Service vs Package Toggle */}
              <div className="flex border-b border-theme-card gap-4">
                <button
                  onClick={() => setServiceType('service')}
                  className={`pb-2.5 px-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                    serviceType === 'service'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-theme-muted hover:text-theme-title'
                  }`}
                >
                  Individual Services
                </button>
                <button
                  onClick={() => setServiceType('package')}
                  className={`pb-2.5 px-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                    serviceType === 'package'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-theme-muted hover:text-theme-title'
                  }`}
                >
                  Curated Packages
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {serviceType === 'service' ? (
                  services.map((srv) => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedService(srv);
                          setSelectedPackage(null);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-accent-cyan/15 border-cyan-500 shadow-sm'
                            : 'glass-panel border-theme-card hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="pr-4">
                          <span className="text-[10px] uppercase tracking-widest text-accent-cyan block">
                            {srv.category}
                          </span>
                          <div className="text-sm font-semibold text-theme-title mt-0.5">
                            {srv.name}
                          </div>
                          <div className="text-xs text-theme-body mt-1 line-clamp-1">
                            {srv.description}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-[11px] font-bold text-accent-cyan uppercase">Rs.</span>
                            <span className="text-base font-bold font-mono text-accent-lime tabular-nums">
                              {srv.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-theme-muted tabular-nums mt-0.5">
                            {srv.duration} mins
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setSelectedService(null);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-accent-cyan/15 border-cyan-500 shadow-sm'
                            : 'glass-panel border-theme-card hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="pr-4">
                          <span className="text-[10px] uppercase tracking-widest text-accent-cyan block">
                            Curated Ritual
                          </span>
                          <div className="text-sm font-semibold text-theme-title mt-0.5">
                            {pkg.name}
                          </div>
                          <div className="text-xs text-theme-body mt-1 line-clamp-1">
                            {pkg.description}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-[11px] font-bold text-accent-cyan uppercase">Rs.</span>
                            <span className="text-base font-bold font-mono text-accent-lime tabular-nums">
                              {pkg.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-theme-muted tabular-nums mt-0.5">
                            {pkg.duration} mins
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 02: SELECT BARBER */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-display text-theme-title mb-1">
                  Select Barber Artisan
                </h4>
                <p className="text-xs text-theme-muted">
                  Choose a preferred stylist or let us pair you with the first available artisan.
                </p>
              </div>

              <div className="space-y-3">
                {/* Any Available Barber Option */}
                <div
                  onClick={() => setSelectedBarberId('any')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedBarberId === 'any'
                      ? 'bg-accent-cyan/15 border-cyan-500 shadow-sm'
                      : 'glass-panel border-theme-card hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-cyan/15 flex items-center justify-center text-accent-cyan">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-theme-title">
                        Any Available Barber
                      </div>
                      <div className="text-xs text-theme-muted">
                        Fastest availability and flexible scheduling
                      </div>
                    </div>
                  </div>
                  {selectedBarberId === 'any' && (
                    <CheckCircle className="w-5 h-5 text-accent-lime" />
                  )}
                </div>

                {/* Specific Staff */}
                {staff.map((barber) => {
                  const isSelected = selectedBarberId === barber.id;
                  return (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedBarberId(barber.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-accent-cyan/15 border-cyan-500 shadow-sm'
                          : 'glass-panel border-theme-card hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={barber.photo_url || '/src/assets/images/service_precision_haircut_1790150247157.jpg'}
                          alt={barber.name}
                          className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-sm font-semibold text-theme-title">
                            {barber.name}
                          </div>
                          <div className="text-xs text-accent-cyan font-medium">
                            {barber.role}
                          </div>
                          <div className="text-[11px] text-theme-muted line-clamp-1 mt-0.5">
                            {barber.specialties}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-accent-lime" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 03: SELECT DATE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-display text-theme-title mb-1">
                  Select Appointment Date
                </h4>
                <p className="text-xs text-theme-muted">
                  Dappers Gulzar-e-Hijri is open daily until 1:00 AM.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-theme-card space-y-4">
                <label className="block text-xs uppercase tracking-wider text-theme-muted font-medium">
                  Calendar Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme-card rounded-xl px-4 py-3 text-theme-title text-sm focus:outline-none focus:border-cyan-500"
                />

                <div className="flex items-center gap-2 text-xs text-theme-muted pt-2">
                  <CalendarIcon className="w-4 h-4 text-accent-cyan" />
                  <span>Selected Date: {selectedDate || 'Today'}</span>
                </div>
              </div>

              {/* Quick Date Shortcuts (Next 4 days) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {[0, 1, 2, 3].map((offset) => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const iso = d.toISOString().split('T')[0];
                  const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const isCur = selectedDate === iso;

                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      className={`p-2.5 text-xs text-center rounded-xl border transition-colors ${
                        isCur
                          ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan font-semibold'
                          : 'border-theme-card bg-theme-subtle text-theme-muted hover:text-theme-title'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 04: SELECT TIME */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-lg font-display text-theme-title mb-1">
                    Select Time Slot
                  </h4>
                  <p className="text-xs text-theme-muted">
                    Calculated for {activeDuration} min duration · {selectedDate}
                  </p>
                </div>

                <div className="text-xs text-theme-muted">
                  Barber: <span className="text-accent-cyan font-medium">{barberDisplayName}</span>
                </div>
              </div>

              {isLoadingSlots ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-2 border-accent-lime border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-theme-muted">
                    Checking live salon availability...
                  </p>
                </div>
              ) : dayClosedReason ? (
                <div className="p-8 text-center glass-panel border border-theme-card rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-accent-cyan mx-auto mb-3" />
                  <p className="text-sm text-theme-title font-medium mb-1">
                    {dayClosedReason}
                  </p>
                  <p className="text-xs text-theme-muted mb-4">
                    Please choose another date or contact our team directly at 0335 7792524.
                  </p>
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 text-xs uppercase tracking-wider btn-outline-action rounded-xl"
                  >
                    Change Date
                  </button>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-8 text-center glass-panel border border-theme-card rounded-2xl">
                  <Clock className="w-8 h-8 text-theme-muted mx-auto mb-3" />
                  <p className="text-sm text-theme-title font-medium mb-1">
                    No open slots remaining on this day.
                  </p>
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 text-xs uppercase tracking-wider btn-outline-action rounded-xl mt-3"
                  >
                    Select Another Date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-2 text-center rounded-xl border transition-all ${
                          isSelected
                            ? 'btn-primary-action font-bold shadow-md'
                            : 'glass-panel border-theme-card text-theme-body hover:border-cyan-500/40 hover:text-theme-title'
                        }`}
                      >
                        <span className="text-xs tracking-wider block tabular-nums">
                          {slot.displayTime}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 05: CUSTOMER DETAILS */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-display text-theme-title mb-1">
                  Guest Information
                </h4>
                <p className="text-xs text-theme-muted">
                  Please provide your contact details to receive booking confirmation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-medium mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Siddiqui"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-theme-subtle border border-theme-card rounded-xl px-4 py-3 text-theme-title text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-medium mb-1.5">
                    Mobile Phone Number (WhatsApp preferred) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0335 XXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-theme-subtle border border-theme-card rounded-xl px-4 py-3 text-theme-title text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-medium mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-theme-subtle border border-theme-card rounded-xl px-4 py-3 text-theme-title text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-medium mb-1.5">
                    Styling Notes / Preferences (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any specific instructions or preferences for your barber..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-theme-subtle border border-theme-card rounded-xl px-4 py-2.5 text-theme-title text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 06: BOOKING SUMMARY */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-display text-theme-title mb-1">
                  Review & Confirm Reservation
                </h4>
                <p className="text-xs text-theme-muted">
                  Please verify your appointment parameters before scheduling.
                </p>
              </div>

              {bookingError && (
                <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="glass-panel border border-theme-card rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex justify-between py-2 border-b border-theme-card">
                  <span className="text-theme-muted">Service:</span>
                  <span className="font-semibold text-theme-title">{activeTitle}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-theme-card">
                  <span className="text-theme-muted">Barber:</span>
                  <span className="font-semibold text-accent-cyan">{barberDisplayName}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-theme-card">
                  <span className="text-theme-muted">Date:</span>
                  <span className="font-semibold text-theme-title">{selectedDate}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-theme-card">
                  <span className="text-theme-muted">Time:</span>
                  <span className="font-semibold text-theme-title tabular-nums">
                    {selectedSlot?.displayTime}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-theme-card">
                  <span className="text-theme-muted">Duration:</span>
                  <span className="text-theme-body tabular-nums">{activeDuration} minutes</span>
                </div>

                <div className="flex justify-between py-2 border-b border-theme-card">
                  <span className="text-theme-muted">Client:</span>
                  <span className="font-semibold text-theme-title">
                    {customerName} ({customerPhone})
                  </span>
                </div>

                <div className="flex justify-between py-3 pt-4 border-t border-theme-card text-sm items-center">
                  <span className="font-medium text-theme-title uppercase tracking-wider">
                    Total Amount:
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold uppercase text-accent-cyan bg-accent-cyan/15 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      Rs.
                    </span>
                    <span className="font-mono font-bold text-xl sm:text-2xl text-accent-lime tabular-nums">
                      {activePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-theme-muted font-medium">PKR</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-theme-muted leading-relaxed">
                By confirming, you agree to our cancellation policy. Cancellations or rescheduling are welcomed up to 2 hours prior to service.
              </div>
            </div>
          )}

          {/* STEP 07: CONFIRMATION SCREEN */}
          {step === 7 && confirmedBooking && (
            <div className="text-center py-4 space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-accent-lime/15 border border-accent-lime/40 rounded-full flex items-center justify-center mx-auto text-accent-lime">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-accent-cyan font-semibold block mb-1">
                  Appointment Confirmed
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-medium text-theme-title">
                  WE LOOK FORWARD TO SERVING YOU.
                </h3>
              </div>

              <div className="glass-panel border border-cyan-500/30 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-theme-card">
                  <span className="text-theme-muted">Booking Reference:</span>
                  <span className="font-mono text-base font-bold text-accent-cyan tracking-widest">
                    {confirmedBooking.booking_reference}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-theme-muted">Service:</span>
                  <span className="text-theme-title font-medium">{confirmedBooking.service_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-theme-muted">Barber:</span>
                  <span className="text-accent-lime font-medium">{confirmedBooking.barber_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-theme-muted">Date & Time:</span>
                  <span className="text-theme-title font-medium">
                    {confirmedBooking.date} · {confirmedBooking.time_formatted}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-theme-muted">Duration:</span>
                  <span className="text-theme-body">{confirmedBooking.duration} mins</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-theme-muted">Client:</span>
                  <span className="text-theme-title">{confirmedBooking.customer_name}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-y border-theme-card">
                  <span className="text-theme-muted">Total Price:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-accent-cyan">Rs.</span>
                    <span className="font-mono font-bold text-sm sm:text-base text-accent-lime tabular-nums">
                      {confirmedBooking.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-theme-muted">PKR</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-theme-card">
                  <span className="text-theme-muted">Location:</span>
                  <span className="text-theme-body text-right">Gulzar-e-Hijri Block 1/1, Karachi</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-theme-card text-[10px] text-theme-muted">
                  <span>Cloud Database:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>Saved to Supabase</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={confirmedBooking.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider font-semibold btn-primary-action rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Details</span>
                </a>

                <button
                  onClick={downloadCalendarFile}
                  className="w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider font-semibold btn-outline-action rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-accent-cyan" />
                  <span>Add To Calendar</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="text-xs text-theme-muted hover:text-theme-title underline"
                >
                  Done & Return to Homepage
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation (Steps 1 to 6) */}
        {step < 7 && (
          <div className="p-4 sm:p-5 border-t border-theme-card flex items-center justify-between glass-panel">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="h-11 px-4 text-xs uppercase tracking-wider font-semibold text-theme-muted hover:text-theme-title flex items-center gap-1.5 transition-colors border border-theme-card rounded-xl bg-theme-subtle"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                disabled={!selectedService && !selectedPackage}
                onClick={() => setStep(2)}
                className="h-11 px-6 text-xs uppercase tracking-wider font-semibold btn-primary-action disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-[0.98]"
              >
                <span>Choose Barber</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="h-11 px-6 text-xs uppercase tracking-wider font-semibold btn-primary-action rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-[0.98]"
              >
                <span>Select Date</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                disabled={!selectedDate}
                onClick={() => setStep(4)}
                className="h-11 px-6 text-xs uppercase tracking-wider font-semibold btn-primary-action disabled:opacity-40 rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-[0.98]"
              >
                <span>Find Slots</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(5)}
                className="h-11 px-6 text-xs uppercase tracking-wider font-semibold btn-primary-action disabled:opacity-40 rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-[0.98]"
              >
                <span>Your Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 5 && (
              <button
                disabled={!customerName.trim() || !customerPhone.trim()}
                onClick={() => setStep(6)}
                className="h-11 px-6 text-xs uppercase tracking-wider font-semibold btn-primary-action disabled:opacity-40 rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-[0.98]"
              >
                <span>Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 6 && (
              <button
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="h-11 px-8 text-xs uppercase tracking-wider font-bold btn-primary-action disabled:opacity-50 rounded-xl transition-all flex items-center gap-2 shadow-lg active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span>Securing Reservation...</span>
                ) : (
                  <>
                    <span>Confirm & Book</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
