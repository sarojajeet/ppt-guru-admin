
// import React, { useState, useEffect } from 'react';
// import Swal from 'sweetalert2';
// import { createPlan, getPlans, updatePlan } from '@/services/createPlan';

// const Pricing = () => {
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [billingFilter, setBillingFilter] = useState('monthly'); // 'monthly' | 'yearly'

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

//   const filteredPlans = plans.filter(
//     (plan) => plan.billingType === billingFilter
//   );

//   const planFormHTML = (plan = {}) => `
//     <input id="name" class="swal2-input" placeholder="Plan Name" value="${plan.name || ''}">
//     <input id="validity" type="number" class="swal2-input" placeholder="Validity (months)" value="${plan.validity || ''}">
//     <input id="credit" type="number" class="swal2-input" placeholder="Credits" value="${plan.credit || ''}">
//     <input id="price" type="number" class="swal2-input" placeholder="Price" value="${plan.price || ''}">
//     <input id="documentAllow" type="number" class="swal2-input" placeholder="Documents Allowed" value="${plan.documentAllow || ''}">

//     <div style="text-align:left;margin:12px 16px 4px;color:#94a3b8;font-size:13px;font-weight:600;">
//       Billing Type
//     </div>
//     <select id="billingType" class="swal2-input" style="color:#fff;background:#0f172a;border:1px solid #334155;">
//       <option value="monthly" ${(!plan.billingType || plan.billingType === 'monthly') ? 'selected' : ''}>Monthly</option>
//       <option value="yearly" ${plan.billingType === 'yearly' ? 'selected' : ''}>Yearly</option>
//     </select>

//     <div style="text-align:left;color:white;margin-top:12px;padding:0 16px;">
//       <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
//         <input type="checkbox" id="pdfExport" ${plan.pdfExport ? 'checked' : ''}> PDF Export
//       </label>
//       <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
//         <input type="checkbox" id="pptExport" ${plan.pptExport ? 'checked' : ''}> PPT Export
//       </label>
//       <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
//         <input type="checkbox" id="branding" ${plan.branding ? 'checked' : ''}> Branding
//       </label>
//       <label style="display:flex;align-items:center;gap:8px;">
//         <input type="checkbox" id="teachingMode" ${plan.teachingMode ? 'checked' : ''}> Teaching Mode
//       </label>
//     </div>

//     <textarea id="feature" class="swal2-textarea" placeholder="Features (comma separated)">${plan.feature ? plan.feature.join(', ') : ''}</textarea>
//   `;

//   const collectFormValues = () => ({
//     name: document.getElementById('name').value,
//     validity: Number(document.getElementById('validity').value),
//     credit: Number(document.getElementById('credit').value),
//     price: Number(document.getElementById('price').value),
//     documentAllow: Number(document.getElementById('documentAllow').value),
//     billingType: document.getElementById('billingType').value,
//     pdfExport: document.getElementById('pdfExport').checked,
//     pptExport: document.getElementById('pptExport').checked,
//     branding: document.getElementById('branding').checked,
//     teachingMode: document.getElementById('teachingMode').checked,
//     feature: document.getElementById('feature').value
//       .split(',')
//       .map(f => f.trim())
//       .filter(Boolean),
//   });

//   const swalBaseConfig = {
//     background: '#1e293b',
//     color: '#fff',
//     confirmButtonColor: '#6366f1',
//     showCancelButton: true,
//     width: '520px',
//   };

//   const handleCreatePlan = async () => {
//     const { value: formValues } = await Swal.fire({
//       ...swalBaseConfig,
//       title: 'Create New Plan',
//       html: planFormHTML(),
//       preConfirm: collectFormValues,
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
//       ...swalBaseConfig,
//       title: 'Edit Plan',
//       html: planFormHTML(plan),
//       preConfirm: collectFormValues,
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
//         <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
//           Subscription Plans
//         </h3>

//         {/* Billing Type Filter Toggle */}
//         <div className="inline-flex items-center bg-slate-800 rounded-full p-1 mb-6">
//           <button
//             onClick={() => setBillingFilter('monthly')}
//             className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
//               billingFilter === 'monthly'
//                 ? 'bg-indigo-600 text-white shadow'
//                 : 'text-slate-400 hover:text-white'
//             }`}
//           >
//             Monthly
//           </button>
//           <button
//             onClick={() => setBillingFilter('yearly')}
//             className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
//               billingFilter === 'yearly'
//                 ? 'bg-indigo-600 text-white shadow'
//                 : 'text-slate-400 hover:text-white'
//             }`}
//           >
//             Yearly
//           </button>
//         </div>

//         <div className="block">
//           <button
//             onClick={handleCreatePlan}
//             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition"
//           >
//             + Add New Plan
//           </button>
//         </div>
//       </div>

//       {filteredPlans.length === 0 ? (
//         <p className="text-center text-slate-400 mt-10">
//           No {billingFilter} plans found. Click "Add New Plan" to create one.
//         </p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
//           {filteredPlans.map((plan) => (
//             <div
//               key={plan._id}
//               className="glass p-8 rounded-3xl border border-white/10 flex flex-col"
//             >
//               <div className="mb-4">
//                 <div className="flex items-center justify-between">
//                   <h4 className="text-white font-bold text-xl">{plan.name}</h4>
//                   <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 capitalize">
//                     {plan.billingType}
//                   </span>
//                 </div>
//                 <p className="text-indigo-400 text-sm font-medium mt-1">
//                   {plan.validity} Months • {plan.credit} Credits
//                 </p>
//               </div>

//               <div className="mb-4">
//                 <span className="text-4xl font-extrabold text-white">
//                   ₹{plan.price}
//                 </span>
//                 <span className="text-slate-400 text-sm ml-1">
//                   / {plan.billingType === 'yearly' ? 'yr' : 'mo'}
//                 </span>
//               </div>

//               <ul className="space-y-2 mb-4 text-sm text-slate-300">
//                 {plan.pdfExport && <li>✅ PDF Export</li>}
//                 {plan.pptExport && <li>✅ PPT Export</li>}
//                 {plan.branding && <li>✅ Branding</li>}
//                 {plan.teachingMode && <li>✅ Teaching Mode</li>}
//                 {plan.documentAllow > 0 && (
//                   <li>📄 {plan.documentAllow} Documents Allowed</li>
//                 )}
//               </ul>

//               <ul className="space-y-3 mb-6 flex-1">
//                 {plan.feature.map((f, i) => (
//                   <li
//                     key={i}
//                     className="flex items-center gap-3 text-sm text-slate-300"
//                   >
//                     <i className="ri-checkbox-circle-fill text-indigo-500 text-lg"></i>
//                     {f}
//                   </li>
//                 ))}
//               </ul>

//               <button
//                 onClick={() => handleEditPlan(plan)}
//                 className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
//               >
//                 Edit Plan
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Pricing;
import React, { useState, useEffect, useRef } from 'react';
import { createPlan, getPlans, updatePlan } from '@/services/createPlan';

/* ─── tiny helpers ─────────────────────────────────── */
const cls = (...a) => a.filter(Boolean).join(' ');

const FEATURE_ICONS = {
  pdfExport:    { icon: '⬡', label: 'PDF Export' },
  pptExport:    { icon: '⬡', label: 'PPT Export' },
  textExport:   { icon: '⬡', label: 'Text Export' },
  docxExport:   { icon: '⬡', label: 'DOCX Export' },
  branding:     { icon: '⬡', label: 'Branding' },
  teachingMode: { icon: '⬡', label: 'Teaching Mode' },
};

const EMPTY = {
  name: '', validity: '', credit: '', price: '',
  documentAllow: '', slideCount: '', billingType: 'monthly',
  isFree: false, pdfExport: false, pptExport: false,
  textExport: false, docxExport: false, branding: false,
  teachingMode: false, feature: '',
};

/* ─── Notification toast ────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position:'fixed', bottom:32, right:32, zIndex:9999,
      display:'flex', alignItems:'center', gap:12,
      background: type==='success' ? '#0f766e' : '#be123c',
      color:'#fff', padding:'14px 20px', borderRadius:14,
      boxShadow:'0 8px 32px rgba(0,0,0,.45)',
      animation:'slideUp .3s cubic-bezier(.16,1,.3,1)',
      fontFamily:'inherit', fontSize:14, fontWeight:600,
    }}>
      <span style={{fontSize:20}}>{type==='success' ? '✓' : '✕'}</span>
      {msg}
    </div>
  );
}

/* ─── Toggle switch ─────────────────────────────────── */
function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} style={{
      display:'flex', alignItems:'center', gap:12,
      cursor:'pointer', userSelect:'none',
    }}>
      <span style={{
        position:'relative', width:42, height:24,
        background: checked ? '#6366f1' : '#334155',
        borderRadius:99, transition:'background .2s',
        flexShrink:0,
      }}>
        <span style={{
          position:'absolute', top:3, left: checked ? 21 : 3,
          width:18, height:18, borderRadius:'50%',
          background:'#fff', transition:'left .2s',
          boxShadow:'0 1px 4px rgba(0,0,0,.3)',
        }}/>
        <input
          type="checkbox" id={id} checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{position:'absolute',opacity:0,width:0,height:0}}
        />
      </span>
      <span style={{fontSize:13.5, color:'#cbd5e1', fontWeight:500}}>{label}</span>
    </label>
  );
}

/* ─── Form Field ────────────────────────────────────── */
function Field({ label, children, hint }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <label style={{fontSize:12, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase'}}>
        {label}
      </label>
      {children}
      {hint && <span style={{fontSize:11, color:'#475569'}}>{hint}</span>}
    </div>
  );
}

const inputStyle = {
  background:'#0f172a', border:'1.5px solid #1e293b',
  borderRadius:10, color:'#f1f5f9', fontSize:14,
  padding:'10px 14px', outline:'none', width:'100%',
  fontFamily:'inherit', transition:'border-color .15s',
};

/* ─── Plan Drawer ───────────────────────────────────── */
function PlanDrawer({ plan, onClose, onSaved }) {
  const isEdit = Boolean(plan?._id);
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...plan,
    feature: Array.isArray(plan?.feature) ? plan.feature.join(', ') : (plan?.feature || ''),
  }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const drawerRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Plan name is required';
    if (!form.validity) e.validity = 'Validity is required';
    if (!form.credit) e.credit = 'Credits are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      validity: Number(form.validity),
      credit: Number(form.credit),
      price: Number(form.price),
      documentAllow: Number(form.documentAllow),
      slideCount: Number(form.slideCount),
      feature: form.feature.split(',').map(f => f.trim()).filter(Boolean),
    };
    try {
      if (isEdit) await updatePlan(plan._id, payload);
      else await createPlan(payload);
      onSaved(isEdit ? 'updated' : 'created');
    } catch {
      onSaved(null);
    } finally {
      setSaving(false);
    }
  };

  /* click-outside */
  useEffect(() => {
    const handler = e => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const inputF = (k, type='text', placeholder='') => (
    <input
      type={type}
      value={form[k]}
      placeholder={placeholder}
      onChange={e => set(k, e.target.value)}
      style={{
        ...inputStyle,
        borderColor: errors[k] ? '#f43f5e' : '#1e293b',
      }}
      onFocus={e => { e.target.style.borderColor = errors[k] ? '#f43f5e' : '#6366f1'; }}
      onBlur={e => { e.target.style.borderColor = errors[k] ? '#f43f5e' : '#1e293b'; }}
    />
  );

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position:'fixed', inset:0, background:'rgba(2,6,23,.75)',
        backdropFilter:'blur(4px)', zIndex:1000,
        animation:'fadeIn .2s ease',
      }}/>

      {/* Drawer */}
      <div ref={drawerRef} style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:'min(520px, 100vw)', background:'#0f172a',
        borderLeft:'1px solid #1e293b', zIndex:1001,
        display:'flex', flexDirection:'column',
        animation:'slideInRight .3s cubic-bezier(.16,1,.3,1)',
        fontFamily:'"DM Sans", system-ui, sans-serif',
      }}>

        {/* Header */}
        <div style={{
          padding:'28px 32px 24px',
          borderBottom:'1px solid #1e293b',
          display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          flexShrink:0,
        }}>
          <div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'#1e293b', borderRadius:8,
              padding:'5px 12px', marginBottom:12,
            }}>
              <span style={{fontSize:11, fontWeight:700, color:'#6366f1', letterSpacing:'.08em', textTransform:'uppercase'}}>
                {isEdit ? 'Edit Plan' : 'New Plan'}
              </span>
            </div>
            <h2 style={{fontSize:22, fontWeight:800, color:'#f8fafc', margin:0, lineHeight:1.2}}>
              {isEdit ? `Editing "${plan.name}"` : 'Create a subscription plan'}
            </h2>
            <p style={{fontSize:13, color:'#64748b', margin:'6px 0 0'}}>
              Fill in the details below to {isEdit ? 'update this' : 'publish a new'} plan.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background:'#1e293b', border:'none', color:'#94a3b8',
              width:36, height:36, borderRadius:10, cursor:'pointer',
              fontSize:18, display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0, marginTop:4,
              transition:'background .15s',
            }}
            onMouseEnter={e => e.target.style.background='#334155'}
            onMouseLeave={e => e.target.style.background='#1e293b'}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:24}}>

          {/* Plan Name */}
          <Field label="Plan Name">
            {inputF('name', 'text', 'e.g. Pro, Starter, Business')}
            {errors.name && <span style={{fontSize:12,color:'#f43f5e'}}>{errors.name}</span>}
          </Field>

          {/* Billing Type pill toggle */}
          <Field label="Billing Cycle">
            <div style={{
              display:'inline-flex', background:'#1e293b',
              borderRadius:10, padding:4, gap:4,
            }}>
              {['monthly','yearly'].map(t => (
                <button key={t} onClick={() => set('billingType', t)} style={{
                  padding:'8px 22px', borderRadius:8, border:'none',
                  fontFamily:'inherit', fontSize:13, fontWeight:700,
                  cursor:'pointer', transition:'all .2s',
                  background: form.billingType===t ? '#6366f1' : 'transparent',
                  color: form.billingType===t ? '#fff' : '#64748b',
                  textTransform:'capitalize',
                }}>
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Row: validity + credit */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <Field label="Validity (months)">
              {inputF('validity', 'number', '1')}
              {errors.validity && <span style={{fontSize:12,color:'#f43f5e'}}>{errors.validity}</span>}
            </Field>
            <Field label="Credits">
              {inputF('credit', 'number', '100')}
              {errors.credit && <span style={{fontSize:12,color:'#f43f5e'}}>{errors.credit}</span>}
            </Field>
          </div>

          {/* Row: price + doc allow */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <Field label="Price (₹)" hint="Set 0 for free plans">
              {inputF('price', 'number', '0')}
            </Field>
            <Field label="Documents Allowed">
              {inputF('documentAllow', 'number', '10')}
            </Field>
          </div>

          {/* Slide count */}
          <Field label="Slide Count">
            {inputF('slideCount', 'number', '20')}
          </Field>

          {/* Divider */}
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <div style={{flex:1, height:1, background:'#1e293b'}}/>
            <span style={{fontSize:11, color:'#475569', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase'}}>Capabilities</span>
            <div style={{flex:1, height:1, background:'#1e293b'}}/>
          </div>

          {/* Toggles */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <Toggle id="isFree"       checked={form.isFree}       onChange={v=>set('isFree',v)}       label="Free Plan" />
            <Toggle id="pdfExport"    checked={form.pdfExport}    onChange={v=>set('pdfExport',v)}    label="PDF Export" />
            <Toggle id="pptExport"    checked={form.pptExport}    onChange={v=>set('pptExport',v)}    label="PPT Export" />
            <Toggle id="textExport"   checked={form.textExport}   onChange={v=>set('textExport',v)}   label="Text Export" />
            <Toggle id="docxExport"   checked={form.docxExport}   onChange={v=>set('docxExport',v)}   label="DOCX Export" />
            <Toggle id="branding"     checked={form.branding}     onChange={v=>set('branding',v)}     label="Branding" />
            <Toggle id="teachingMode" checked={form.teachingMode} onChange={v=>set('teachingMode',v)} label="Teaching Mode" />
          </div>

          {/* Features textarea */}
          <Field label="Feature highlights" hint="Separate features with commas">
            <textarea
              value={form.feature}
              onChange={e => set('feature', e.target.value)}
              placeholder="e.g. Priority support, Custom templates, Analytics"
              rows={3}
              style={{
                ...inputStyle,
                resize:'vertical', lineHeight:1.6,
              }}
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='#1e293b'}
            />
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          padding:'20px 32px', borderTop:'1px solid #1e293b',
          display:'flex', gap:12, flexShrink:0,
          background:'#0a1120',
        }}>
          <button onClick={onClose} style={{
            flex:1, padding:'13px', borderRadius:12,
            background:'#1e293b', border:'none', color:'#94a3b8',
            fontSize:14, fontWeight:700, cursor:'pointer',
            fontFamily:'inherit', transition:'background .15s',
          }}
          onMouseEnter={e=>e.target.style.background='#334155'}
          onMouseLeave={e=>e.target.style.background='#1e293b'}
          >Cancel</button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex:2, padding:'13px', borderRadius:12,
              background: saving ? '#4338ca' : 'linear-gradient(135deg,#6366f1,#818cf8)',
              border:'none', color:'#fff',
              fontSize:14, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', transition:'opacity .15s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 4px 20px rgba(99,102,241,.35)',
            }}
          >
            {saving
              ? <><Spinner/> Saving…</>
              : isEdit ? '✓ Update Plan' : '+ Publish Plan'
            }
          </button>
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <span style={{
      width:16, height:16, border:'2px solid rgba(255,255,255,.3)',
      borderTopColor:'#fff', borderRadius:'50%',
      display:'inline-block', animation:'spin .6s linear infinite',
    }}/>
  );
}

/* ─── Plan Card ─────────────────────────────────────── */
function PlanCard({ plan, onEdit }) {
  const caps = Object.entries(FEATURE_ICONS)
    .filter(([k]) => plan[k])
    .map(([, v]) => v.label);

  return (
    <div style={{
      background:'linear-gradient(160deg,#111827 0%,#0d1526 100%)',
      border:'1px solid #1e293b', borderRadius:20,
      padding:'28px', display:'flex', flexDirection:'column',
      transition:'transform .2s, box-shadow .2s',
      cursor:'default',
    }}
    onMouseEnter={e=>{
      e.currentTarget.style.transform='translateY(-4px)';
      e.currentTarget.style.boxShadow='0 20px 48px rgba(99,102,241,.15)';
      e.currentTarget.style.borderColor='#334155';
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.transform='translateY(0)';
      e.currentTarget.style.boxShadow='none';
      e.currentTarget.style.borderColor='#1e293b';
    }}>

      {/* Top row */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
        <div>
          <div style={{display:'flex', gap:8, marginBottom:8, flexWrap:'wrap'}}>
            {plan.isFree && (
              <span style={{
                fontSize:11, fontWeight:800, padding:'3px 10px',
                borderRadius:99, background:'#064e3b', color:'#34d399',
                letterSpacing:'.04em', textTransform:'uppercase',
              }}>Free</span>
            )}
            <span style={{
              fontSize:11, fontWeight:800, padding:'3px 10px',
              borderRadius:99, background:'#1e1b4b', color:'#818cf8',
              letterSpacing:'.04em', textTransform:'uppercase',
            }}>{plan.billingType}</span>
          </div>
          <h4 style={{fontSize:20, fontWeight:800, color:'#f8fafc', margin:0}}>{plan.name}</h4>
        </div>
        <button onClick={() => onEdit(plan)} style={{
          background:'#1e293b', border:'none', borderRadius:10,
          color:'#94a3b8', padding:'8px 14px', fontSize:12, fontWeight:700,
          cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
          display:'flex', alignItems:'center', gap:6,
          whiteSpace:'nowrap',
        }}
        onMouseEnter={e=>{e.target.style.background='#334155'; e.target.style.color='#fff';}}
        onMouseLeave={e=>{e.target.style.background='#1e293b'; e.target.style.color='#94a3b8';}}>
          ✎ Edit
        </button>
      </div>

      {/* Price */}
      <div style={{
        padding:'18px', borderRadius:14, background:'#0a0f1e',
        border:'1px solid #1e293b', marginBottom:20, textAlign:'center',
      }}>
        <div style={{fontSize:38, fontWeight:900, color:'#f1f5f9', lineHeight:1}}>
          {plan.isFree ? 'Free' : `₹${plan.price}`}
        </div>
        {!plan.isFree && (
          <div style={{fontSize:12, color:'#64748b', marginTop:4}}>
            per {plan.billingType === 'yearly' ? 'year' : 'month'}
          </div>
        )}
        <div style={{
          display:'flex', justifyContent:'center', gap:16, marginTop:12,
          fontSize:12, color:'#64748b',
        }}>
          <span>🗓 {plan.validity} mo</span>
          <span style={{color:'#334155'}}>|</span>
          <span>⚡ {plan.credit} credits</span>
          {plan.documentAllow > 0 && <><span style={{color:'#334155'}}>|</span><span>📄 {plan.documentAllow} docs</span></>}
        </div>
      </div>

      {/* Capabilities chips */}
      {caps.length > 0 && (
        <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:16}}>
          {caps.map(c => (
            <span key={c} style={{
              fontSize:11, fontWeight:600, padding:'4px 10px',
              borderRadius:99, background:'#0f1f3d',
              color:'#93c5fd', border:'1px solid #1e3a5f',
            }}>✓ {c}</span>
          ))}
          {plan.slideCount > 0 && (
            <span style={{
              fontSize:11, fontWeight:600, padding:'4px 10px',
              borderRadius:99, background:'#130d2e',
              color:'#c4b5fd', border:'1px solid #2e1d6b',
            }}>🖼 {plan.slideCount} slides</span>
          )}
        </div>
      )}

      {/* Feature list */}
      {plan.feature?.length > 0 && (
        <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8}}>
          {plan.feature.map((f, i) => (
            <li key={i} style={{display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#94a3b8'}}>
              <span style={{
                width:18, height:18, borderRadius:'50%',
                background:'#1e293b', color:'#6366f1',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:900, flexShrink:0,
              }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────── */
const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingFilter, setBillingFilter] = useState('monthly');
  const [drawer, setDrawer] = useState(null); // null | {} | plan obj
  const [toast, setToast] = useState(null);

  const fetchPlans = async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const filteredPlans = plans.filter(p => p.billingType === billingFilter);

  const handleSaved = async (result) => {
    setDrawer(null);
    if (result) {
      setToast({ msg: `Plan ${result} successfully!`, type: 'success' });
      await fetchPlans();
    } else {
      setToast({ msg: 'Something went wrong. Please try again.', type: 'error' });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 99px; }
      `}</style>

      <div style={{
        fontFamily:'"DM Sans", system-ui, sans-serif',
        minHeight:'100vh', background:'#060b18',
        padding:'48px 24px',
      }}>
        {/* Page Header */}
        <div style={{textAlign:'center', maxWidth:640, margin:'0 auto 48px'}}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'#111827', border:'1px solid #1e293b',
            borderRadius:99, padding:'6px 16px', marginBottom:20,
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#6366f1',display:'inline-block'}}/>
            <span style={{fontSize:12,fontWeight:700,color:'#94a3b8',letterSpacing:'.08em',textTransform:'uppercase'}}>
              Subscription Plans
            </span>
          </div>

          <h1 style={{
            fontSize:36, fontWeight:900, color:'#f8fafc',
            margin:'0 0 12px', lineHeight:1.15,
            background:'linear-gradient(135deg,#f8fafc,#94a3b8)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            Manage Your Plans
          </h1>
          <p style={{fontSize:15, color:'#64748b', margin:0}}>
            Create and manage subscription tiers for your users.
          </p>
        </div>

        {/* Controls bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          maxWidth:1100, margin:'0 auto 36px', flexWrap:'wrap', gap:16,
        }}>
          {/* Billing toggle */}
          <div style={{
            display:'inline-flex', background:'#0f172a',
            border:'1px solid #1e293b', borderRadius:12, padding:4, gap:4,
          }}>
            {['monthly','yearly'].map(t => (
              <button key={t} onClick={() => setBillingFilter(t)} style={{
                padding:'9px 24px', borderRadius:9, border:'none',
                fontFamily:'"DM Sans",system-ui,sans-serif', fontSize:13, fontWeight:700,
                cursor:'pointer', transition:'all .2s', textTransform:'capitalize',
                background: billingFilter===t ? '#6366f1' : 'transparent',
                color: billingFilter===t ? '#fff' : '#475569',
                boxShadow: billingFilter===t ? '0 2px 12px rgba(99,102,241,.35)' : 'none',
              }}>{t}</button>
            ))}
          </div>

          {/* Create button */}
          <button onClick={() => setDrawer({})} style={{
            display:'flex', alignItems:'center', gap:8,
            background:'linear-gradient(135deg,#6366f1,#818cf8)',
            border:'none', color:'#fff', padding:'10px 22px',
            borderRadius:12, fontSize:13, fontWeight:800,
            cursor:'pointer', fontFamily:'"DM Sans",system-ui,sans-serif',
            boxShadow:'0 4px 20px rgba(99,102,241,.35)',
            transition:'opacity .15s, transform .15s',
          }}
          onMouseEnter={e=>{e.target.style.opacity='.85'; e.target.style.transform='translateY(-1px)';}}
          onMouseLeave={e=>{e.target.style.opacity='1'; e.target.style.transform='translateY(0)';}}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> Add New Plan
          </button>
        </div>

        {/* Cards / Empty state */}
        <div style={{maxWidth:1100, margin:'0 auto'}}>
          {loading ? (
            <div style={{textAlign:'center', padding:'80px 0'}}>
              <Spinner/>
              <p style={{color:'#475569', marginTop:16, fontSize:14}}>Loading plans…</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div style={{
              textAlign:'center', padding:'80px 40px',
              border:'1px dashed #1e293b', borderRadius:20,
              color:'#475569',
            }}>
              <div style={{fontSize:40, marginBottom:16}}>📭</div>
              <p style={{fontSize:15, fontWeight:600, color:'#64748b', margin:'0 0 6px'}}>
                No {billingFilter} plans yet
              </p>
              <p style={{fontSize:13, color:'#334155', margin:'0 0 24px'}}>
                Click "Add New Plan" to create your first {billingFilter} subscription.
              </p>
              <button onClick={() => setDrawer({})} style={{
                background:'#1e293b', border:'none', color:'#94a3b8',
                padding:'10px 24px', borderRadius:10, fontSize:13,
                fontWeight:700, cursor:'pointer', fontFamily:'"DM Sans",system-ui,sans-serif',
              }}>+ Create Plan</button>
            </div>
          ) : (
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',
              gap:24,
            }}>
              {filteredPlans.map(plan => (
                <PlanCard key={plan._id} plan={plan} onEdit={p => setDrawer(p)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawer !== null && (
        <PlanDrawer
          plan={Object.keys(drawer).length ? drawer : null}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </>
  );
};

export default Pricing;