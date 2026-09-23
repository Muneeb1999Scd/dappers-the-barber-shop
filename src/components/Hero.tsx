import React, { useState } from 'react';
import { Star, Clock, MapPin, ArrowRight, Sparkles, Scissors, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BusinessSettings } from '../types';

interface HeroProps {
  settings?: BusinessSettings;
  onOpenBooking: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenBooking,
  onExploreServices
}) => {
  const [selectedQuickRitual, setSelectedQuickRitual] = useState<'haircut' | 'beard' | 'combo'>('haircut');

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-theme-main transition-colors duration-250">
      {/* Background Ambience with Oceanic Cyan Glow matching reference image */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Cinematic Background Image with dark grade */}
        <img
          src="/src/assets/images/hero_gentleman_lounge_1790150232790.jpg"
          alt="A gentleman seated in a luxury barber chair receiving styling at Dappers"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.1] dark:opacity-40 opacity-15 transition-opacity"
          referrerPolicy="no-referrer"
        />
        {/* Soft Radial Cyan Aura like reference image */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-accent-lime/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-main/60 to-theme-main" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center">
        {/* Reference Image Prompt-Style Pill Badge */}
        <div className="prompt-pill mb-6">
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Karachi Premier Grooming Lounge</span>
        </div>

        {/* Large Modern Headline with Lime Highlight matching image */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-medium text-theme-title tracking-tight leading-[1.08] mb-6 max-w-4xl text-balance">
          Master haircuts and styling — crafted for <span className="text-accent-lime font-semibold">your persona</span>
        </h1>

        {/* Supporting Copy (No Oxford commas before and) */}
        <p className="text-base sm:text-lg text-theme-body font-normal leading-relaxed max-w-2xl mb-8 text-balance">
          Precision tapers, straight-razor beard sculpting and restorative skin therapies executed by master barbers in Gulzar-e-Hijri.
        </p>

        {/* Interactive Quick-Booking Preview Card (Inspired directly by the reference image's card layout) */}
        <div className="w-full max-w-2xl glass-panel rounded-2xl p-5 sm:p-6 mb-10 text-left relative overflow-hidden border border-theme-glow shadow-2xl">
          {/* Card Top Tabs matching reference image */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-theme-card">
            <button
              onClick={() => setSelectedQuickRitual('haircut')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedQuickRitual === 'haircut'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-cyan-500/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-title'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Signature Haircut</span>
            </button>
            <button
              onClick={() => setSelectedQuickRitual('beard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedQuickRitual === 'beard'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-cyan-500/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-title'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Razor Beard Sculpt</span>
            </button>
            <button
              onClick={() => setSelectedQuickRitual('combo')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedQuickRitual === 'combo'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-cyan-500/40 shadow-sm'
                  : 'text-theme-muted hover:text-theme-title'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Executive Revival</span>
            </button>
          </div>

          {/* Quick Input Bar matching reference image input */}
          <div className="bg-theme-subtle/80 rounded-xl p-3.5 sm:p-4 border border-theme-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-xs uppercase tracking-wider text-accent-cyan font-mono block mb-1">
                {selectedQuickRitual === 'haircut' && 'Master Barber Taper & Fade · 45 Mins · Rs. 1,200'}
                {selectedQuickRitual === 'beard' && 'Royal Hot Towel & Straight Razor · 30 Mins · Rs. 800'}
                {selectedQuickRitual === 'combo' && 'Full Haircut + Beard + Charcoal Detox Facial · Rs. 4,500'}
              </span>
              <p className="text-xs sm:text-sm text-theme-body font-light">
                {selectedQuickRitual === 'haircut' && 'Tailored scissor shaping and skin fade suited to your face structure.'}
                {selectedQuickRitual === 'beard' && 'Dual hot towel steam infusion, single-blade razor line-up and organic balm.'}
                {selectedQuickRitual === 'combo' && 'The complete gentleman transformation with zero wait time guarantee.'}
              </p>
            </div>

            <button
              onClick={onOpenBooking}
              className="btn-primary-action px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 shrink-0 shadow-lg active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Ritual</span>
            </button>
          </div>
        </div>

        {/* Clean Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-60 h-12 px-6 text-xs font-semibold uppercase tracking-wider btn-primary-action rounded-xl shadow-xl flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>Book Appointment</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <button
            onClick={onExploreServices}
            className="w-full sm:w-60 h-12 px-6 text-xs font-semibold uppercase tracking-wider text-theme-title hover:text-accent-cyan border border-theme-card hover:border-cyan-500/50 rounded-xl bg-theme-subtle/60 backdrop-blur-sm flex items-center justify-center transition-all"
          >
            View Services & Prices
          </button>
        </div>

        {/* Clean Trust & Location Strip */}
        <div className="pt-6 border-t border-theme-card w-full max-w-3xl flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs tracking-wider text-theme-muted">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-accent-lime">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-accent-lime text-accent-lime" />
              ))}
            </div>
            <span className="font-semibold text-theme-title tabular-nums">4.9 / 5</span>
            <span className="text-theme-muted">170 Google Reviews</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-theme-title">Gulzar-e-Hijri Block 1/1, Karachi</span>
          </div>

          <div className="flex items-center gap-2 text-accent-lime">
            <Clock className="w-3.5 h-3.5 text-accent-lime" />
            <span className="text-theme-title font-medium">Open Daily Until 1:00 AM</span>
          </div>
        </div>
      </div>
    </section>
  );
};
