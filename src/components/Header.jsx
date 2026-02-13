import React from 'react';

const Header = ({ currentPage }) => {
  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      playground: 'AI Lab',
      users: 'Users',
      plans: 'Pricing',
      files: 'Documents',
      system: 'System'
    };
    return titles[currentPage] || 'Dashboard';
  };

  return (
    <header className="h-16 md:h-20 glass border-b border-white/5 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
      <div>
        <h2 className="font-extrabold text-xl md:text-2xl tracking-tight text-white">
          {getPageTitle()}
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="hidden sm:inline">Network Stable</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4">
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition anim-pop">
          <i className="ri-notification-4-fill"></i>
        </button>
        
        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-white">Super Admin</div>
            <div className="text-[10px] text-slate-400">Level 9 Access</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;