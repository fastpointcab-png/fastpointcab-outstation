
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/fleet', label: 'Fleet' },
    { path: '/services', label: 'Services' },
    { path: '/Tours', label: 'Tour Packages' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-50 dark:border-slate-900 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <Link to="/" className="flex items-center group gap-0.5">
             <span className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-white transition-colors">
              Book  
             </span>
             <span className="text-xl font-extrabold tracking-tighter text-brand-yellow transition-colors">
              -Your Taxi
             </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[11px] font-bold uppercase tracking-widest transition-all ${
                  isActive(link.path) 
                    ? 'text-brand-yellow' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-4 w-px bg-slate-100 dark:bg-slate-800"></div>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-400 dark:text-brand-yellow hover:scale-110 transition-all bg-slate-50 dark:bg-slate-900 rounded-lg"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link 
              to="/" 
              state={{ scrollToBook: true }}
              className="bg-brand-yellow hover:bg-yellow-400 text-slate-950 px-8 py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
             <button
              onClick={toggleDarkMode}
              className="p-2.5 text-slate-500 dark:text-brand-yellow bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 transition-transform active:scale-90"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-300 active:scale-95 ${
                isOpen 
                  ? 'bg-brand-yellow border-brand-yellow text-slate-950 shadow-lg shadow-brand-yellow/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white'
              }`}
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-tighter">
                {isOpen ? 'Close' : 'Menu'}
              </span>
              <div className="relative w-5 h-5 flex items-center justify-center">
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-slate-900 pb-12 transition-all animate-fade-in">
          <div className="px-4 pt-6 space-y-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest ${
                  isActive(link.path)
                    ? 'bg-slate-50 dark:bg-slate-900 text-brand-yellow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6">
              <Link
                to="/"
                state={{ scrollToBook: true }}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-brand-yellow text-slate-950 px-6 py-5 rounded-xl font-extrabold uppercase tracking-widest shadow-lg shadow-brand-yellow/20 transition-transform active:scale-[0.98]"
              >
                Book Your Ride
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
