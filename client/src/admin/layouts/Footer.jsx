import React from 'react';

const Footer = () => {
  return (
    <footer className="h-14 border-t border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 text-xs text-slate-500 mt-auto transition-colors duration-200">
      <div>
        <span>&copy; {new Date().getFullYear()} </span>
        <span className="font-semibold text-emerald-600">KrishiMitra SmartFarm</span>
        <span> Decision Support System.</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Admin Engine: v1.0.0</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-emerald-500">Live Uptime</span>
      </div>
    </footer>
  );
};

export default Footer;
