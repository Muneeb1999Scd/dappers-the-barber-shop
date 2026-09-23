import React from 'react';
import { Phone, MessageCircle, MapPin, Instagram, ShieldCheck, User, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { BusinessSettings } from '../types';

interface FooterProps {
  settings?: BusinessSettings;
  onOpenBooking: () => void;
  onOpenCustomerPortal: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenBooking,
  onOpenCustomerPortal,
  onOpenAdmin
}) => {
  const phone = settings?.phone || '0335 7792524';
  const address = settings?.address || 'W3VX+J98, Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi, Pakistan';

  return (
    <footer className="bg-theme-main border-t border-theme-card pt-16 pb-28 sm:pb-16 text-theme-muted text-xs transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Direct Appointment CTA Banner in Footer */}
        <div className="glass-panel border border-theme-glow p-6 sm:p-10 rounded-2xl mb-16 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-lime/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="prompt-pill mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Online Appointment System</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display text-theme-title font-medium">
              READY FOR THE GENTLEMAN STANDARD?
            </h3>
            <p className="text-xs sm:text-sm text-theme-body mt-1 max-w-xl font-light">
              Select your master barber, choose your service or ritual package and pick your preferred time slot. Instant confirmation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <button
              onClick={onOpenCustomerPortal}
              className="w-full sm:w-auto h-12 px-5 text-xs uppercase tracking-wider font-semibold btn-outline-action rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Lookup Booking</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto h-12 px-7 text-xs uppercase tracking-wider font-semibold btn-primary-action rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-theme-card">
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 text-accent-cyan font-bold text-sm">
                D
              </div>
              <span className="text-xl font-display tracking-[0.18em] text-theme-title uppercase font-semibold">
                DAPPERS
              </span>
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-accent-cyan font-semibold">
              The Gentleman Choice
            </div>
            <p className="text-xs text-theme-body font-light leading-relaxed max-w-sm pt-1">
              A private men grooming sanctuary located in Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi. Dedicated to uncompromised precision, clinical hygiene and masculine distinction.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs">
              <span className="text-accent-lime font-bold">4.9 / 5 Rating</span>
              <span className="text-theme-muted">|</span>
              <span className="text-theme-title font-medium">170 Verified Google Reviews</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-theme-title font-semibold mb-2">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-accent-cyan transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-accent-cyan transition-colors">
                  Services Catalogue
                </a>
              </li>
              <li>
                <a href="#packages" className="hover:text-accent-cyan transition-colors">
                  Gentleman Packages
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-accent-cyan transition-colors">
                  Lounge Philosophy
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-accent-cyan transition-colors">
                  Visual Archive
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-accent-cyan transition-colors">
                  Client Reviews
                </a>
              </li>
            </ul>
          </div>

          {/* Operating Hours Summary */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-theme-title font-semibold mb-2">
              Hours & Schedule
            </h4>
            <p className="text-xs text-theme-body font-light leading-relaxed">
              Open 7 days a week for morning, executive afternoon and late-night appointments.
            </p>
            <div className="pt-1">
              <span className="text-xs text-accent-lime font-mono block font-semibold">
                Daily: 11:00 AM - 01:00 AM
              </span>
              <span className="text-[11px] text-theme-muted mt-0.5 block">
                Last walk-in or booking at 12:30 AM
              </span>
            </div>
          </div>

          {/* Location & Support */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-theme-title font-semibold mb-2">
              Direct Contact
            </h4>
            <div className="space-y-2">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 hover:text-accent-cyan transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-accent-cyan" />
                <span className="font-mono">{phone}</span>
              </a>

              <a
                href="https://wa.me/923357792524"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-accent-lime hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Concierge</span>
              </a>

              <a
                href="https://www.instagram.com/salondapper"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-accent-cyan transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-accent-cyan" />
                <span>@salondapper</span>
              </a>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-theme-muted">
                <MapPin className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
                <span>Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright and admin slot link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-theme-muted">
          <div>
            &copy; {new Date().getFullYear()} Dappers Barber Lounge. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCustomerPortal}
              className="hover:text-accent-cyan transition-colors"
            >
              Lookup Existing Booking
            </button>
            <span>·</span>
            <button
              onClick={onOpenAdmin}
              className="hover:text-accent-lime transition-colors"
            >
              Management Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
