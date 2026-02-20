import React, { useState } from 'react';

const Sidebar = ({ currentPage, navigate, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-layout-grid-fill', section: 'Core' },
    { id: 'playground', label: 'AI Lab', icon: 'ri-flask-fill', section: 'Core' },
    { id: 'documents', label: 'Doc List', icon: 'ri-file-list-3-line', section: 'Core' },
    { id: 'users', label: 'Users', icon: 'ri-team-fill', section: 'Manage' },
    { id: 'plans', label: 'Pricing', icon: 'ri-vip-crown-2-fill', section: 'Manage' },
    { id: 'system', label: 'System', icon: 'ri-settings-4-fill', section: 'Settings' },
  ];

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const handleNavigate = (id) => {
    navigate(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur border border-white/10 flex items-center justify-center text-white"
      >
        <i className={`ri-${isMobileOpen ? 'close' : 'menu'}-line text-xl`}></i>
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 glass border-r border-white/5 flex flex-col z-40 fixed md:relative h-full transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-6 md:p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="ri-openai-fill text-2xl text-indigo-600"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">
              Neural<span className="text-indigo-400">Admin</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-white/5">
              v11.0 SECURE
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section}>
              <div className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider mt-4">
                {section}
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`group w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 border ${currentPage === item.id
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                    }`}
                >
                  <i className={`${item.icon} transition group-hover:scale-110`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-semibold text-sm group"
          >
            <i className="ri-logout-box-r-line group-hover:-translate-x-1 transition"></i>
            Disconnect
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;