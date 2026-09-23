import React, { useState } from 'react';
import { Clock, ArrowRight, Sparkles, Scissors } from 'lucide-react';
import { Service } from '../types';

interface ServicesSectionProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = ['ALL', 'HAIR', 'BEARD', 'FACIALS', 'MASSAGE', 'HANDS & FEET'];

  const filteredServices = activeCategory === 'ALL'
    ? services
    : services.filter(s => s.category.toUpperCase() === activeCategory);

  // Editorial showcase
  const editorialFeatured = [
    {
      num: '01',
      title: 'PRECISION HAIR',
      description: 'Architectural scissor cutting, low-drop tapers and tailored texturing suited to your head shape.',
      image: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      category: 'HAIR'
    },
    {
      num: '02',
      title: 'BEARD SCULPT & SHAVE',
      description: 'Double hot towel steam therapy, straight razor contouring and organic sandalwood finish.',
      image: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      category: 'BEARD'
    },
    {
      num: '03',
      title: 'CHARCOAL DETOX FACIAL',
      description: 'Gentleman skin purification, pore extraction, cold compress and tone rejuvenation.',
      image: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      category: 'FACIALS'
    },
    {
      num: '04',
      title: 'GENTLEMAN LOUNGE CARE',
      description: 'Acupressure head therapy, executive manicure, pedicure and soothing scalp rituals.',
      image: '/src/assets/images/salon_interior_luxury_1790150271262.jpg',
      category: 'HANDS & FEET'
    }
  ];

  return (
    <section id="services" className="py-24 bg-theme-main relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <div className="prompt-pill mb-3">
            <Scissors className="w-3.5 h-3.5 text-accent-cyan" />
            <span>The Service Catalogue</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight">
            THE ART OF GENTLEMAN GROOMING
          </h2>
          <p className="text-theme-muted mt-3 text-sm sm:text-base font-normal leading-relaxed">
            Every service is executed with obsessive precision, sterilized surgical instruments and bespoke masculine styling.
          </p>
        </div>

        {/* Featured Editorial Marquee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {editorialFeatured.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                const match = services.find(s => s.category.toUpperCase().includes(item.category));
                if (match) onSelectService(match);
              }}
              className="group cursor-pointer glass-panel rounded-2xl overflow-hidden border border-theme-card hover:border-cyan-500/40 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="h-52 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-theme-main via-theme-main/30 to-transparent" />
                <span className="absolute top-3 left-3 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-950/70 text-accent-cyan backdrop-blur-md border border-cyan-500/30">
                  {item.num}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-semibold tracking-wide text-theme-title group-hover:text-accent-cyan transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-theme-body leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-lime uppercase tracking-wider group-hover:gap-2 transition-all">
                  <span>Explore & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Pill Filters (Matching reference image tab pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-xl whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-cyan-500/50 shadow-sm font-semibold'
                  : 'bg-theme-subtle text-theme-muted border border-theme-card hover:text-theme-title hover:border-theme-glow'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services List / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="text-base font-semibold text-theme-title group-hover:text-accent-cyan transition-colors">
                    {service.name.replace(/["'“”‘’]/g, '')}
                  </h4>
                  <div className="flex items-baseline gap-1 text-accent-lime font-bold font-mono text-sm shrink-0">
                    <span className="text-[10px] text-theme-muted uppercase">Rs.</span>
                    <span>{service.price.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-theme-body leading-relaxed mb-6 font-light">
                  {service.description.replace(/["'“”‘’]/g, '').replace(/,\s+and/g, ' and')}
                </p>
              </div>

              <div className="pt-4 border-t border-theme-card flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-theme-muted font-mono">
                  <Clock className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>{service.duration} mins</span>
                </div>

                <button
                  onClick={() => onSelectService(service)}
                  className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider btn-primary-action rounded-lg shadow-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
