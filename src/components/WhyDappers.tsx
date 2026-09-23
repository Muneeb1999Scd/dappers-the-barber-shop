import React from 'react';
import { Sparkles, Shield, Clock, Award } from 'lucide-react';

export const WhyDappers: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'PRECISION',
      description: 'Every cut is customized to your unique head structure, growth pattern and daily styling preferences.',
      icon: Sparkles
    },
    {
      num: '02',
      title: 'EXPERIENCE',
      description: 'Professional grooming in a serene, climate-controlled lounge with dedicated 1-on-1 barber focus.',
      icon: Clock
    },
    {
      num: '03',
      title: 'QUALITY',
      description: 'Attention to detail from preliminary consultation, hot steam prep to final organic styling tonic.',
      icon: Award
    },
    {
      num: '04',
      title: 'VALUE',
      description: 'Premium gentleman personal care without inflated pretension or hidden charges.',
      icon: Shield
    }
  ];

  return (
    <section className="py-24 bg-theme-main border-y border-theme-card relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="prompt-pill mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>The Standard</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-none">
              YOUR STYLE. OUR CRAFT.
            </h2>
          </div>
          <p className="text-theme-muted text-sm sm:text-base max-w-md font-normal">
            We reject the rushed assembly-line mentality. At Dappers, every gentleman receives unhurried, intentional artistry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="glass-panel border-t-2 border-t-cyan-500/40 p-7 flex flex-col justify-between hover:border-t-accent-lime hover:-translate-y-2 hover:shadow-xl transition-all duration-300 rounded-2xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-125" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono text-accent-cyan tracking-widest font-semibold group-hover:text-accent-lime transition-colors">
                      {item.num}
                    </span>
                    <Icon className="w-4 h-4 text-theme-muted group-hover:text-accent-cyan transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-wider text-theme-title mb-3 uppercase group-hover:text-accent-cyan transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-theme-body leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
