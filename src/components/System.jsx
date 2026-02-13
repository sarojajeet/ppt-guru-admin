import React, { useState } from 'react';
import Swal from 'sweetalert2';

const System = ({ maintenanceMode, setMaintenanceMode }) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const toggleMaintenance = () => {
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    
    if (newMode) {
      Swal.fire({
        icon: 'warning',
        title: 'Maintenance On',
        text: 'System is now in maintenance mode',
        background: '#1e293b',
        color: '#fff'
      });
    }
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Empty Message',
        text: 'Please enter a message to broadcast',
        background: '#1e293b',
        color: '#fff',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Sent',
      text: broadcastMessage,
      background: '#1e293b',
      color: '#fff',
      timer: 1500,
      showConfirmButton: false
    });

    setBroadcastMessage('');
  };

  return (
    <div className="section-view">
      <h3 className="text-xl font-bold mb-6 text-white">System Control</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Maintenance Mode */}
        <div className="glass p-6 md:p-8 rounded-2xl border border-red-500/30 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-red-500/10 text-9xl pointer-events-none">
            <i className="ri-lock-2-fill"></i>
          </div>
          <h4 className="text-lg font-bold text-red-400 mb-2 relative z-10">Maintenance Mode</h4>
          <p className="text-xs text-slate-400 mb-6 relative z-10">
            Lockdown the system for updates.
          </p>
          <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5 relative z-10">
            <span className="text-sm font-bold text-white">Status</span>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="maint-toggle"
                checked={maintenanceMode}
                onChange={toggleMaintenance}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-700 transition-all duration-300"
              />
              <label
                htmlFor="maint-toggle"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer"
              ></label>
            </div>
          </div>
          {maintenanceMode && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg relative z-10">
              <p className="text-xs text-red-400 flex items-center gap-2">
                <i className="ri-alert-fill"></i>
                System locked - No user access allowed
              </p>
            </div>
          )}
        </div>

        {/* Broadcast */}
        <div className="glass p-6 md:p-8 rounded-2xl border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-indigo-500/10 text-9xl pointer-events-none">
            <i className="ri-broadcast-fill"></i>
          </div>
          <h4 className="text-lg font-bold text-indigo-400 mb-2 relative z-10">Broadcast</h4>
          <p className="text-xs text-slate-400 mb-4 relative z-10">
            Push notification to all users.
          </p>
          <div className="flex gap-2 relative z-10">
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendBroadcast()}
              placeholder="Message..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <button
              onClick={sendBroadcast}
              className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-bold text-sm anim-pop hover:bg-indigo-500"
            >
              Send
            </button>
          </div>
        </div>

        {/* System Stats */}
        <div className="glass p-6 md:p-8 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-emerald-500/10 text-9xl pointer-events-none">
            <i className="ri-server-fill"></i>
          </div>
          <h4 className="text-lg font-bold text-emerald-400 mb-2 relative z-10">Server Status</h4>
          <p className="text-xs text-slate-400 mb-6 relative z-10">
            Real-time system metrics.
          </p>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">CPU Usage</span>
              <span className="text-sm font-bold text-white">23%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Memory</span>
              <span className="text-sm font-bold text-white">4.2 GB / 16 GB</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '26%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Storage</span>
              <span className="text-sm font-bold text-white">245 GB / 1 TB</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '24%' }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass p-6 md:p-8 rounded-2xl border border-purple-500/30 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-purple-500/10 text-9xl pointer-events-none">
            <i className="ri-tools-fill"></i>
          </div>
          <h4 className="text-lg font-bold text-purple-400 mb-2 relative z-10">Quick Actions</h4>
          <p className="text-xs text-slate-400 mb-6 relative z-10">
            System utilities and tools.
          </p>
          <div className="space-y-3 relative z-10">
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between transition group">
              <span className="flex items-center gap-2">
                <i className="ri-refresh-line"></i>
                Restart Services
              </span>
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition"></i>
            </button>
            
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between transition group">
              <span className="flex items-center gap-2">
                <i className="ri-database-2-line"></i>
                Backup Database
              </span>
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition"></i>
            </button>
            
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between transition group">
              <span className="flex items-center gap-2">
                <i className="ri-file-list-line"></i>
                View Logs
              </span>
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default System;