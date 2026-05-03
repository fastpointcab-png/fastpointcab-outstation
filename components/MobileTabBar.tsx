import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Car, Phone, Calendar, Mail } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/fleet', label: 'Fleet', icon: Car },
    { 
      path: '/', 
      label: 'Book', 
      icon: Calendar, 
      isAction: true, 
      isPrimary: true,
      action: () => navigate('/', { state: { scrollToBook: true } }) 
    },
    { 
      path: 'tel:+918870088020', 
      label: 'Call', 
      icon: Phone, 
      isExternal: true,
      isHotline: true
    },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 pb-safe-area-inset-bottom shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex items-stretch justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path) && !item.isAction && !item.isExternal;

          // Primary CTA Style (Book)
               if (item.isPrimary) {
            return (
              <button
    key={item.label}
    onClick={item.action}
    className="flex-1 flex flex-col items-center justify-center text-slate-950 dark:text-white transition-all active:scale-95 group"
  >
    <Icon size={20} strokeWidth={3} className="group-active:scale-110 transition-transform" />
    <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">
      {item.label}
    </span>
  </button>
            );
          }
          // Urgent Action Style (Call)
          if (item.isHotline) {
            return (
              <a
                key={item.label}
                href={item.path}
                className="flex-1 flex flex-col items-center justify-center text-slate-900 dark:text-white transition-all active:bg-slate-50 dark:active:bg-slate-900 group"
              >
                <div className="relative p-1.5 rounded-full border-2 border-brand-yellow/30 group-active:border-brand-yellow group-active:scale-110 transition-all">
                  <Icon size={18} strokeWidth={2.5} className="text-brand-yellow animate-ring-vibrate" />
                </div>
                <span className="text-[9px] font-black mt-1 uppercase tracking-tighter opacity-80">
                  {item.label}
                </span>
              </a>
            );
          }

          // Standard Nav Items (Home, Fleet, Contact)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center transition-all relative group active:scale-95 ${
                active 
                  ? 'text-brand-yellow' 
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {/* Active Top Bar Indicator */}
              {active && (
                <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-brand-yellow rounded-b-full shadow-[0_2px_10px_rgba(253,184,19,0.5)]" />
              )}
              
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
              <span className={`text-[9px] font-bold mt-1 uppercase tracking-tighter transition-colors ${
                active ? 'opacity-100' : 'opacity-60'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};