

// import React, { useState, useEffect } from 'react';
// import Swal from 'sweetalert2';
// import axios from 'axios';
// import { createPlan, getPlans, updatePlan } from '@/services/createPlan';

// const Pricing = () => {
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchPlans = async () => {
//     try {
//       const data = await getPlans();
//       setPlans(data);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching plans:", error);
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPlans();
//   }, []);

//   const handleCreatePlan = async () => {
//     const { value: formValues } = await Swal.fire({
//       title: 'Create New Plan',
//       html: `
//         <input id="name" class="swal2-input" placeholder="Plan Name">
//         <input id="validity" type="number" class="swal2-input" placeholder="Validity (months)">
//         <input id="credit" type="number" class="swal2-input" placeholder="Credits">
//         <input id="price" type="number" class="swal2-input" placeholder="Price">

//         <div style="text-align:left;color:white;margin-top:10px;">
//           <label><input type="checkbox" id="pdfExport"> PDF Export</label><br/>
//           <label><input type="checkbox" id="pptExport"> PPT Export</label><br/>
//           <label><input type="checkbox" id="branding"> Branding</label><br/>
//           <label><input type="checkbox" id="teachingMode"> Teaching Mode</label>
//         </div>

//         <textarea id="feature" class="swal2-textarea" placeholder="Features (comma separated)"></textarea>
//       `,
//       background: '#1e293b',
//       color: '#fff',
//       confirmButtonColor: '#6366f1',
//       showCancelButton: true,
//       preConfirm: () => {
//         return {
//           name: document.getElementById('name').value,
//           validity: Number(document.getElementById('validity').value),
//           credit: Number(document.getElementById('credit').value),
//           price: Number(document.getElementById('price').value),
//           pdfExport: document.getElementById('pdfExport').checked,
//           pptExport: document.getElementById('pptExport').checked,
//           branding: document.getElementById('branding').checked,
//           teachingMode: document.getElementById('teachingMode').checked,
//           feature: document.getElementById('feature').value
//             .split(',')
//             .map(f => f.trim())
//         };
//       }
//     });

//     if (formValues && formValues.name && formValues.price) {
//       try {
//         await createPlan(formValues);
//         Swal.fire('Created!', 'Plan added successfully.', 'success');
//         fetchPlans();
//       } catch (error) {
//         Swal.fire('Error', 'Failed to create plan', 'error');
//       }
//     }
//   };

//   const handleEditPlan = async (plan) => {
//     const { value: formValues } = await Swal.fire({
//       title: 'Edit Plan',
//       html: `
//       <input id="name" class="swal2-input" placeholder="Plan Name" value="${plan.name}">
//       <input id="validity" type="number" class="swal2-input" placeholder="Validity (months)" value="${plan.validity}">
//       <input id="credit" type="number" class="swal2-input" placeholder="Credits" value="${plan.credit}">
//       <input id="price" type="number" class="swal2-input" placeholder="Price" value="${plan.price}">

//       <div style="text-align:left;color:white;margin-top:10px;">
//         <label><input type="checkbox" id="pdfExport" ${plan.pdfExport ? "checked" : ""}> PDF Export</label><br/>
//         <label><input type="checkbox" id="pptExport" ${plan.pptExport ? "checked" : ""}> PPT Export</label><br/>
//         <label><input type="checkbox" id="branding" ${plan.branding ? "checked" : ""}> Branding</label><br/>
//         <label><input type="checkbox" id="teachingMode" ${plan.teachingMode ? "checked" : ""}> Teaching Mode</label>
//       </div>

//       <textarea id="feature" class="swal2-textarea" placeholder="Features (comma separated)">
//         ${plan.feature.join(", ")}
//       </textarea>
//     `,
//       background: '#1e293b',
//       color: '#fff',
//       confirmButtonColor: '#6366f1',
//       showCancelButton: true,
//       preConfirm: () => {
//         return {
//           name: document.getElementById('name').value,
//           validity: Number(document.getElementById('validity').value),
//           credit: Number(document.getElementById('credit').value),
//           price: Number(document.getElementById('price').value),
//           pdfExport: document.getElementById('pdfExport').checked,
//           pptExport: document.getElementById('pptExport').checked,
//           branding: document.getElementById('branding').checked,
//           teachingMode: document.getElementById('teachingMode').checked,
//           feature: document.getElementById('feature').value
//             .split(',')
//             .map(f => f.trim())
//         };
//       }
//     });

//     if (formValues) {
//       try {
//         await updatePlan(plan._id, formValues);
//         Swal.fire('Updated!', 'Plan updated successfully.', 'success');
//         fetchPlans();
//       } catch (error) {
//         Swal.fire('Error', 'Failed to update plan', 'error');
//       }
//     }
//   };

//   if (loading) return <div className="text-center text-white p-20">Loading...</div>;

//   return (
//     <div className="section-view">
//       <div className="text-center mb-10">
//         <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Subscription Plans</h3>

//         <button
//           onClick={handleCreatePlan}
//           className="mb-8 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition"
//         >
//           Add New Plan
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
//         {plans.map((plan) => (
//           <div key={plan._id} className="glass p-8 rounded-3xl border border-white/10 flex flex-col">
//             <div className="mb-4">
//               <h4 className="text-white font-bold text-xl">{plan.name}</h4>
//               <p className="text-indigo-400 text-sm font-medium">
//                 {plan.validity} Months • {plan.credit} Credits
//               </p>
//             </div>

//             <div className="mb-4">
//               <span className="text-4xl font-extrabold text-white">₹{plan.price}</span>
//             </div>

//             <ul className="space-y-2 mb-4 text-sm text-slate-300">
//               {plan.pdfExport && <li>✅ PDF Export</li>}
//               {plan.pptExport && <li>✅ PPT Export</li>}
//               {plan.branding && <li>✅ Branding</li>}
//               {plan.teachingMode && <li>✅ Teaching Mode</li>}
//             </ul>

//             <ul className="space-y-3 mb-6 flex-1">
//               {plan.feature.map((f, i) => (
//                 <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
//                   <i className="ri-checkbox-circle-fill text-indigo-500 text-lg"></i>
//                   {f}
//                 </li>
//               ))}
//             </ul>

//             <button
//               onClick={() => handleEditPlan(plan)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
//             >
//               Edit Price
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Pricing;

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createPlan, getPlans, updatePlan } from '@/services/createPlan';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingFilter, setBillingFilter] = useState('monthly'); // 'monthly' | 'yearly'

  const fetchPlans = async () => {
    try {
      const data = await getPlans();
      setPlans(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(
    (plan) => plan.billingType === billingFilter
  );

  const planFormHTML = (plan = {}) => `
    <input id="name" class="swal2-input" placeholder="Plan Name" value="${plan.name || ''}">
    <input id="validity" type="number" class="swal2-input" placeholder="Validity (months)" value="${plan.validity || ''}">
    <input id="credit" type="number" class="swal2-input" placeholder="Credits" value="${plan.credit || ''}">
    <input id="price" type="number" class="swal2-input" placeholder="Price" value="${plan.price || ''}">
    <input id="documentAllow" type="number" class="swal2-input" placeholder="Documents Allowed" value="${plan.documentAllow || ''}">

    <div style="text-align:left;margin:12px 16px 4px;color:#94a3b8;font-size:13px;font-weight:600;">
      Billing Type
    </div>
    <select id="billingType" class="swal2-input" style="color:#fff;background:#0f172a;border:1px solid #334155;">
      <option value="monthly" ${(!plan.billingType || plan.billingType === 'monthly') ? 'selected' : ''}>Monthly</option>
      <option value="yearly" ${plan.billingType === 'yearly' ? 'selected' : ''}>Yearly</option>
    </select>

    <div style="text-align:left;color:white;margin-top:12px;padding:0 16px;">
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <input type="checkbox" id="pdfExport" ${plan.pdfExport ? 'checked' : ''}> PDF Export
      </label>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <input type="checkbox" id="pptExport" ${plan.pptExport ? 'checked' : ''}> PPT Export
      </label>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <input type="checkbox" id="branding" ${plan.branding ? 'checked' : ''}> Branding
      </label>
      <label style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="teachingMode" ${plan.teachingMode ? 'checked' : ''}> Teaching Mode
      </label>
    </div>

    <textarea id="feature" class="swal2-textarea" placeholder="Features (comma separated)">${plan.feature ? plan.feature.join(', ') : ''}</textarea>
  `;

  const collectFormValues = () => ({
    name: document.getElementById('name').value,
    validity: Number(document.getElementById('validity').value),
    credit: Number(document.getElementById('credit').value),
    price: Number(document.getElementById('price').value),
    documentAllow: Number(document.getElementById('documentAllow').value),
    billingType: document.getElementById('billingType').value,
    pdfExport: document.getElementById('pdfExport').checked,
    pptExport: document.getElementById('pptExport').checked,
    branding: document.getElementById('branding').checked,
    teachingMode: document.getElementById('teachingMode').checked,
    feature: document.getElementById('feature').value
      .split(',')
      .map(f => f.trim())
      .filter(Boolean),
  });

  const swalBaseConfig = {
    background: '#1e293b',
    color: '#fff',
    confirmButtonColor: '#6366f1',
    showCancelButton: true,
    width: '520px',
  };

  const handleCreatePlan = async () => {
    const { value: formValues } = await Swal.fire({
      ...swalBaseConfig,
      title: 'Create New Plan',
      html: planFormHTML(),
      preConfirm: collectFormValues,
    });

    if (formValues && formValues.name && formValues.price) {
      try {
        await createPlan(formValues);
        Swal.fire('Created!', 'Plan added successfully.', 'success');
        fetchPlans();
      } catch (error) {
        Swal.fire('Error', 'Failed to create plan', 'error');
      }
    }
  };

  const handleEditPlan = async (plan) => {
    const { value: formValues } = await Swal.fire({
      ...swalBaseConfig,
      title: 'Edit Plan',
      html: planFormHTML(plan),
      preConfirm: collectFormValues,
    });

    if (formValues) {
      try {
        await updatePlan(plan._id, formValues);
        Swal.fire('Updated!', 'Plan updated successfully.', 'success');
        fetchPlans();
      } catch (error) {
        Swal.fire('Error', 'Failed to update plan', 'error');
      }
    }
  };

  if (loading) return <div className="text-center text-white p-20">Loading...</div>;

  return (
    <div className="section-view">
      <div className="text-center mb-10">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          Subscription Plans
        </h3>

        {/* Billing Type Filter Toggle */}
        <div className="inline-flex items-center bg-slate-800 rounded-full p-1 mb-6">
          <button
            onClick={() => setBillingFilter('monthly')}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              billingFilter === 'monthly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingFilter('yearly')}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              billingFilter === 'yearly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly
          </button>
        </div>

        <div className="block">
          <button
            onClick={handleCreatePlan}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition"
          >
            + Add New Plan
          </button>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <p className="text-center text-slate-400 mt-10">
          No {billingFilter} plans found. Click "Add New Plan" to create one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <div
              key={plan._id}
              className="glass p-8 rounded-3xl border border-white/10 flex flex-col"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-xl">{plan.name}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 capitalize">
                    {plan.billingType}
                  </span>
                </div>
                <p className="text-indigo-400 text-sm font-medium mt-1">
                  {plan.validity} Months • {plan.credit} Credits
                </p>
              </div>

              <div className="mb-4">
                <span className="text-4xl font-extrabold text-white">
                  ₹{plan.price}
                </span>
                <span className="text-slate-400 text-sm ml-1">
                  / {plan.billingType === 'yearly' ? 'yr' : 'mo'}
                </span>
              </div>

              <ul className="space-y-2 mb-4 text-sm text-slate-300">
                {plan.pdfExport && <li>✅ PDF Export</li>}
                {plan.pptExport && <li>✅ PPT Export</li>}
                {plan.branding && <li>✅ Branding</li>}
                {plan.teachingMode && <li>✅ Teaching Mode</li>}
                {plan.documentAllow > 0 && (
                  <li>📄 {plan.documentAllow} Documents Allowed</li>
                )}
              </ul>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.feature.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-slate-300"
                  >
                    <i className="ri-checkbox-circle-fill text-indigo-500 text-lg"></i>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleEditPlan(plan)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
              >
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pricing;