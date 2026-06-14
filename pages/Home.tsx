import React, { useEffect, useCallback } from 'react';
import { BookingForm } from '../components/BookingForm';
import { SERVICES_DATA, TESTIMONIALS_DATA } from '../constants';
import { ArrowRight, Star, MapPin, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Home: React.FC = () => {
  const { state } = useLocation();

  const scrollToBooking = useCallback(() => {
    const element = document.getElementById('book');
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, []);

  const col1 = TESTIMONIALS_DATA.filter((_, i) => i % 3 === 0);
  const col2 = TESTIMONIALS_DATA.filter((_, i) => i % 3 === 1);
  const col3 = TESTIMONIALS_DATA.filter((_, i) => i % 3 === 2);

  useEffect(() => {
    if (state && state.scrollToBook) {
      setTimeout(scrollToBooking, 100);
    }
  }, [state, scrollToBooking]);

  const TestimonialCard: React.FC<{ t: any }> = ({ t }) => (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm mb-4 transition-all hover:shadow-md">
      <div className="flex gap-1 mb-3 text-brand-yellow">
        {[...Array(t.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
      </div>
      <p className="text-slate-700 dark:text-slate-300 italic mb-6 text-sm leading-relaxed font-medium">"{t.comment}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center text-slate-900 font-bold text-xs">
          {t.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">{t.name}</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full overflow-hidden bg-white dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-white dark:bg-slate-950 overflow-hidden py-16 lg:py-0">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-slate-50 dark:bg-slate-900/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col space-y-10 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg w-fit mx-auto lg:mx-0 shadow-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-brand-yellow"></span>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Coimbatore Taxi</span>
              </div>

              <div className="space-y-6">
<h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
  Taxi Booking <br />
  <span className="text-brand-yellow">Coimbatore</span>
</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
                 Local ride ah? Outstation ah?
FastPoint Cab dhaan — Anytime, Anywhere!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                  <CheckCircle className="text-brand-yellow" size={18} />
                  <span className="text-xs font-bold">No Hidden Charges</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                  <CheckCircle className="text-brand-yellow" size={18} />
                  <span className="text-xs font-bold">24/7 Support</span>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end order-1 lg:order-2 -mt-14 lg:mt-0" id="book">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">Cab Services</h2>
            <div className="w-12 h-1 bg-brand-yellow mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES_DATA.map((service) => (
              <div key={service.id} className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center justify-center text-brand-yellow mb-6">
                   <MapPin size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{service.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6 font-medium">{service.description}</p>
                <Link to="/services" className="inline-flex items-center text-slate-900 dark:text-brand-yellow font-bold hover:gap-2 transition-all text-[10px] tracking-widest uppercase">
                  Details <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

   {/* Testimonials */}
<section className="py-24 bg-white dark:bg-slate-950 overflow-hidden relative border-t border-slate-50 dark:border-slate-900">
  <div className="container mx-auto px-4 mb-16 relative z-10 text-center">
    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
      Feedback
    </h2>
    <p className="mt-4 text-slate-400 font-bold tracking-widest uppercase text-[10px]">
      Trusted Community
    </p>
  </div>

  <div className="container mx-auto px-4 h-[550px] overflow-hidden relative">
    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white dark:from-slate-950 to-transparent z-20 pointer-events-none"></div>
    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white dark:from-slate-950 to-transparent z-20 pointer-events-none"></div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <div className="flex flex-col animate-vertical-scroll">
        {[...col1, ...col1].map((t, i) => <TestimonialCard key={`c1-${i}`} t={t} />)}
      </div>
      <div className="hidden md:flex flex-col animate-vertical-scroll-reverse">
        {[...col2, ...col2].map((t, i) => <TestimonialCard key={`c2-${i}`} t={t} />)}
      </div>
      <div className="hidden lg:flex flex-col animate-vertical-scroll">
        {[...col3, ...col3].map((t, i) => <TestimonialCard key={`c3-${i}`} t={t} />)}
      </div>
    </div>
  </div>

  <div className="mt-16 text-center">
    <button
      onClick={scrollToBooking}
      className="px-12 py-5 bg-[#FF6467] text-white font-bold rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 uppercase tracking-widest text-xs relative overflow-hidden animate-glow-flow"
    >
      {/* Optional animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>

      Book Your Trip
    </button>
  </div>
</section>

    </div>
  );
};