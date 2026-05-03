
import React from 'react';
import { SERVICES_DATA } from '../constants';
import { ShieldCheck } from 'lucide-react';

export const Services: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Your Go-To Cab Service in Kovai</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
         Safe and reliable cab services in Coimbatore, offering city rides, airport transfers, and outstation trips with online booking.
          </p>
        </div>

        <div className="space-y-24">
          {SERVICES_DATA.map((service, index) => (
            <div key={service.id} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-400 to-brand-500 rounded-3xl transform rotate-3 scale-95 opacity-20"></div>
                <img 
  src={service.image}
  alt={service.title}
  loading="lazy"
  className="relative rounded-3xl shadow-2xl w-full object-cover h-[400px] z-10"/>
              </div>
              <div className="flex-1 space-y-8">
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                   <ShieldCheck size={32} />
                </div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{service.title}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  {service.description} 
                </p>
                <ul className="space-y-4">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-slate-700 dark:text-slate-300 text-lg">
                      <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-xs flex-shrink-0">✓</div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
