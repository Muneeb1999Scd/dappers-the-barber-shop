import React from 'react';
import { Clock, ArrowRight, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { ServicePackage } from '../types';

interface PackagesSectionProps {
  packages: ServicePackage[];
  onSelectPackage: (pkg: ServicePackage) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  packages,
  onSelectPackage
}) => {
  if (!packages || packages.length === 0) return null;

  return (
    <section id="packages" className="py-24 bg-theme-main border-t border-theme-card relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="prompt-pill mb-3">
            <Crown className="w-3.5 h-3.5 text-accent-lime" />
            <span>Curated Rituals</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight">
            THE GENTLEMAN PACKAGES
          </h2>
          <p className="text-theme-muted mt-3 text-sm sm:text-base font-normal leading-relaxed">
            Complete grooming combinations designed for total refinement before weddings, executive meetings or regular weekend restoration.
          </p>
        </div>

        {/* Packages Cards: Strictly Aligned Heights and Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, idx) => {
            const isFeatured = idx === 1;

            return (
              <div
                key={pkg.id}
                className={`glass-panel ${
                  isFeatured
                    ? 'border-cyan-500/50 shadow-2xl relative ring-1 ring-cyan-500/30'
                    : 'border-theme-card'
                } p-6 sm:p-7 rounded-2xl flex flex-col h-full hover:border-cyan-500/60 hover:-translate-y-1.5 transition-all duration-300 group`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-lime text-slate-950 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}

                {/* Card Body */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-theme-muted mb-3">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-accent-cyan" />
                        <span className="tabular-nums">{pkg.duration} mins</span>
                      </div>
                      <span className="text-accent-cyan font-mono font-semibold">0{idx + 1}</span>
                    </div>

                    <h3 className="text-xl font-semibold text-theme-title group-hover:text-accent-cyan transition-colors mb-3">
                      {pkg.name.replace(/["'“”‘’]/g, '')}
                    </h3>

                    <p className="text-xs text-theme-body leading-relaxed font-light mb-6">
                      {pkg.description.replace(/["'“”‘’]/g, '').replace(/,\s+and/g, ' and')}
                    </p>
                  </div>

                  <div className="mb-6 pt-4 border-t border-theme-card">
                    <span className="text-[10px] text-theme-muted uppercase tracking-wider block mb-1.5 font-medium">
                      Package Price
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        Rs.
                      </span>
                      <span className="text-2xl sm:text-3xl font-display font-bold text-accent-lime tabular-nums">
                        {pkg.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onSelectPackage(pkg)}
                  className={`w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:gap-3 ${
                    isFeatured
                      ? 'btn-primary-action shadow-lg'
                      : 'btn-outline-action'
                  }`}
                >
                  <span>Select Package</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
