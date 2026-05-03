import React from 'react';
import { Phone } from 'lucide-react';

export const FloatingCallButton: React.FC = () => {
  return (
   <a
  href="tel:+919488834020"
  className="fixed bottom-24 md:bottom-28 right-4 md:right-6 z-[60] group flex flex-col items-center animate-magnetic-float hidden md:flex"
  aria-label="Call for Booking"
>
      {/* Radar Signal Pulses */}
      <div className="absolute inset-0 border-2 border-[#FF6467] rounded-full animate-radar-signal"></div>
      <div className="absolute inset-0 border-2 border-[#FF6467] rounded-full animate-radar-signal [animation-delay:1.5s]"></div>
      
      <div className="relative flex flex-col items-center">
        {/* Subtle Online Floating Indicator */}
        <div className="absolute -top-6 flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/10 dark:bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <div className="w-1.5 h-1.5 bg-[#FF6467] rounded-full animate-pulse"></div>
          <span className="text-[7px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">Live</span>
        </div>

        {/* Small Action Hub */}
        <div className="relative animate-ring-vibrate">
          {/* Main Button Container - Gradient Pink Theme */}
          <div className="bg-gradient-to-br from-[#FF6467]/80 via-[#FF4F55]/80 to-[#FF7B7F]/80 p-3.5 md:p-4 rounded-2xl shadow-xl border-t border-white/30 transform transition-all duration-500 group-hover:scale-110 group-active:scale-90 flex items-center justify-center relative overflow-hidden animate-glow-flow">
            
            {/* Glossy Reflection Path */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Rhythmic Vibrating Icon */}
            <div className="animate-rhythmic-vibrate">
              <Phone size={20} strokeWidth={2.5} className="text-white drop-shadow-md" />
            </div>

            {/* Internal Animated Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-800"></div>
          </div>

          {/* Magnetic Label (Shown on hover for desktop) */}
          <div className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 mr-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
            <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-3 py-2 rounded-xl shadow-2xl flex flex-col border border-white/10 whitespace-nowrap">
              <span className="text-[10px] font-black leading-none">+91 94888 34020</span>
              <span className="text-[7px] font-bold text-[#FF6467] uppercase mt-0.5">Quick Booking</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Soft Interactive Shadow */}
      <div className="w-8 h-1 bg-[#FF6467]/30 blur-md rounded-full mt-4 transition-all duration-500 group-hover:scale-150 group-hover:opacity-40"></div>
    </a>
  );
};
