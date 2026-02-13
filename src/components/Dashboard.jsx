import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const Dashboard = ({ db }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const kpis = [
    {
      title: 'Revenue',
      value: '₹1,24k',
      icon: 'ri-money-dollar-circle-fill',
      color: 'indigo',
      badge: '+12.5%',
      badgeColor: 'emerald'
    },
    {
      title: 'Users',
      value: `${db.users.length * 1240}`,
      icon: 'ri-user-heart-fill',
      color: 'purple',
      badge: 'Active',
      badgeColor: 'purple'
    },
    {
      title: 'Files',
      value: '18k',
      icon: 'ri-file-copy-2-fill',
      color: 'pink',
      badge: 'Processing',
      badgeColor: 'pink'
    }
  ];

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      // Destroy previous chart instance
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
          datasets: [{
            data: [12, 19, 15, 25, 32, 40, 55],
            borderColor: '#6366f1',
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return null;
              
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
              gradient.addColorStop(1, 'transparent');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="section-view">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="glass p-4 md:p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition duration-500"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-${kpi.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {kpi.title}
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold mt-2 text-white">
                  {kpi.value}
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-${kpi.color}-500/20 flex items-center justify-center text-${kpi.color}-400 group-hover:bg-${kpi.color}-500 group-hover:text-white transition`}>
                <i className={`${kpi.icon} text-xl`}></i>
              </div>
            </div>
            <div className={`mt-4 flex items-center gap-2 text-xs font-medium text-${kpi.badgeColor}-400 bg-${kpi.badgeColor}-400/10 w-fit px-2 py-1 rounded`}>
              {kpi.badge.includes('%') && <i className="ri-arrow-up-fill"></i>}
              {kpi.badge}
            </div>
          </div>
        ))}
      </div>

      <div className="glass p-4 md:p-6 rounded-2xl h-64 md:h-96 border-t border-white/5 relative">
        <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6 text-white flex items-center gap-2">
          <i className="ri-bar-chart-2-fill text-indigo-500"></i>
          Analytics
        </h3>
        <div className="h-[calc(100%-3rem)]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;