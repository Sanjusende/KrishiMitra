import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Menu, Bell, User, Settings, LogOut, ChevronRight } from 'lucide-react';

const Navbar = ({ toggleSidebar, pendingAlertsCount = 2 }) => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Generate breadcrumb text dynamically from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  const getBreadcrumbLabel = (part) => {
    if (part === 'admin') return 'Admin';
    // Remove dashes and capitalize
    return part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 transition-colors duration-200">
      {/* Navbar Left: Menu Toggle and Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Navigator */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">KrishiMitra</span>
          {pathParts.map((part, index) => {
            const pathLink = `/${pathParts.slice(0, index + 1).join('/')}`;
            const isLast = index === pathParts.length - 1;

            return (
              <React.Fragment key={part}>
                <ChevronRight size={12} className="text-slate-400" />
                {isLast ? (
                  <span className="font-semibold text-emerald-600">
                    {getBreadcrumbLabel(part)}
                  </span>
                ) : (
                  <Link to={pathLink} className="hover:text-slate-800 transition-colors">
                    {getBreadcrumbLabel(part)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Navbar Right: Alerts and Dropdown */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Link
          to="/admin/tickets"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative transition-colors cursor-pointer"
        >
          <Bell size={18} />
          {pendingAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-[9px] text-white font-bold rounded-full flex items-center justify-center animate-pulse">
              {pendingAlertsCount}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 focus:outline-none transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-semibold text-xs flex items-center justify-center border border-emerald-200">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">
              {admin?.name?.split(' ')[0]}
            </span>
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay to close on click outside */}
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
              
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-20 py-2.5 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <p className="text-xs font-semibold text-slate-800 truncate">{admin?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate capitalize font-medium">
                    {admin?.role?.replace('_', ' ').toLowerCase()}
                  </p>
                </div>

                <Link
                  to="/admin/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-650 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Profile Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
