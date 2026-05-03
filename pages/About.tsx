import React from 'react';
import { Users, Shield, Clock, Star, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const About: React.FC = () => {
  const navigate = useNavigate();
  const handleBookNow = () => {
    navigate('/', { state: { scrollToBook: true } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Hero Section */}
      <div className="relative py-24 lg:py-32 bg-gradient-to-br from-[#FF6467] to-[#FF3E4D] overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-[#FF6467]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center z-10">
          <span className="inline-block py-1.5 px-4 rounded-full bg-slate-950/10 border border-slate-950/10 text-slate-900 text-[10px] font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
            Our Story
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-950 tracking-tight mb-6 drop-shadow-sm leading-[1.1]">
            Your Journey, <br/>
            <span className="text-white drop-shadow-[0_2px_8px_rgba(255,100,103,0.4)]">Our Responsibility.</span>
          </h1>
          <p className="text-base md:text-xl text-slate-900/80 max-w-2xl mx-auto leading-relaxed font-semibold px-4">
            Travel with ease and confidence, no matter the distance.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-32">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 text-[#FF6467] font-bold text-[10px] uppercase tracking-[0.2em]">
              <div className="h-px w-8 bg-[#FF6467]"></div>
              Mission & Vision
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
             Cab Service Near Me <br />Coimbatore
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
             Book your ride in Coimbatore with online taxi booking, experienced drivers, and clear, upfront pricing.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
             Experience professional taxi services with easy online booking and reliable vehicles throughout Coimbatore and Tamil Nadu.
Call a taxi and start your journey.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6">
              <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all group">
                <div className="w-10 h-10 bg-[#FF6467]/10 rounded-xl flex items-center justify-center text-[#FF6467] mb-4 group-hover:scale-110 transition-transform">
                  <Award size={24} />
                </div>
                <span className="block text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">10+</span>
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Years of Trust</span>
              </div>
              <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all group">
                <div className="w-10 h-10 bg-[#FF6467]/10 rounded-xl flex items-center justify-center text-[#FF6467] mb-4 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <span className="block text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">60k+</span>
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Happy Travelers</span>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 order-1 lg:order-2">
            <div className="space-y-3 sm:space-y-4 mt-8 sm:mt-12">
              <img src="/images/ChatGPT Image Oct 12, 2025, 09_27_33 AM.jpg" className="rounded-2xl shadow-xl hover:scale-[1.02] transition-transform duration-500 border-2 sm:border-4 border-white dark:border-slate-800 aspect-[3/4] w-full object-cover" alt="Professional Driving" />
              <div className="bg-[#FF6467] aspect-[2/1] rounded-2xl flex items-center justify-center text-white shadow-lg transform hover:-translate-y-1 transition-transform p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-3xl font-extrabold">24/7</p>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter">Availability</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-slate-900 dark:bg-[#FF6467] aspect-[2/1] rounded-2xl flex items-center justify-center text-white shadow-lg transform hover:-translate-y-1 transition-transform p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-3xl font-extrabold">100%</p>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter">Safe Rides</p>
                </div>
              </div>
              <img src="/images/taxi4-5 Verticle 1080 x 1350px.jpg" className="rounded-2xl shadow-xl hover:scale-[1.02] transition-transform duration-500 border-2 sm:border-4 border-white dark:border-slate-800 aspect-[3/4] w-full object-cover" alt="Travel Experience" />
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-[3rem] p-8 md:p-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Why We Stand Out</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-[10px] uppercase">The Trusty Yellow Promise</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: 'Safety First', desc: 'Verified drivers and GPS-tracked vehicles for complete peace of mind on every outstation taxi and Coimbatore ride.' },
              { icon: Clock, title: 'Punctuality', desc: 'No more waiting! Skip Red Taxi and book Trusty Yellow Cabs for Coimbatore taxi rides with guaranteed on-time pickups.' },
              { icon: Star, title: 'Premium Service', desc: 'Ride comfortably in well-maintained cars with AC and reliable, professional drivers.' },
            ].map((value, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[#FF6467]">
                  <value.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{value.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-32 text-center bg-slate-900 dark:bg-white rounded-[3rem] p-12 md:p-24 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6467]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF6467]/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black text-white dark:text-slate-950 uppercase tracking-tight leading-none">
              Ready for a <br/>
              <span className="text-[#FF6467]">Better Ride?</span>
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              Coimbatore's Number One Choice
            </p>
            <button 
              onClick={handleBookNow}
              className="px-12 py-5 bg-[#FF6467] text-white font-black rounded-2xl transition-all shadow-xl shadow-[#FF6467]/30 hover:scale-105 active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3 mx-auto"
            >
              Book Now <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
