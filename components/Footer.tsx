
import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white dark:bg-slate-950 pt-10 pb-24 md:pb-6 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
          
          <Link to="/" className="flex items-center gap-1 group">
             <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-yellow-500 transition-colors">
               Plan Your
             </span>
             <span className="text-xl font-extrabold tracking-tight text-yellow-500 transition-colors">
               Cab Booking
             </span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-6">
            {['Home', 'About', 'Fleet', 'Services', 'Contact'].map((item) => (
              
              <Link 
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} 
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block w-[120px]"></div>
        </div>

        <div className="mt-8 mb-6 h-px w-full bg-slate-100 dark:bg-slate-800" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>&copy; {new Date().getFullYear()} FastPointCab. All rights reserved.</p>
          <div className="flex items-center gap-1">
             <span>Partner:</span>
             <a 
               href="https://www.trustyyellowcabs.in/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors font-medium flex items-center gap-1"
             >
               www.trustyyellowcabs.in
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
