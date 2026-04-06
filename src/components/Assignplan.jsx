import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAllUsers } from '@/services/userApi';
import { getPlans } from '@/services/createPlan';
import axios from 'axios';


const API = axios.create({
    // baseURL: "http://localhost:5000/api",

    baseURL: "https://seashell-app-98hn3.ondigitalocean.app/api",
    // baseURL: "https://lionfish-app-pk8s6.ondigitalocean.app/api",
});
/* ─── API helper ─────────────────────────────────────── */
const assignPlanByAdmin = (userId, planId) =>
  API.post('/payment/admin/assign-plan', { userId, planId });

/* ─── Utility ────────────────────────────────────────── */
const S = (base, extra = {}) => ({ ...base, ...extra });
const font = '"Sora", system-ui, sans-serif';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Toast ──────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  const colors = type === 'success'
    ? { bg: 'linear-gradient(135deg,#065f46,#047857)', icon: '✓' }
    : { bg: 'linear-gradient(135deg,#7f1d1d,#b91c1c)', icon: '✕' };
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: colors.bg, color: '#fff',
      padding: '14px 22px', borderRadius: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideUp .35s cubic-bezier(.16,1,.3,1)',
      fontFamily: font, fontSize: 14, fontWeight: 600,
      maxWidth: 360,
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'rgba(255,255,255,.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, flexShrink: 0,
      }}>{colors.icon}</span>
      {msg}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────── */
function Avatar({ name = '', size = 40 }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},55%,28%)`,
      border: `2px solid hsl(${hue},55%,38%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color: `hsl(${hue},80%,80%)`,
      letterSpacing: '-.02em',
    }}>{initials}</div>
  );
}

/* ─── Spinner ────────────────────────────────────────── */
function Spinner({ size = 18, color = '#6366f1' }) {
  return (
    <span style={{
      width: size, height: size, display: 'inline-block',
      border: `2px solid rgba(255,255,255,.15)`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin .65s linear infinite', flexShrink: 0,
    }} />
  );
}

/* ─── Assign Drawer ──────────────────────────────────── */
function AssignDrawer({ user, plans, onClose, onDone }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleAssign = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      await assignPlanByAdmin(user._id, selectedPlan._id);
      onDone('success', `"${selectedPlan.name}" assigned to ${user.fullname || user.email}`);
    } catch {
      onDone('error', 'Failed to assign plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const monthly = plans.filter(p => p.billingType === 'monthly');
  const yearly = plans.filter(p => p.billingType === 'yearly');

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(2,6,20,.8)', backdropFilter: 'blur(6px)',
        zIndex: 1000, animation: 'fadeIn .2s ease',
      }} />
      <div ref={ref} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px,100vw)',
        background: 'linear-gradient(180deg,#0c1322 0%,#080e1a 100%)',
        borderLeft: '1px solid #1a2540',
        zIndex: 1001, display: 'flex', flexDirection: 'column',
        fontFamily: font,
        animation: 'slideInRight .32s cubic-bezier(.16,1,.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '28px 28px 22px',
          borderBottom: '1px solid #1a2540',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '.1em',
              textTransform: 'uppercase', color: '#4f6ef7',
              background: '#0d1535', padding: '4px 12px', borderRadius: 99,
              marginBottom: 16, display: 'inline-block',
            }}>Assign Plan</div>
            <button onClick={onClose} style={{
              background: '#1a2540', border: 'none', color: '#64748b',
              width: 34, height: 34, borderRadius: 9, cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#0d1535', borderRadius: 14, padding: '14px 16px',
            border: '1px solid #1a2540',
          }}>
            <Avatar name={user.fullname || user.email} size={46} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>
                {user.fullname || '—'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
              {user.phone && (
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>📞 {user.phone}</div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                background: '#0a2214', color: '#34d399', border: '1px solid #14532d',
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>User</span>
            </div>
          </div>
        </div>

        {/* Plan list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[{ label: 'Monthly Plans', items: monthly }, { label: 'Yearly Plans', items: yearly }]
            .filter(g => g.items.length > 0)
            .map(group => (
              <div key={group.label}>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: '#475569',
                  letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12,
                }}>{group.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map(plan => {
                    const active = selectedPlan?._id === plan._id;
                    return (
                      <div key={plan._id} onClick={() => setSelectedPlan(plan)} style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                        background: active ? '#0d1b45' : '#0d1322',
                        border: `1.5px solid ${active ? '#4f6ef7' : '#1a2540'}`,
                        transition: 'all .18s',
                        boxShadow: active ? '0 0 0 3px rgba(79,110,247,.12)' : 'none',
                      }}>
                        {/* Radio */}
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${active ? '#4f6ef7' : '#334155'}`,
                          background: active ? '#4f6ef7' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s',
                        }}>
                          {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                        </div>

                        {/* Plan details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{plan.name}</span>
                            {plan.isFree && (
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                                background: '#052e16', color: '#4ade80', border: '1px solid #14532d',
                              }}>FREE</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12 }}>
                            <span>⚡ {plan.credit} credits</span>
                            <span>🗓 {plan.validity}mo</span>
                            {plan.documentAllow > 0 && <span>📄 {plan.documentAllow} docs</span>}
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: active ? '#818cf8' : '#94a3b8' }}>
                            {plan.isFree ? 'Free' : `₹${plan.price}`}
                          </div>
                          <div style={{ fontSize: 11, color: '#334155' }}>
                            /{plan.billingType === 'yearly' ? 'yr' : 'mo'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 28px', borderTop: '1px solid #1a2540',
          background: '#070c18', flexShrink: 0, display: 'flex', gap: 10,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 12, border: 'none',
            background: '#1a2540', color: '#94a3b8', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: font,
            transition: 'background .15s',
          }}
            onMouseEnter={e => e.target.style.background = '#253452'}
            onMouseLeave={e => e.target.style.background = '#1a2540'}
          >Cancel</button>

          <button onClick={handleAssign} disabled={!selectedPlan || saving} style={{
            flex: 2, padding: '12px', borderRadius: 12, border: 'none',
            background: !selectedPlan
              ? '#1a2540'
              : 'linear-gradient(135deg,#4f6ef7,#818cf8)',
            color: !selectedPlan ? '#475569' : '#fff',
            fontSize: 13, fontWeight: 800,
            cursor: !selectedPlan || saving ? 'not-allowed' : 'pointer',
            fontFamily: font, transition: 'all .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: selectedPlan ? '0 4px 20px rgba(79,110,247,.3)' : 'none',
          }}>
            {saving ? <><Spinner /><span>Assigning…</span></> : '⚡ Assign Plan'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─────────────────────────────────── */
const AssignPlan = () => {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page, limit: 10, search: debouncedSearch });
      const d = res.data;
      setUsers(d.users || []);
      setTotalPages(d.totalPages || 1);
      setTotalUsers(d.totalUsers || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    getPlans().then(setPlans).catch(console.error);
  }, []);

  const handleDone = (type, msg) => {
    setSelectedUser(null);
    setToast({ type, msg });
    if (type === 'success') fetchUsers();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#080e1a;}
        ::-webkit-scrollbar-thumb{background:#1a2540;border-radius:99px;}
        .row-hover:hover{background:#0d1535 !important;border-color:#253452 !important;}
        .assign-btn:hover{background:#4f6ef7 !important;color:#fff !important;}
        .pg-btn:hover:not(:disabled){background:#253452 !important;}
      `}</style>

      <div style={{
        fontFamily: font, minHeight: '100vh',
        background: '#060c18', color: '#f1f5f9',
        padding: '40px 28px',
      }}>

        {/* Page header */}
        <div style={{ maxWidth: 1000, margin: '0 auto 36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#0d1535', border: '1px solid #1a2540',
            borderRadius: 99, padding: '5px 14px', marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f6ef7', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '.09em', textTransform: 'uppercase' }}>
              Admin Panel
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{
                fontSize: 30, fontWeight: 900, margin: '0 0 6px',
                background: 'linear-gradient(135deg,#f1f5f9 30%,#94a3b8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Assign Plans to Users</h1>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                Search for a user and manually assign a subscription plan.
              </p>
            </div>
            <div style={{
              background: '#0d1535', border: '1px solid #1a2540',
              borderRadius: 12, padding: '10px 18px', fontSize: 13,
              color: '#64748b', fontWeight: 600,
            }}>
              {totalUsers.toLocaleString()} <span style={{ color: '#334155' }}>total users</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ maxWidth: 1000, margin: '0 auto 24px', position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: '#334155', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            style={{
              width: '100%', background: '#0d1322', border: '1.5px solid #1a2540',
              borderRadius: 14, color: '#f1f5f9', fontSize: 14,
              padding: '14px 18px 14px 46px', outline: 'none', fontFamily: font,
              transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#4f6ef7'}
            onBlur={e => e.target.style.borderColor = '#1a2540'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: '#1a2540', border: 'none', color: '#64748b',
              width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          )}
        </div>

        {/* Table */}
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          background: '#0a1020', border: '1px solid #1a2540',
          borderRadius: 20, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 140px 100px',
            padding: '12px 24px', borderBottom: '1px solid #1a2540',
            background: '#060c18',
          }}>
            {['User', 'Email', 'Phone', 'Action'].map(h => (
              <div key={h} style={{
                fontSize: 11, fontWeight: 800, color: '#334155',
                letterSpacing: '.08em', textTransform: 'uppercase',
                textAlign: h === 'Action' ? 'center' : 'left',
              }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Spinner size={28} color='#4f6ef7' />
              <span style={{ fontSize: 13, color: '#334155' }}>Loading users…</span>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 }}>No users found</div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                {search ? `No results for "${search}"` : 'No users in the system yet.'}
              </div>
            </div>
          ) : (
            users.map((user, i) => (
              <div key={user._id} className="row-hover" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 140px 100px',
                padding: '14px 24px', alignItems: 'center',
                borderBottom: i < users.length - 1 ? '1px solid #0d1535' : 'none',
                background: 'transparent', border: '1px solid transparent',
                transition: 'background .15s, border-color .15s',
                animation: `slideUp .25s ${i * 0.04}s both`,
              }}>
                {/* Name + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <Avatar name={user.fullname || user.email} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullname || '—'}
                    </div>
                    {user.createdAt && (
                      <div style={{ fontSize: 11, color: '#334155' }}>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                  {user.email}
                </div>

                {/* Phone */}
                <div style={{ fontSize: 13, color: '#475569' }}>
                  {user.phone || <span style={{ color: '#1e293b' }}>—</span>}
                </div>

                {/* Assign button */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    className="assign-btn"
                    onClick={() => setSelectedUser(user)}
                    style={{
                      background: '#0d1535', border: '1px solid #253452',
                      color: '#818cf8', padding: '7px 14px', borderRadius: 9,
                      fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      fontFamily: font, transition: 'all .15s',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⚡</span> Assign
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            maxWidth: 1000, margin: '24px auto 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <PgBtn disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</PgBtn>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)} className="pg-btn" style={{
                  width: 36, height: 36, borderRadius: 9, border: 'none',
                  background: p === page ? '#4f6ef7' : '#0d1322',
                  color: p === page ? '#fff' : '#475569',
                  fontFamily: font, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'background .15s',
                  boxShadow: p === page ? '0 0 0 3px rgba(79,110,247,.2)' : 'none',
                }}>{p}</button>
              );
            })}

            <PgBtn disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</PgBtn>

            <span style={{ fontSize: 12, color: '#334155', marginLeft: 8 }}>
              Page {page} of {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Assign Drawer */}
      {selectedUser && (
        <AssignDrawer
          user={selectedUser}
          plans={plans}
          onClose={() => setSelectedUser(null)}
          onDone={handleDone}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
};

function PgBtn({ disabled, onClick, children }) {
  return (
    <button onClick={onClick} disabled={disabled} className="pg-btn" style={{
      padding: '8px 14px', borderRadius: 9, border: 'none',
      background: '#0d1322', color: disabled ? '#1e293b' : '#64748b',
      fontFamily: font, fontSize: 12, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .15s',
    }}>{children}</button>
  );
}

export default AssignPlan;