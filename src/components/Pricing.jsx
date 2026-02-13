import React, { useState } from 'react';
import Swal from 'sweetalert2';

const Pricing = ({ db, updateDb }) => {
  const [isYearly, setIsYearly] = useState(false);

  const handleEditPlan = async (index) => {
    const plan = db.plans[index];
    const { value: newPrice } = await Swal.fire({
      title: `Edit ${plan.name}`,
      input: 'number',
      inputValue: plan.price,
      inputAttributes: {
        min: 0,
        step: 1
      },
      background: '#1e293b',
      color: '#fff',
      confirmButtonColor: '#6366f1',
      showCancelButton: true
    });

    if (newPrice !== undefined && newPrice !== null) {
      const updatedPlans = [...db.plans];
      updatedPlans[index].price = parseInt(newPrice);
      updateDb('plans', updatedPlans);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      slate: {
        bg: 'bg-slate-500/20',
        text: 'text-slate-400',
        hover: 'hover:bg-slate-500',
        checkbox: 'text-slate-500'
      },
      indigo: {
        bg: 'bg-indigo-500/20',
        text: 'text-indigo-400',
        hover: 'hover:bg-indigo-500',
        checkbox: 'text-indigo-500'
      },
      fuchsia: {
        bg: 'bg-fuchsia-500/20',
        text: 'text-fuchsia-400',
        hover: 'hover:bg-fuchsia-500',
        checkbox: 'text-fuchsia-500'
      }
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="section-view">
      <div className="text-center mb-10">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Choose Your Power</h3>
        <p className="text-slate-400 text-sm">Select the perfect plan for your AI generation needs.</p>
        
        <div className="mt-6 inline-flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-full border border-white/10">
          <span className="text-xs font-bold text-slate-400 pl-3">Monthly</span>
          <div className="relative inline-block w-12 h-6 align-middle select-none">
            <input
              type="checkbox"
              id="pricing-toggle"
              checked={isYearly}
              onChange={() => setIsYearly(!isYearly)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-700 transition-all duration-300"
            />
            <label
              htmlFor="pricing-toggle"
              className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer transition-colors duration-300"
            ></label>
          </div>
          <span className="text-xs font-bold text-white pr-3">
            Yearly <span className="text-indigo-400">(-20%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
        {db.plans.map((plan, index) => {
          const price = isYearly ? Math.floor(plan.price * 12 * 0.8) : plan.price;
          const period = isYearly ? '/yr' : '/mo';
          const colors = getColorClasses(plan.color);
          const borderClass = plan.popular
            ? 'border-indigo-500/50 glow-border transform scale-105 z-10'
            : 'border-white/10';
          const btnClass = plan.popular
            ? 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:shadow-indigo-500/40 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-white';

          return (
            <div
              key={index}
              className={`glass p-6 md:p-8 rounded-3xl border ${borderClass} relative flex flex-col anim-pop group`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-10">
                  Most Popular
                </div>
              )}

              <div className={`w-12 h-12 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition`}>
                <i className={plan.icon}></i>
              </div>

              <h4 className="text-white font-bold text-lg">{plan.name}</h4>

              <div className="my-4">
                <span className="text-3xl md:text-4xl font-extrabold text-white">₹{price}</span>
                <span className="text-slate-500 text-sm font-medium">{period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-3 text-sm text-slate-300">
                    <i className={`ri-checkbox-circle-fill ${colors.checkbox} text-lg flex-shrink-0`}></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleEditPlan(index)}
                className={`w-full py-3.5 rounded-xl font-bold transition shadow-lg ${btnClass}`}
              >
                Edit Plan
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;