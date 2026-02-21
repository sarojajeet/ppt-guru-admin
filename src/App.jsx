import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Pricing from './components/Pricing';
import Files from './components/Files';
import System from './components/System';
import './App.css';
import AILab from './components/Ailab';
// import EditorPage from './preview/EditorPage';
import A4PreviewEditor from './preview/A4PreviewEditor';
import PPTPreviewEditor from './preview/PPTPreviewEditor';
import EditorPage from './components/EditorPage';
import PPTEditor from './components/PPTEditor';
import NexGenV7 from './preview/SlideCanvas';
import DocumentList from './components/DocumentList';
import FabricEditor from './components/FrabicEditor';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [db, setDb] = useState({
    users: [
      { id: 1, name: "Rahul Sharma", email: "rahul@dev.io", plan: "Pro", status: "Active", img: "R" },
      { id: 2, name: "Priya Verma", email: "priya@design.com", plan: "Elite", status: "Active", img: "P" },
      { id: 3, name: "Amit Singh", email: "amit@nopay.com", plan: "Starter", status: "Blocked", img: "A" }
    ],
    files: [
      { name: "Project_Alpha.pdf", size: "2.4 MB", status: "Ready", type: "pdf" },
      { name: "Design_Mock.png", size: "5.1 MB", status: "Processing", type: "img" }
    ],
    plans: [
      { name: "Starter", price: 0, color: "slate", icon: "ri-seedling-fill", features: ["5 Documents/mo", "Basic OCR", "Standard Support"] },
      { name: "Pro", price: 199, color: "indigo", icon: "ri-fire-fill", features: ["100 Documents/mo", "Advanced AI", "Editable Exports", "Priority Support"], popular: true },
      { name: "Elite", price: 999, color: "fuchsia", icon: "ri-vip-crown-2-fill", features: ["Unlimited Access", "API Key", "White Label", "24/7 Dedicated Agent"] }
    ]
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    console.log("Token:", token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
  };

  const updateDb = (key, value) => {
    setDb(prev => ({ ...prev, [key]: value }));
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {maintenanceMode && (
        <div className="w-full bg-red-600/90 backdrop-blur text-white text-center py-2 font-bold text-xs tracking-widest uppercase shadow-lg z-50 flex items-center justify-center gap-2 animate-pulse">
          <i className="ri-lock-2-fill"></i> System Maintenance Active
        </div>
      )}

      <Routes>
        {/* Standalone Editor Routes */}
        <Route path="/editor/:documentId" element={<EditorPage />} />
        <Route path="/preview/a4/:documentId" element={<A4PreviewEditor />} />
        <Route path="/preview/ppt/:documentId" element={<PPTPreviewEditor />} />
        <Route path="/ppt-editor/:id" element={<PPTEditor />} />
        <Route path="/pptxcanvas" element={<NexGenV7 />} />
        <Route path="/fabric-editor/:documentId" element={<FabricEditor />} />

        <Route path="*" element={
          <div className="flex-1 flex h-full">
            <SidebarWrapper onLogout={handleLogout} />
            <main className="flex-1 flex flex-col relative overflow-hidden">
              <HeaderWrapper />
              <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-20">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard db={db} />} />
                  <Route path="/playground" element={<AILab />} />
                  <Route path="/documents" element={<DocumentList />} />
                  <Route path="/users" element={<Users db={db} updateDb={updateDb} />} />
                  <Route path="/plans" element={<Pricing db={db} updateDb={updateDb} />} />
                  <Route path="/system" element={<System maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} />} />
                </Routes>
              </div>
            </main>
          </div>
        } />
      </Routes>
    </div>
  );
}

// Wrapper components to use hooks like useLocation/useNavigate inside the Router context (which is provided by BrowserRouter in main.jsx)
const SidebarWrapper = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Extract current page from path (e.g., /dashboard -> dashboard)
  const currentPage = location.pathname.substring(1) || 'dashboard';

  return <Sidebar currentPage={currentPage} navigate={(page) => navigate(`/${page}`)} onLogout={onLogout} />;
};

const HeaderWrapper = () => {
  const location = useLocation();
  const currentPage = location.pathname.substring(1) || 'dashboard';
  return <Header currentPage={currentPage} />;
};

export default App;