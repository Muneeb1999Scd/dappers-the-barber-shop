import React from 'react';
import { Star, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Review } from '../types';

interface TrustSectionProps {
  reviews?: Review[];
  googleMapsUrl?: string;
}

export const TrustSection: React.FC<TrustSectionProps> = ({
  googleMapsUrl = 'https://maps.google.com/?q=W3VX%2BJ98,+Gulzar-e-Hijri+Block+1/1,+Metrovil+Colony,+Karachi'
}) => {
  const defaultExcerpts = [
    {
      author: 'Shahmir Khan',
      text: 'One of the best barber shops I have visited in Karachi. Clean environment, skilled barbers and a great overall experience.',
      time: '2 weeks ago'
    },
    {
      author: 'Muhammad Bilal',
      text: 'Professional barber, cutting according to my taste. Highly recommended for anyone in Gulzar-e-Hijri.',
      time: '1 month ago'
    },
    {
      author: 'Hamza Farooq',
      text: 'The best salon of the town at the most reasonable prices. Attention to detail is unmatched.',
      time: '2 months ago'
    }
  ];

  return (
    <section className="py-20 bg-theme-main border-y border-theme-card relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Rating Header Block */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 pb-12 border-b border-theme-card">
          <div>
            <div className="prompt-pill mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Verified Client Satisfaction</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl sm:text-6xl font-display font-bold text-accent-lime tabular-nums">
                4.9
              </span>
              <div className="flex flex-col">
                <div className="flex items-center text-accent-lime mb-1 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-lime text-accent-lime" />
                  ))}
                </div>
                <span className="text-sm text-theme-muted font-medium">
                  Based on 170 Verified Google Reviews
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-sm sm:text-base text-theme-body max-w-md font-normal leading-relaxed">
              Trusted by gentlemen across Karachi for consistent precision and attentive personal care.
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-wider font-semibold btn-outline-action rounded-xl transition-all whitespace-nowrap"
            >
              <span>View On Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3 Authentic Customer Review Cards (Without quotes and without oxford commas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {defaultExcerpts.map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-6 sm:p-7 rounded-2xl relative flex flex-col justify-between hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex items-center text-accent-lime gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-accent-lime text-accent-lime" />
                  ))}
                </div>
                <p className="text-theme-body text-sm leading-relaxed mb-6 font-normal">
                  {item.text}
                </p>
              </div>

              <div className="pt-4 border-t border-theme-card flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-theme-title">
                    {item.author}
                  </div>
                  <div className="text-theme-muted text-[11px] mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-accent-lime" />
                    <span>Verified Google Patron · {item.time}</span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-accent-cyan font-medium">
                  Google
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
