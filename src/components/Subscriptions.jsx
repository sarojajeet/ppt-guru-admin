import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "https://lionfish-app-pk8s6.ondigitalocean.app/api/payment/admin/subscriptions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-400",
  },
  EXPIRED: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    ring: "ring-red-500/30",
    dot: "bg-red-400",
  },
  PENDING: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "bg-indigo-500/20 text-indigo-400",
  "bg-teal-500/20 text-teal-400",
  "bg-pink-500/20 text-pink-400",
  "bg-violet-500/20 text-violet-400",
  "bg-sky-500/20 text-sky-400",
];
const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const daysLeft = (expiry) => {
  const diff = new Date(expiry) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ExpiryBar = ({ activatedAt, expiry, status }) => {
  if (status !== "ACTIVE") return null;
  const total = new Date(expiry) - new Date(activatedAt);
  const elapsed = new Date() - new Date(activatedAt);
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const left = daysLeft(expiry);
  const color =
    left <= 7 ? "bg-red-500" : left <= 30 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mt-1">
      <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{left}d left</p>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm transition"
      >
        ←
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
            p === current
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm transition"
      >
        →
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, sort, search };
      const { data } = await axios.get(API, { params });
      setSubscriptions(data.subscriptions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [page, sort, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, sort, statusFilter]);

  // client-side status filter (since backend doesn't expose status filter param)
  const visible = subscriptions.filter((s) =>
    statusFilter === "ALL" ? true : s.status === statusFilter
  );

  // ── Stats ──
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const expiredCount = subscriptions.filter((s) => s.status === "EXPIRED").length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="section-view">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
            Subscriptions
          </h3>
          <p className="text-slate-400 text-sm">
            Manage all user plan subscriptions.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-sm font-semibold transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, color: "text-white" },
          { label: "Active", value: activeCount, color: "text-emerald-400" },
          { label: "Expired", value: expiredCount, color: "text-red-400" },
          {
            label: "This Page",
            value: subscriptions.length,
            color: "text-indigo-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="glass rounded-2xl p-4 border border-white/10 text-center"
          >
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-wider">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Status pills */}
        <div className="inline-flex items-center bg-slate-800 rounded-full p-1 shrink-0">
          {["ALL", "ACTIVE", "EXPIRED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search user, email, or plan…"
              className="w-full bg-slate-800 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold transition shrink-0"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full text-xs font-semibold transition shrink-0"
            >
              Clear
            </button>
          )}
        </form>

        {/* Sort */}
        <button
          onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-semibold transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M6 12h12M9 18h6" />
          </svg>
          {sort === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          No subscriptions found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Activated</th>
                <th className="px-5 py-3 font-semibold">Expiry</th>
                <th className="px-5 py-3 font-semibold">Docs Left</th>
                <th className="px-5 py-3 font-semibold">Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visible.map((sub) => (
                <tr
                  key={sub._id}
                  className="bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
                >
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(
                          sub.userId?.fullname
                        )}`}
                      >
                        {initials(sub.userId?.fullname)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm leading-tight">
                          {sub.userId?.fullname || "—"}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {sub.userId?.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-4">
                    <p className="text-slate-200 font-semibold">
                      {sub.planId?.name || "—"}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {sub.planId?.price != null
                        ? formatINR(sub.planId.price)
                        : "—"}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={sub.status} />
                  </td>

                  {/* Activated */}
                  <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                    {formatDate(sub.activatedAt)}
                  </td>

                  {/* Expiry + bar */}
                  <td className="px-5 py-4 text-xs whitespace-nowrap">
                    <p
                      className={
                        sub.status === "ACTIVE" &&
                        daysLeft(sub.expiry) <= 7
                          ? "text-red-400 font-semibold"
                          : "text-slate-400"
                      }
                    >
                      {formatDate(sub.expiry)}
                    </p>
                    <ExpiryBar
                      activatedAt={sub.activatedAt}
                      expiry={sub.expiry}
                      status={sub.status}
                    />
                  </td>

                  {/* Docs left */}
                  <td className="px-5 py-4">
                    <span
                      className={`text-sm font-bold ${
                        sub.remainingDocuments === 0
                          ? "text-red-400"
                          : sub.remainingDocuments <= 10
                          ? "text-amber-400"
                          : "text-slate-200"
                      }`}
                    >
                      {sub.remainingDocuments}
                    </span>
                    <p className="text-slate-600 text-xs">docs</p>
                  </td>

                  {/* Validity */}
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                      {sub.planId?.validity
                        ? `${sub.planId.validity} mo`
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      <Pagination current={page} total={totalPages} onChange={setPage} />

      {/* ── Row count ── */}
      {!loading && visible.length > 0 && (
        <p className="text-slate-600 text-xs mt-3 text-right">
          Page {page} of {totalPages} · {total} total subscriptions
        </p>
      )}
    </div>
  );
};

export default Subscriptions;