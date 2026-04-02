import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API = "https://lionfish-app-pk8s6.ondigitalocean.app/api/payment/admin/transactions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PAID: {
    label: "Paid",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-400",
  },
  PENDING: {
    label: "Pending",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-500/15",
    text: "text-red-400",
    ring: "ring-red-500/30",
    dot: "bg-red-400",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
];

const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'

 const [page, setPage] = useState(1);
const [limit] = useState(10);
const [totalPages, setTotalPages] = useState(1);

const fetchTransactions = useCallback(async () => {
  setLoading(true);
  try {
    const params = {
      page,
      limit,
      sort: sortOrder,
    };

    if (statusFilter !== "ALL") {
      params.status = statusFilter;
    }

    if (search.trim()) {
      params.search = search;
    }

    const { data } = await axios.get(API, { params });

    setTransactions(data.transactions || []);
    setTotalPages(data.totalPages || 1);

  } catch {
    Swal.fire("Error", "Failed to load transactions.", "error");
  } finally {
    setLoading(false);
  }
}, [page, limit, statusFilter, search, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  useEffect(() => {
  setPage(1);
}, [statusFilter, search, sortOrder]);

  // ── Derived ──
  const totalRevenue = transactions
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + t.amount, 0);

  const counts = transactions.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { PAID: 0, PENDING: 0, FAILED: 0 }
  );

  useEffect(() => {
  const delay = setTimeout(() => {
    fetchTransactions();
  }, 500);

  return () => clearTimeout(delay);
}, [search]);
 const visible = transactions;

  // ── View session ID ──
  const handleViewSession = (sessionId) => {
    Swal.fire({
      title: "Payment Session ID",
      html: `<p style="word-break:break-all;font-size:12px;font-family:monospace;color:#94a3b8;background:#0f172a;padding:12px;border-radius:8px;text-align:left;">${sessionId}</p>`,
      background: "#1e293b",
      color: "#fff",
      confirmButtonColor: "#6366f1",
      confirmButtonText: "Close",
    });
  };

  return (
    <div className="section-view">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
            Transactions
          </h3>
          <p className="text-slate-400 text-sm">
            Payment history across all users and plans.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
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
        <div className="glass rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-3xl font-extrabold text-white">{transactions.length}</p>
          <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-wider">Total</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-2xl font-extrabold text-emerald-400">
            {formatINR(totalRevenue)}
          </p>
          <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-wider">Revenue</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-3xl font-extrabold text-emerald-400">{counts.PAID}</p>
          <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-wider">Paid</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-3xl font-extrabold text-amber-400">{counts.PENDING}</p>
          <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-wider">Pending</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Status Pills */}
        <div className="inline-flex items-center bg-slate-800 rounded-full p-1 shrink-0">
          {["ALL", "PAID", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 ${
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order, user, email, or plan…"
            className="w-full bg-slate-800 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-semibold transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M6 12h12M9 18h6" />
          </svg>
          {sortOrder === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No transactions found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visible.map((txn) => (
                <tr
                  key={txn._id}
                  className="bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
                >
                  {/* Order ID */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">
                      {txn.orderId}
                    </span>
                    {txn.cfOrderId && (
                      <p className="text-slate-600 text-xs mt-1 font-mono">
                        CF: {txn.cfOrderId}
                      </p>
                    )}
                  </td>

                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(
                          txn.userId?.fullname
                        )}`}
                      >
                        {initials(txn.userId?.fullname)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm leading-tight">
                          {txn.userId?.fullname || "—"}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {txn.userId?.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-4">
                    <span className="text-slate-300 font-medium">
                      {txn.planId?.name || "—"}
                    </span>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Listed: {txn.planId?.price != null ? formatINR(txn.planId.price) : "—"}
                    </p>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-4">
                    <span className="text-white font-extrabold text-base">
                      {formatINR(txn.amount)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={txn.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {formatDate(txn.createdAt)}
                  </td>

                  {/* Session */}
                  <td className="px-5 py-4 text-right">
                    {txn.paymentSessionId ? (
                      <button
                        onClick={() => handleViewSession(txn.paymentSessionId)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center items-center gap-3 mt-6">
  <button
    disabled={page === 1}
    onClick={() => setPage((p) => p - 1)}
    className="px-3 py-1 bg-slate-800 text-white rounded disabled:opacity-40"
  >
    Prev
  </button>

  <span className="text-slate-400 text-sm">
    Page {page} of {totalPages}
  </span>

  <button
    disabled={page === totalPages}
    onClick={() => setPage((p) => p + 1)}
    className="px-3 py-1 bg-slate-800 text-white rounded disabled:opacity-40"
  >
    Next
  </button>
</div>

      {/* Row count */}
      {!loading && visible.length > 0 && (
        <p className="text-slate-600 text-xs mt-3 text-right">
Showing {transactions.length} results        </p>
      )}
    </div>
  );
};

export default Transactions;