import React from 'react';
import Swal from 'sweetalert2';

const Files = ({ db, updateDb }) => {
  const simulateUpload = () => {
    const newFile = {
      name: `Scan_${Math.floor(Math.random() * 1000)}.pdf`,
      size: "1.2 MB",
      status: "Ready",
      type: 'pdf'
    };
    
    updateDb('files', [newFile, ...db.files]);
    
    Swal.fire({
      icon: 'success',
      title: 'File Uploaded!',
      text: newFile.name,
      background: '#1e293b',
      color: '#fff',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const deleteFile = (index) => {
    Swal.fire({
      title: 'Delete File?',
      text: "This action cannot be undone",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Yes, delete it!',
      background: '#1e293b',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedFiles = db.files.filter((_, i) => i !== index);
        updateDb('files', updatedFiles);
      }
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return 'ri-file-pdf-line';
      case 'img':
        return 'ri-file-image-line';
      default:
        return 'ri-file-line';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready':
        return 'text-emerald-400';
      case 'Processing':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="section-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex gap-4 border-b border-white/10 pb-2">
          <button className="text-indigo-400 font-bold border-b-2 border-indigo-500 pb-2">
            All Files
          </button>
          <button className="text-slate-400 hover:text-white transition pb-2">
            Images
          </button>
        </div>
        <button
          onClick={simulateUpload}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg anim-pop"
        >
          <i className="ri-upload-cloud-line"></i> Upload File
        </button>
      </div>

      {db.files.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <i className="ri-folder-open-line text-6xl text-slate-600 mb-4"></i>
          <p className="text-slate-400">No files uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {db.files.map((file, index) => (
            <div
              key={index}
              className="glass p-4 rounded-xl flex items-center gap-4 group relative hover:bg-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                <i className={getFileIcon(file.type)}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{file.name}</div>
                <div className={`text-xs ${getStatusColor(file.status)}`}>
                  {file.size} • {file.status}
                </div>
              </div>
              <button
                onClick={() => deleteFile(index)}
                className="absolute right-2 text-red-400 opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-500/10 rounded"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Files;