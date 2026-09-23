import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { api, BootstrapResponse } from './services/api';
import { Service, ServicePackage } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustSection } from './components/TrustSection';
import { RitualsSqueezeSection } from './components/RitualsSqueezeSection';
import { ServicesSection } from './components/ServicesSection';
import { PackagesSection } from './components/PackagesSection';
import { BrandStory } from './components/BrandStory';
import { WhyDappers } from './components/WhyDappers';
import { GallerySection } from './components/GallerySection';
import { ReviewsSection } from './components/ReviewsSection';
import { HoursAndLocation } from './components/HoursAndLocation';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { CustomerPortalModal } from './components/CustomerPortalModal';
import { AdminDashboard } from './components/AdminDashboard';

function AppContent() {
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isPortalOpen, setIsPortalOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Preselections for booking
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  const loadData = async () => {
    try {
      const res = await api.getBootstrap();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setError('Unable to load salon catalogue. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBooking = (service?: Service, pkg?: ServicePackage) => {
    setSelectedService(service || null);
    setSelectedPackage(pkg || null);
    setIsBookingOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-main flex flex-col items-center justify-center text-theme-title">
        <div className="w-12 h-12 border-2 border-accent-lime border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-display tracking-[0.25em] uppercase text-accent-cyan font-semibold">
          DAPPERS · THE GENTLEMAN CHOICE
        </span>
        <span className="text-xs text-theme-muted mt-2">Loading salon catalog...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-theme-main flex flex-col items-center justify-center text-theme-title p-6 text-center">
        <h2 className="text-2xl font-display text-theme-title mb-2">Temporary Connection Issue</h2>
        <p className="text-sm text-theme-muted mb-6">{error || 'Failed to initialize system.'}</p>
        <button
          onClick={loadData}
          className="px-6 py-2.5 btn-primary-action text-xs uppercase tracking-wider font-semibold rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  const phone = data.settings?.phone || '0335 7792524';
  const whatsappUrl = `https://wa.me/923357792524?text=${encodeURIComponent('Hello Dappers, I would like to book a grooming appointment.')}`;

  return (
    <div className="min-h-screen bg-theme-main text-theme-body flex flex-col selection:bg-accent-lime selection:text-slate-950 transition-colors duration-250">
      {/* Primary Sticky Top Bar */}
      <Navbar
        settings={data.settings}
        onOpenBooking={() => handleOpenBooking()}
        onOpenCustomerPortal={() => setIsPortalOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="flex-1">
        {/* 1. Cinematic Hero Section */}
        <Hero
          settings={data.settings}
          onOpenBooking={() => handleOpenBooking()}
          onExploreServices={() => {
            const el = document.getElementById('services');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 2. Google Verified 4.9 Trust Section */}
        <TrustSection
          reviews={data.reviews}
          googleMapsUrl={data.settings?.google_maps_url}
        />

        {/* 2.5 Interactive Animated Squeeze Carousel Rituals Showcase */}
        <RitualsSqueezeSection
          services={data.services}
          packages={data.packages}
          onOpenBooking={(srv, pkg) => handleOpenBooking(srv, pkg)}
        />

        {/* 3. Comprehensive Services Catalogue */}
        <ServicesSection
          services={data.services}
          onSelectService={(service) => handleOpenBooking(service, undefined)}
        />

        {/* 4. Curated Gentleman Packages */}
        <PackagesSection
          packages={data.packages}
          onSelectPackage={(pkg) => handleOpenBooking(undefined, pkg)}
        />

        {/* 5. The Dappers Experience Story */}
        <BrandStory />

        {/* 6. Why Dappers (4 Pillars) */}
        <WhyDappers />

        {/* 7. Asymmetric Portfolio Lounge Archive */}
        <GallerySection items={data.gallery} />

        {/* 8. Verified Patron Reviews with Prominent 4.9 Rating */}
        <ReviewsSection
          reviews={data.reviews}
          googleMapsUrl={data.settings?.google_maps_url}
        />

        {/* 9. Hours, Exact Gulzar-e-Hijri Location & Social */}
        <HoursAndLocation
          hours={data.hours}
          settings={data.settings}
          onOpenBooking={() => handleOpenBooking()}
        />
      </main>

      {/* Editorial Footer */}
      <Footer
        settings={data.settings}
        onOpenBooking={() => handleOpenBooking()}
        onOpenCustomerPortal={() => setIsPortalOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Mobile Sticky Bottom CTA Bar */}
      <aside aria-label="Mobile actions" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-theme-card px-4 py-3 flex items-center gap-2 shadow-2xl">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-theme-subtle border border-theme-card text-accent-lime rounded-xl hover:text-accent-cyan transition-colors shrink-0"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </a>

        <button
          onClick={() => handleOpenBooking()}
          className="flex-1 py-3 px-4 btn-primary-action font-semibold text-xs uppercase tracking-wider rounded-xl text-center shadow-lg active:scale-[0.98] transition-transform"
        >
          Book Appointment
        </button>
      </aside>

      {/* Interactive Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedService(null);
          setSelectedPackage(null);
        }}
        services={data.services}
        packages={data.packages}
        staff={data.staff}
        preselectedService={selectedService}
        preselectedPackage={selectedPackage}
        onBookingComplete={() => {
          loadData();
        }}
      />

      {/* Customer Lookup & Reschedule Modal */}
      <CustomerPortalModal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
        onBookNew={() => {
          setIsPortalOpen(false);
          handleOpenBooking();
        }}
      />

      {/* Administrative System */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshData={loadData}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
