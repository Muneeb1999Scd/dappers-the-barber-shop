import React from 'react';
import { Star, ExternalLink, ShieldCheck, CheckCircle2, Award, ThumbsUp } from 'lucide-react';
import { Review } from '../types';

interface ReviewsSectionProps {
  reviews: Review[];
  googleMapsUrl?: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  googleMapsUrl = 'https://maps.google.com/?q=W3VX%2BJ98,+Gulzar-e-Hijri+Block+1/1,+Metrovil+Colony,+Karachi'
}) => {
  return (
    <section id="reviews" className="py-24 bg-theme-main border-t border-theme-card relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="prompt-pill mb-3">
            <Award className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Verified Patron Experiences</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight">
            VOICES OF OUR PATRONS
          </h2>
          <p className="text-theme-muted mt-2 text-sm sm:text-base font-normal">
            Real feedback from gentlemen visiting our Gulzar-e-Hijri lounge.
          </p>
        </div>

        {/* HIGH-IMPACT PROMINENT 4.9 RATING SHOWCASE (Specifically requested by user) */}
        <div className="glass-panel rounded-2xl p-6 sm:p-10 mb-14 border border-theme-glow shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-lime/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-cyan/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Massive 4.9 Score Display */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left border-b lg:border-b-0 lg:border-r border-theme-card pb-8 lg:pb-0 lg:pr-8">
              <div className="flex flex-col items-center">
                <div className="text-6xl sm:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-accent-lime leading-none drop-shadow-sm">
                  4.9
                </div>
                <span className="text-xs uppercase tracking-widest text-theme-muted font-mono mt-1">
                  Out of 5.0
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1 text-accent-lime mb-2 justify-center sm:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-lime text-accent-lime drop-shadow" />
                  ))}
                </div>
                <div className="text-base font-semibold text-theme-title">
                  170+ Verified Google Reviews
                </div>
                <div className="flex items-center gap-1.5 text-xs text-accent-cyan mt-1 justify-center sm:justify-start font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>99.4% Exceptional Customer Satisfaction</span>
                </div>
              </div>
            </div>

            {/* Rating Breakdown & Highlights */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-14 text-theme-muted font-mono">5 Stars</span>
                <div className="flex-1 h-2 bg-theme-subtle rounded-full overflow-hidden border border-theme-card">
                  <div className="h-full bg-accent-lime rounded-full w-[96%]" />
                </div>
                <span className="text-theme-title font-mono font-medium">96%</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-14 text-theme-muted font-mono">4 Stars</span>
                <div className="flex-1 h-2 bg-theme-subtle rounded-full overflow-hidden border border-theme-card">
                  <div className="h-full bg-accent-cyan rounded-full w-[4%]" />
                </div>
                <span className="text-theme-title font-mono font-medium">4%</span>
              </div>

              <div className="flex items-center gap-3 text-xs opacity-40">
                <span className="w-14 text-theme-muted font-mono">3 Stars</span>
                <div className="flex-1 h-2 bg-theme-subtle rounded-full overflow-hidden border border-theme-card">
                  <div className="h-full bg-accent-cyan rounded-full w-[0%]" />
                </div>
                <span className="text-theme-title font-mono font-medium">0%</span>
              </div>

              <p className="text-[11px] text-theme-muted pt-1">
                Highest customer-rated barber salon in Gulzar-e-Hijri Block 1/1.
              </p>
            </div>

            {/* Google Verified Action */}
            <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider font-semibold btn-outline-action rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-center"
              >
                <span>Read Google Reviews</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-theme-muted mt-2 text-center lg:text-right">
                Live on Google Business Profile
              </span>
            </div>
          </div>
        </div>

        {/* Client Review Cards (Quotes and commas before and removed completely) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => {
            // Clean any quotation marks and oxford comma before and
            const cleanText = r.text
              .replace(/["'“”‘’]/g, '')
              .replace(/,\s+and/g, ' and');

            return (
              <div
                key={r.id}
                className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col justify-between hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-accent-lime gap-0.5">
                      {[...Array(r.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-accent-lime text-accent-lime" />
                      ))}
                    </div>
                    <span className="text-[11px] text-theme-muted font-mono">
                      {r.date_text}
                    </span>
                  </div>

                  {/* Clean text without quotation marks */}
                  <p className="text-theme-body text-sm leading-relaxed mb-6 font-normal">
                    {cleanText}
                  </p>
                </div>

                <div className="pt-4 border-t border-theme-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-cyan/15 text-accent-cyan flex items-center justify-center font-bold text-xs">
                      {r.author_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-theme-title">
                        {r.author_name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-theme-muted">
                        <ShieldCheck className="w-3 h-3 text-accent-lime" />
                        <span>Verified Google Patron</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-accent-cyan font-medium">
                    Google
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
