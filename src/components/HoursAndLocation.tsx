import React from 'react';
import { Phone, MessageCircle, Navigation, Clock, MapPin, Instagram, Calendar } from 'lucide-react';
import { BusinessHour, BusinessSettings } from '../types';

interface HoursAndLocationProps {
  hours: BusinessHour[];
  settings?: BusinessSettings;
  onOpenBooking: () => void;
}

export const HoursAndLocation: React.FC<HoursAndLocationProps> = ({
  hours,
  settings,
  onOpenBooking
}) => {
  const phone = settings?.phone || '0335 7792524';
  const address = settings?.address || 'W3VX+J98, Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi, Pakistan';
  const googleMapsUrl = settings?.google_maps_url || 'https://maps.google.com/?q=W3VX%2BJ98,+Gulzar-e-Hijri+Block+1/1,+Metrovil+Colony,+Karachi';
  const instagramUrl = settings?.instagram || 'https://www.instagram.com/salondapper';
  const instagramHandle = settings?.instagram_handle || '@salondapper';

  // Format hours cleanly
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedHours = [...hours].sort((a, b) => daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week));

  const format12h = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const ampm = (h >= 12 && h < 24) || h === 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${mStr} ${ampm}`;
  };

  return (
    <section id="contact" className="py-24 bg-theme-main relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="prompt-pill mb-3">
            <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Hours & Location</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight">
            WHERE REFINEMENT RESIDES
          </h2>
          <p className="text-theme-muted mt-2 text-sm sm:text-base font-normal">
            Conveniently situated in Gulzar-e-Hijri, Karachi. Open daily until 1:00 AM for evening and late-night grooming rituals.
          </p>
        </div>

        {/* 2-Column Grid: Hours & Contact Details + Map Embed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Info Card */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-2xl flex flex-col justify-between border border-theme-card">
            <div>
              {/* Live Status indicator */}
              <div className="flex items-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider text-accent-lime">
                <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                <span>Open Daily Until 1:00 AM</span>
              </div>

              {/* Operating Hours Table */}
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-widest text-theme-muted font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Salon Operating Hours</span>
                </h3>

                <div className="space-y-2.5">
                  {sortedHours.map((h) => (
                    <div
                      key={h.day_of_week}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-theme-card"
                    >
                      <span className="font-medium text-theme-title">{h.day_of_week}</span>
                      <span className="font-mono text-accent-cyan font-medium">
                        {h.is_open ? `${format12h(h.open_time)} - ${format12h(h.close_time)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Location Address */}
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-widest text-theme-muted font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Physical Address</span>
                </h3>
                <p className="text-sm text-theme-body font-light leading-relaxed mb-3">
                  {address}
                </p>
                <div className="text-xs text-accent-cyan font-mono">
                  Plus Code: W3VX+J98 Karachi
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-theme-card">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider btn-primary-action rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-center"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions On Google Maps</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wider btn-outline-action rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Call Salon</span>
                </a>

                <button
                  onClick={onOpenBooking}
                  className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wider btn-outline-action rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5 text-accent-lime" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Google Map & Exterior View */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-theme-card shadow-2xl relative glass-panel">
              <iframe
                title="Dappers Barber Salon Location in Gulzar-e-Hijri Karachi"
                src="https://maps.google.com/maps?q=W3VX%2BJ98,+Gulzar-e-Hijri+Block+1/1,+Metrovil+Colony,+Karachi&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'contrast(1.05)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Direct Connect Strip */}
            <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-theme-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-cyan/15 flex items-center justify-center text-accent-cyan font-semibold text-xs">
                  PK
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-theme-muted font-medium">Customer Concierge</div>
                  <div className="text-sm font-semibold text-theme-title font-mono">{phone}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`https://wa.me/923357792524?text=${encodeURIComponent('Hello Dappers, I would like to inquire about appointments.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-lime hover:underline font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Priority</span>
                </a>

                <span className="text-theme-muted">·</span>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-cyan hover:underline font-semibold"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{instagramHandle}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
