import React, { useState } from 'react';
import { Maximize2, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { GalleryItem } from '../types';

interface GallerySectionProps {
  items: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ items }) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);

  const categories = ['ALL', 'INTERIOR', 'HAIRCUTS', 'BEARD', 'GROOMING', 'EXPERIENCE'];

  const filteredItems = activeTab === 'ALL'
    ? items
    : items.filter(i => i.category.toUpperCase() === activeTab);

  return (
    <section id="gallery" className="py-24 bg-theme-main relative transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="prompt-pill mb-3">
              <ImageIcon className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Visual Portfolio</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-theme-title tracking-tight leading-tight">
              THE LOUNGE ARCHIVE
            </h2>
          </div>

          {/* Filter Bar matching reference image pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3.5 py-1.5 text-xs uppercase tracking-wider rounded-xl whitespace-nowrap font-medium transition-all duration-200 ${
                  activeTab === cat
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-cyan-500/50 shadow-sm font-semibold'
                    : 'bg-theme-subtle text-theme-muted border border-theme-card hover:text-theme-title hover:border-theme-glow'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => setLightboxImage(item)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer border border-theme-card glass-panel ${
                idx === 0 ? 'sm:col-span-2 lg:col-span-2 h-[420px]' : 'h-[320px]'
              }`}
            >
              <img
                src={item.image_url}
                alt={item.alt_text}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-accent-cyan mb-1 block">
                    {item.category}
                  </span>
                  <h4 className="text-lg font-semibold text-white tracking-wide">
                    {item.title}
                  </h4>
                </div>

                <div className="w-10 h-10 rounded-xl bg-slate-950/60 backdrop-blur-md border border-cyan-500/30 flex items-center justify-center text-accent-cyan group-hover:text-accent-lime group-hover:border-accent-lime transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-white hover:text-accent-lime p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.image_url}
              alt={lightboxImage.alt_text}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10 mb-4"
              referrerPolicy="no-referrer"
            />
            <div className="text-center">
              <span className="text-xs uppercase font-mono tracking-widest text-accent-cyan block mb-1">
                {lightboxImage.category}
              </span>
              <h3 className="text-xl font-semibold text-white">
                {lightboxImage.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
