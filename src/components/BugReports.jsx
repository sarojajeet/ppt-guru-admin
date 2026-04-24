import React, { useEffect, useState, useCallback } from "react";
import { getAllBugReports } from "@/services/api";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: "ri-error-warning-fill",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  "in-progress": {
    label: "In Progress",
    icon: "ri-loader-4-fill",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  resolved: {
    label: "Resolved",
    icon: "ri-checkbox-circle-fill",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  closed: {
    label: "Closed",
    icon: "ri-close-circle-fill",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["open"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
};

const AttachmentPreview = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return <span className="text-slate-600 text-xs">—</span>;

  return (
    <div className="flex gap-1 flex-wrap">
      {attachments.map((att, i) => (
        <a
          key={i}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          title={att.filename}
          className="group relative"
        >
          {att.type === "image" ? (
            <img
              src={att.url}
              alt={att.filename}
              className="w-9 h-9 rounded-lg object-cover border border-white/10 hover:border-indigo-500/60 transition ring-0 hover:ring-2 ring-indigo-500/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-white/10 hover:border-indigo-500/60 flex items-center justify-center transition">
              <i className="ri-video-fill text-indigo-400 text-sm" />
            </div>
          )}
        </a>
      ))}
    </div>
  );
};

const DetailModal = ({ report, onClose }) => {
  if (!report) return null;
  const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG["open"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <i className="ri-bug-fill text-red-400 text-lg" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Bug Report Details</p>
              <p className="text-slate-500 text-xs font-mono">{report._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition flex items-center justify-center"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Status + date */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <StatusBadge status={report.status} />
            <span className="text-xs text-slate-500">
              {new Date(report.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>

          {/* Reporter */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-sm border border-indigo-500/20">
              {(report.reportedBy?.name || report.reportedBy?.email || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                {report.reportedBy?.name || "Unknown"}
              </p>
              <p className="text-slate-500 text-xs">{report.reportedBy?.email}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Description
            </p>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-800/40 rounded-xl p-4 border border-white/5">
              {report.description}
            </p>
          </div>

          {/* Attachments */}
          {report.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Attachments ({report.attachments.length})
              </p>
              <div className="flex gap-3 flex-wrap">
                {report.attachments.map((att, i) =>
                  att.type === "image" ? (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={att.url}
                        alt={att.filename}
                        className="w-28 h-20 rounded-xl object-cover border border-white/10 hover:border-indigo-500/60 transition"
                      />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-28 h-20 rounded-xl bg-slate-800 border border-white/10 hover:border-indigo-500/60 flex flex-col items-center justify-center gap-1 transition group"
                    >
                      <i className="ri-video-fill text-2xl text-indigo-400" />
                      <span className="text-[10px] text-slate-500 truncate w-20 text-center">
                        {att.filename}
                      </span>
                    </a>
                  )
                )}
              </div>
            </div>
          )}

          {/* Resolved by */}
          {report.resolvedBy && (
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2">
              <i className="ri-shield-check-fill text-emerald-400" />
              <span className="text-xs text-slate-400">
                Resolved by{" "}
                <span className="text-emerald-400 font-semibold">
                  {report.resolvedBy?.name || report.resolvedBy?.email}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BugReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const limit = 10;

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await getAllBugReports(params);
      setReports(res.data.data);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch bug reports", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusFilterChange = (value) => {
    setPage(1);
    setStatusFilter(value);
  };

  const statCounts = {
    open: reports.filter((r) => r.status === "open").length,
    "in-progress": reports.filter((r) => r.status === "in-progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    closed: reports.filter((r) => r.status === "closed").length,
  };

  const statCards = [
    { label: "Total", value: total, icon: "ri-bug-2-fill", color: "text-white", bg: "bg-slate-700/50" },
    { label: "Open", value: statCounts.open, icon: "ri-error-warning-fill", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "In Progress", value: statCounts["in-progress"], icon: "ri-loader-4-fill", color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Resolved", value: statCounts.resolved, icon: "ri-checkbox-circle-fill", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="section-view space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/5"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <i className={`${s.icon} ${s.color} text-lg`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div className="glass rounded-2xl p-4 md:p-6 flex flex-col min-h-[520px]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <i className="ri-bug-fill text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bug Reports</h3>
              <p className="text-xs text-slate-500">{total} total reports</p>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {["", "open", "in-progress", "resolved", "closed"].map((s) => {
              const cfg = s ? STATUS_CONFIG[s] : null;
              const isActive = statusFilter === s;
              return (
                <button
                  key={s || "all"}
                  onClick={() => handleStatusFilterChange(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    isActive
                      ? s
                        ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                        : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                      : "bg-slate-800/50 text-slate-500 border-white/5 hover:text-slate-300"
                  }`}
                >
                  {s
                    ? (STATUS_CONFIG[s]?.label || s)
                    : "All"}
                </button>
              );
            })}

            <button
              onClick={fetchReports}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center border border-white/5"
              title="Refresh"
            >
              <i className={`ri-refresh-line ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Reporter</th>
                <th className="p-4">Description</th>
                <th className="p-4">Attachments</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 bg-slate-800 rounded-lg w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <i className="ri-bug-2-line text-5xl mb-3 opacity-40" />
                      <p className="font-semibold">No bug reports found</p>
                      <p className="text-xs mt-1">
                        {statusFilter ? `No reports with status "${statusFilter}"` : "No reports submitted yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report._id}
                    className="hover:bg-white/5 transition group cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    {/* Reporter */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs border border-white/5">
                          {(report.reportedBy?.name || report.reportedBy?.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">
                            {report.reportedBy?.name || "—"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {report.reportedBy?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="p-4 max-w-[240px]">
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </td>

                    {/* Attachments */}
                    <td className="p-4">
                      <AttachmentPreview attachments={report.attachments} />
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* View */}
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                      >
                        <i className="ri-eye-line text-xs" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-40 hover:bg-slate-700 transition text-sm"
            >
              <i className="ri-arrow-left-s-line mr-1" />
              Prev
            </button>
            <span className="text-slate-400 text-sm">
              Page <span className="text-white font-bold">{page}</span> of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-40 hover:bg-slate-700 transition text-sm"
            >
              Next
              <i className="ri-arrow-right-s-line ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <DetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};

export default BugReports;
