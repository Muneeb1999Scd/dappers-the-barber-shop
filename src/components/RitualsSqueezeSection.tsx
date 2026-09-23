import React from 'react';
import { SqueezeCarousel, type SqueezeSlide } from '@/components/ui/carousel-squeeze';
import { Sparkles, Scissors, Clock, ShieldCheck, Flame } from 'lucide-react';
import { Service, ServicePackage } from '../types';

interface RitualsSqueezeSectionProps {
  services: Service[];
  packages: ServicePackage[];
  onOpenBooking: (service?: Service, pkg?: ServicePackage) => void;
}

export const RitualsSqueezeSection: React.FC<RitualsSqueezeSectionProps> = ({
  services,
  packages,
  onOpenBooking,
}) => {
  // Find matching services to wire into one-click booking
  const haircutService = services.find(s => s.category === 'HAIRCUTS' || s.name.toLowerCase().includes('fade'));
  const beardService = services.find(s => s.category === 'BEARD' || s.name.toLowerCase().includes('shave') || s.name.toLowerCase().includes('sculpt'));
  const facialService = services.find(s => s.category === 'FACIALS' || s.name.toLowerCase().includes('charcoal'));
  const revivalPkg = packages.find(p => p.name.toLowerCase().includes('revival') || p.name.toLowerCase().includes('signature'));

  const slides: SqueezeSlide[] = [
    {
      id: 'haircut',
      title: 'Precision Taper & Master Fade Craft',
      description: 'Architectural skin fades, scissor sculpting and bespoke texture tailored strictly to your facial profile and hairline.',
      image: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      imageAlt: 'Master barber delivering a sharp taper fade haircut at Dappers Karachi',
      overlay: (
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <Scissors className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white">Signature Haircut</span>
        </div>
      ),
      action: 'Book Haircut (Rs. 1,200)',
      onAction: () => onOpenBooking(haircutService),
    },
    {
      id: 'shave',
      title: 'Royal Hot-Towel Razor Shave & Beard Sculpt',
      description: 'Dual hot towel steam infusion, artisanal sandalwood lather, straight razor line-up and ice-cold compress soothing.',
      image: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      imageAlt: 'Hot towel straight-razor shave and beard styling ritual',
      overlay: (
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <Flame className="w-3.5 h-3.5 text-accent-lime" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white">Royal Shave Ritual</span>
        </div>
      ),
      action: 'Reserve Shave (Rs. 800)',
      onAction: () => onOpenBooking(beardService),
    },
    {
      id: 'facial',
      title: 'Deep Charcoal Detox Facial & Skin Purifying',
      description: 'Active steam pore extraction, cold compress and high-frequency cellular toning designed specifically for Karachi climate.',
      image: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      imageAlt: 'Gentleman receiving charcoal detox skin therapy',
      overlay: (
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white">Skin Therapy</span>
        </div>
      ),
      action: 'Book Facial (Rs. 2,500)',
      onAction: () => onOpenBooking(facialService),
    },
    {
      id: 'lounge',
      title: 'The Gentleman Lounge & Executive Suites',
      description: 'Plush hydraulic reclining chairs, ambient acoustics, complimentary espresso and late-night appointments open until 1:00 AM.',
      image: '/src/assets/images/salon_interior_luxury_1790150271262.jpg',
      imageAlt: 'Dappers VIP grooming lounge in Gulzar-e-Hijri',
      overlay: (
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <Clock className="w-3.5 h-3.5 text-accent-lime" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white">VIP Suite · Till 1 AM</span>
        </div>
      ),
      action: 'Schedule Any Service',
      onAction: () => onOpenBooking(),
    },
    {
      id: 'package',
      title: 'The Executive Revival Complete Grooming Combo',
      description: 'Full-service transformation: Precision Cut, Beard Sculpting, Charcoal Detox Facial and Acupressure Scalp & Neck Therapy.',
      image: '/src/assets/images/hero_gentleman_lounge_1790150232790.jpg',
      imageAlt: 'The Executive Revival grooming package setup',
      overlay: (
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5 text-accent-lime" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white">Royale Package</span>
        </div>
      ),
      action: 'Book Executive Package',
      onAction: () => onOpenBooking(undefined, revivalPkg),
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-theme-main relative overflow-hidden border-b border-theme-card transition-colors duration-250">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="prompt-pill mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Interactive Rituals Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight">
              EXPERIENCE THE DAPPERS TOUCH
            </h2>
            <p className="text-sm sm:text-base text-theme-muted mt-2.5 leading-relaxed">
              Hover or tap across our signature rituals below. Watch the interactive slat animation reveal each curated discipline crafted by our master barbers in Gulzar-e-Hijri.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-accent-cyan font-mono shrink-0">
            <span className="hidden sm:inline-block">Swipe or tap slats to expand</span>
            <span className="w-2 h-2 rounded-full bg-accent-lime animate-ping" />
          </div>
        </div>

        {/* The Animated Squeeze Carousel with Electric Lime / Cyan accents */}
        <div className="glass-panel border border-theme-card rounded-2xl p-4 sm:p-7 shadow-2xl backdrop-blur-md">
          <SqueezeCarousel
            slides={slides}
            height="clamp(260px, 38cqi, 430px)"
            radius={12}
            gap={14}
            slatGap={8}
            slatWidth={14}
            duration={850}
            hoverGrow={true}
            autoplay={true}
            interval={5500}
            controls={true}
            accent="#a3e635"
            accentForeground="#060b14"
            label="Dappers Signature Grooming Rituals"
          />
        </div>
      </div>
    </section>
  );
};
