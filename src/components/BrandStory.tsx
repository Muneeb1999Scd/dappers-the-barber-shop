import React from 'react';
import { ShieldCheck, Sparkles, Scissors, Coffee, Clock } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section id="experience" className="py-24 bg-theme-main relative overflow-hidden transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Story Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 overflow-hidden rounded-2xl border border-theme-card shadow-2xl">
              <img
                src="/src/assets/images/salon_interior_luxury_1790150271262.jpg"
                alt="Interior architectural view of Dappers premium grooming lounge in Gulzar-e-Hijri, Karachi"
                className="w-full h-[480px] object-cover object-center filter brightness-90 hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-theme-main via-transparent to-transparent" />
            </div>

            {/* Inset highlight card */}
            <div className="absolute -bottom-6 -right-6 hidden sm:block glass-panel border border-cyan-500/40 p-6 rounded-2xl max-w-xs shadow-2xl z-20">
              <div className="text-accent-cyan text-xs uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-lime" />
                <span>Gulzar-e-Hijri Branch</span>
              </div>
              <p className="text-xs text-theme-body font-light leading-relaxed">
                A private sanctuary built for men who appreciate deliberate craftsmanship, calm ambience and sharp lines.
              </p>
            </div>
          </div>

          {/* Copy Column */}
          <div className="lg:col-span-6">
            <div className="prompt-pill mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>The Dappers Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight mb-6 text-balance">
              REFINED GROOMING CRAFTED WITHOUT COMPROMISE
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-theme-body font-light leading-relaxed mb-8">
              <p>
                Dappers is founded on a clear premise: every gentleman deserves grooming that feels personal, meticulously crafted and effortlessly dignified.
              </p>
              <p>
                Located in Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi, our lounge offers a respite from the rush of the city. Here, time slows down. You are greeted with genuine hospitality, seated in handcrafted leather chairs and attended to by barbers who listen carefully before they cut.
              </p>
              <p>
                Whether it is a surgical low taper, a traditional hot towel razor sculpt or an executive facial, our craft honors your unique aesthetic.
              </p>
            </div>

            {/* 4 Pillars of Experience */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-theme-card">
              <div>
                <h4 className="text-sm font-semibold tracking-wider uppercase text-theme-title mb-1 flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Precision Craft</span>
                </h4>
                <p className="text-xs text-theme-muted font-light">Master razor and scissor work.</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-wider uppercase text-theme-title mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-lime" />
                  <span>Medical Hygiene</span>
                </h4>
                <p className="text-xs text-theme-muted font-light">Autoclave blade sanitation.</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-wider uppercase text-theme-title mb-1 flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>VIP Lounge Comfort</span>
                </h4>
                <p className="text-xs text-theme-muted font-light">Espresso bar and acoustic calm.</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-wider uppercase text-theme-title mb-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-accent-lime" />
                  <span>Late Night Hours</span>
                </h4>
                <p className="text-xs text-theme-muted font-light">Open daily until 1:00 AM.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
