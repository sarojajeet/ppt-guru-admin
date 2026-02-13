import React, { useState } from 'react';
import Swal from 'sweetalert2';

const Users = ({ db, updateDb }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = db.users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add User',
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Name">
        <input id="swal-email" class="swal2-input" placeholder="Email">
      `,
      background: '#1e293b',
      color: '#fff',
      confirmButtonColor: '#6366f1',
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const email = document.getElementById('swal-email').value;
        if (!name || !email) {
          Swal.showValidationMessage('Please enter both name and email');
          return false;
        }
        return { name, email };
      }
    });

    if (formValues) {
      const newUser = {
        id: Date.now(),
        name: formValues.name,
        email: formValues.email,
        plan: 'Starter',
        status: 'Active',
        img: formValues.name.charAt(0).toUpperCase()
      };
      updateDb('users', [...db.users, newUser]);
    }
  };

  const handleEditUser = async (index) => {
    const user = db.users[index];
    const { value: formValues } = await Swal.fire({
      title: 'Edit User',
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Name" value="${user.name}">
        <input id="swal-email" class="swal2-input" placeholder="Email" value="${user.email}">
      `,
      background: '#1e293b',
      color: '#fff',
      confirmButtonColor: '#6366f1',
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const email = document.getElementById('swal-email').value;
        if (!name || !email) {
          Swal.showValidationMessage('Please enter both name and email');
          return false;
        }
        return { name, email };
      }
    });

    if (formValues) {
      const updatedUsers = [...db.users];
      updatedUsers[index] = {
        ...updatedUsers[index],
        name: formValues.name,
        email: formValues.email,
        img: formValues.name.charAt(0).toUpperCase()
      };
      updateDb('users', updatedUsers);
    }
  };

  const handleDeleteUser = async (index) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Yes, delete it!',
      background: '#1e293b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      const updatedUsers = db.users.filter((_, i) => i !== index);
      updateDb('users', updatedUsers);
      Swal.fire({
        title: 'Deleted!',
        text: 'User has been deleted.',
        icon: 'success',
        background: '#1e293b',
        color: '#fff',
        timer: 1500,
        showConfirmButton: false
      });
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none text-sm transition"
              />
            </div>
            <button
              onClick={handleAddUser}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 anim-pop whitespace-nowrap"
            >
              <i className="ri-add-line"></i>
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Profile</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-white/5 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
                        {user.img}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-white/5">
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                      <button
                        onClick={() => handleEditUser(index)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition flex items-center justify-center"
                      >
                        <i className="ri-pencil-fill"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(index)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition flex items-center justify-center"
                      >
                        <i className="ri-delete-bin-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <i className="ri-user-line text-4xl mb-2"></i>
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;