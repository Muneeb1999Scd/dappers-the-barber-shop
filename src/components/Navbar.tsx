import React, { useState, useEffect } from 'react';
import { Menu, X, User, Sun, Moon, Sparkles } from 'lucide-react';
import { BusinessSettings } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  settings?: BusinessSettings;
  onOpenBooking: () => void;
  onOpenCustomerPortal: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenCustomerPortal,
  onOpenAdmin
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'glass-panel py-3 shadow-xl'
            : 'bg-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* FAR LEFT: Brand Logo matching high-tech minimal aesthetic */}
            <div className="flex items-center shrink-0">
              <a href="#" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 group-hover:border-accent-lime transition-all duration-300">
                  <span className="font-display text-lg font-bold text-accent-cyan group-hover:text-accent-lime transition-colors">
                    D
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl font-display tracking-[0.18em] text-theme-title group-hover:text-accent-cyan transition-colors font-semibold leading-none">
                      DAPPERS
                    </span>
                    <Sparkles className="w-3 h-3 text-accent-lime" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.28em] text-accent-cyan font-medium mt-1">
                    The Gentleman Choice
                  </span>
                </div>
              </a>
            </div>

            {/* CENTER: Navigation Links */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-7 text-[11px] xl:text-xs uppercase tracking-widest text-theme-muted font-medium whitespace-nowrap min-w-0">
              <a href="#" className="hover:text-accent-cyan transition-colors py-1">
                Home
              </a>
              <a href="#services" className="hover:text-accent-cyan transition-colors py-1">
                Services
              </a>
              <a href="#packages" className="hover:text-accent-cyan transition-colors py-1">
                Packages
              </a>
              <a href="#experience" className="hover:text-accent-cyan transition-colors py-1">
                Lounge
              </a>
              <a href="#gallery" className="hover:text-accent-cyan transition-colors py-1">
                Gallery
              </a>
              <a href="#reviews" className="hover:text-accent-cyan transition-colors py-1">
                Reviews
              </a>
              <a href="#contact" className="hover:text-accent-cyan transition-colors py-1">
                Location
              </a>
            </nav>

            {/* FAR RIGHT: Theme Toggle & Actions */}
            <div className="flex items-center justify-end shrink-0 gap-2 sm:gap-3">
              {/* Theme Toggle Button (Light/Dark Mode) */}
              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="p-2 rounded-lg border border-theme-card bg-theme-subtle text-theme-title hover:text-accent-cyan hover:border-cyan-500/40 transition-all duration-200"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-accent-lime" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-600" />
                )}
              </button>

              {/* Lookup Booking */}
              <button
                onClick={onOpenCustomerPortal}
                className="hidden xl:flex items-center gap-1.5 text-xs tracking-wider text-theme-body hover:text-accent-cyan transition-colors py-2 px-3 border border-theme-card rounded-lg bg-theme-subtle whitespace-nowrap"
                title="Lookup or Reschedule Existing Appointment"
              >
                <User className="w-3.5 h-3.5 text-accent-cyan" />
                <span>My Booking</span>
              </button>

              {/* Book Appointment CTA */}
              <button
                onClick={onOpenBooking}
                className="px-4 sm:px-5 py-2.5 text-xs font-semibold uppercase tracking-wider btn-primary-action rounded-lg shadow-md whitespace-nowrap active:scale-[0.98]"
              >
                Book Appointment
              </button>

              {/* Mobile / Tablet menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-theme-title hover:text-accent-cyan p-1.5 rounded-lg hover:bg-theme-subtle transition-colors ml-1"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-theme-main/98 backdrop-blur-2xl pt-24 px-6 pb-8 flex flex-col justify-between lg:hidden animate-fade-in overflow-y-auto">
          <div className="flex flex-col gap-4 text-base font-medium tracking-wide max-w-md mx-auto w-full">
            {/* Mobile Theme Switcher Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-theme-card bg-theme-subtle mb-2">
              <span className="text-xs uppercase tracking-wider text-theme-muted font-medium">Appearance</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-xs font-medium text-theme-title py-1 px-3 rounded-lg border border-theme-card bg-theme-card"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-accent-lime" />
                    <span>Dark Theme</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-cyan-600" />
                    <span>Light Theme</span>
                  </>
                )}
              </button>
            </div>

            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              Home
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              Services
            </a>
            <a
              href="#packages"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              Gentleman Packages
            </a>
            <a
              href="#experience"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              The Dappers Lounge
            </a>
            <a
              href="#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              Lounge Gallery
            </a>
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              Verified Reviews
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-theme-title hover:text-accent-cyan border-b border-theme-card pb-2 transition-colors"
            >
              Location & Hours
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCustomerPortal();
              }}
              className="flex items-center gap-2 text-sm text-theme-body pt-2 hover:text-accent-cyan text-left"
            >
              <User className="w-4 h-4 text-accent-cyan" />
              <span>Lookup or Reschedule Appointment</span>
            </button>
          </div>

          <div className="pt-6 max-w-md mx-auto w-full">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3.5 text-xs font-semibold uppercase tracking-widest btn-primary-action rounded-xl text-center shadow-lg"
            >
              Book An Appointment
            </button>
            <p className="text-center text-xs text-theme-muted mt-3">
              Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi
            </p>
          </div>
        </div>
      )}
    </>
  );
};
