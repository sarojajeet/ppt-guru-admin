import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import axios from "axios";

// const API = "http://localhost:8080/api/reviews";
const API = "https://lionfish-app-pk8s6.ondigitalocean.app/api/reviews";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StarRating = ({ rating }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        viewBox="0 0 20 20"
        fill={s <= rating ? "#f59e0b" : "none"}
        stroke={s <= rating ? "#f59e0b" : "#475569"}
        strokeWidth="1.5"
        className="w-4 h-4"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </span>
);

const Badge = ({ approved }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      approved
        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
        : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        approved ? "bg-emerald-400" : "bg-amber-400"
      }`}
    />
    {approved ? "Approved" : "Pending"}
  </span>
);

// ─── Edit Modal HTML ──────────────────────────────────────────────────────────
const editFormHTML = (review) => `
  <input id="tourName" class="swal2-input" placeholder="Tour Name" value="${review.tourName}">
  <input id="role" class="swal2-input" placeholder="Role" value="${review.role}">
  <input id="rating" type="number" min="1" max="5" class="swal2-input" placeholder="Rating (1–5)" value="${review.rating}">
  <textarea id="experience" class="swal2-textarea" placeholder="Share Experience">${review.experience}</textarea>
  <div style="text-align:left;color:#94a3b8;padding:0 16px;margin-top:6px;">
    <label style="display:flex;align-items:center;gap:8px;font-size:14px;">
      <input type="checkbox" id="isApproved" ${review.isApproved ? "checked" : ""}> Mark as Approved
    </label>
  </div>
`;

const collectEditValues = () => ({
  tourName: document.getElementById("tourName").value,
  role: document.getElementById("role").value,
  rating: Number(document.getElementById("rating").value),
  experience: document.getElementById("experience").value,
  isApproved: document.getElementById("isApproved").checked,
});

const swalBase = {
  background: "#1e293b",
  color: "#fff",
  confirmButtonColor: "#6366f1",
  showCancelButton: true,
  width: "520px",
};

// ─── Component ────────────────────────────────────────────────────────────────
const ReviewsAdmin = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'approved'
  const [search, setSearch] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "approved") params.isApproved = true;
      if (filter === "pending") params.isApproved = false;
      const { data } = await axios.get(`${API}/admin`, { params });
      setReviews(data);
    } catch {
      Swal.fire("Error", "Failed to load reviews.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const visibleReviews = reviews.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.tourName.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.experience.toLowerCase().includes(q)
    );
  });

  // ── Toggle Approve ──
  const handleToggleApprove = async (review) => {
    const action = review.isApproved ? "unapprove" : "approve";
    const { isConfirmed } = await Swal.fire({
      ...swalBase,
      title: `${review.isApproved ? "Unapprove" : "Approve"} Review?`,
      text: `This will ${action} "${review.tourName}" by ${review.role}.`,
      icon: "question",
      confirmButtonText: `Yes, ${action}`,
    });
    if (!isConfirmed) return;

    try {
      await axios.patch(`${API}/admin/${review._id}/approve`);
      fetchReviews();
    } catch {
      Swal.fire("Error", "Failed to update approval.", "error");
    }
  };

  // ── Edit ──
  const handleEdit = async (review) => {
    const { value: formValues } = await Swal.fire({
      ...swalBase,
      title: "Edit Review",
      html: editFormHTML(review),
      preConfirm: collectEditValues,
    });
    if (!formValues) return;

    try {
      await axios.put(`${API}/admin/${review._id}`, formValues);
      Swal.fire("Updated!", "Review updated successfully.", "success");
      fetchReviews();
    } catch {
      Swal.fire("Error", "Failed to update review.", "error");
    }
  };

  // ── Delete ──
  const handleDelete = async (review) => {
    const { isConfirmed } = await Swal.fire({
      ...swalBase,
      title: "Delete Review?",
      text: `"${review.tourName}" by ${review.role} will be permanently removed.`,
      icon: "warning",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });
    if (!isConfirmed) return;

    try {
      await axios.delete(`${API}/admin/${review._id}`);
      Swal.fire("Deleted!", "Review removed.", "success");
      fetchReviews();
    } catch {
      Swal.fire("Error", "Failed to delete review.", "error");
    }
  };

  // ── Stats ──
  const total = reviews.length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = total - approvedCount;
  const avgRating =
    total > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : "–";

  return (
    <div className="section-view">
      {/* ── Header ── */}
      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
          Reviews & Feedback
        </h3>
        <p className="text-slate-400 text-sm">
          Manage user submissions — approve, edit, or remove entries.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, color: "text-white" },
          { label: "Approved", value: approvedCount, color: "text-emerald-400" },
          { label: "Pending", value: pendingCount, color: "text-amber-400" },
          { label: "Avg Rating", value: avgRating, color: "text-indigo-400" },
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

      {/* ── Filters + Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Filter Pills */}
        <div className="inline-flex items-center bg-slate-800 rounded-full p-1 shrink-0">
          {["all", "pending", "approved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f}
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
            placeholder="Search by tour, role, or experience…"
            className="w-full bg-slate-800 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : visibleReviews.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          No reviews found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Rating</th>
                <th className="px-5 py-3 font-semibold">Experience</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleReviews.map((review) => (
                <tr
                  key={review._id}
                  className="bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
                >
                  <td className="px-5 py-4 text-white font-semibold whitespace-nowrap">
                    {review.yourName}
                  </td>
                  <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                    {review.role}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <StarRating rating={review.rating} />
                      <span className="text-slate-500 text-xs">
                        {review.rating}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 max-w-xs">
                    <p className="line-clamp-2">{review.experience}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge approved={review.isApproved} />
                  </td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve / Unapprove */}
                      <button
                        onClick={() => handleToggleApprove(review)}
                        title={review.isApproved ? "Unapprove" : "Approve"}
                        className={`p-2 rounded-lg transition ${
                          review.isApproved
                            ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400"
                            : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400"
                        }`}
                      >
                        {review.isApproved ? (
                          // X icon (unapprove)
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        ) : (
                          // Check icon (approve)
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="m5 13 4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(review)}
                        title="Edit"
                        className="p-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(review)}
                        title="Delete"
                        className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Row count ── */}
      {!loading && visibleReviews.length > 0 && (
        <p className="text-slate-600 text-xs mt-3 text-right">
          Showing {visibleReviews.length} of {total} reviews
        </p>
      )}
    </div>
  );
};

export default ReviewsAdmin;