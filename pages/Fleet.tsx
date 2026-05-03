import React from 'react';
import { FLEET_DATA } from '../constants';
import { Users, Zap, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Fleet: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Our Fleet</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
           Planning a city ride or an outstation trip? Choose your vehicle and book online for a smooth and reliable journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FLEET_DATA.map((car) => (
            <div key={car.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-slate-100 dark:border-slate-700">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={car.image} 
                  alt={car.name} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-brand-yellow text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                  {car.type}
                </div>
              </div>
              
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{car.name}</h3>
                </div>

                <div className="flex gap-4 mb-8 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
                    <Users size={14} className="text-brand-yellow" />
                    <span>{car.capacity} Seats Available</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {car.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <div className="w-1 h-1 rounded-full bg-brand-yellow" />
                      {feature}
                    </div>
                  ))}
                </div>

<Link 
  to="/" 
  state={{ scrollToBook: true }}
  className="block w-full text-center bg-[#FF6467] text-white font-bold py-4 rounded-xl
             shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-pink-500/50
             active:scale-95 uppercase tracking-widest text-[11px] relative overflow-hidden
             animate-glow-flow"
>
  {/* Optional shimmer effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                  -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>
  Book This Vehicle
</Link>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};