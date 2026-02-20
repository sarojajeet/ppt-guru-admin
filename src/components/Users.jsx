import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getAllUsers, deleteUser } from "@/services/userApi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 8;

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers({
        page,
        limit,
        search: searchTerm
      });

      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "User will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6366f1",
      confirmButtonText: "Yes, delete",
      background: "#1e293b",
      color: "#fff"
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        Swal.fire("Deleted!", "User has been deleted.", "success");
        fetchUsers();
      } catch {
        Swal.fire("Error", "Delete failed", "error");
      }
    }
  };

  return (
    <div className="section-view">
      <div className="glass rounded-2xl p-4 md:p-6 min-h-[600px] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-white">User Directory</h3>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <i className="ri-search-2-line absolute left-3 top-3 text-slate-500"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none text-sm transition"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Profile</th>
                <th className="p-4">Phone</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-white/5 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white">
                        {user.fullname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">{user.fullname}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-300">{user.phone}</td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition"
                    >
                      <i className="ri-delete-bin-fill"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && users.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <i className="ri-user-line text-4xl mb-2"></i>
              <p>No users found</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-slate-400">
            Page <span className="text-white font-bold">{page}</span> of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Users;