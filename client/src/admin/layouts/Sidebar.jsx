import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  Sprout,
  Activity,
  Database,
  Droplet,
  CloudSun,
  TrendingUp,
  Bell,
  Award,
  Ticket,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { admin, logout } = useAdminAuth();

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC'] },
    { to: '/admin/farmers', label: 'Farmers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT'] },
    { to: '/admin/farms', label: 'Farms', icon: Sprout, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT'] },
    { to: '/admin/crop-health', label: 'Crop Health', icon: Activity, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT'] },
    { to: '/admin/diseases', label: 'Disease DB', icon: Database, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC'] },
    { to: '/admin/irrigation', label: 'Irrigation', icon: Droplet, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT'] },
    { to: '/admin/weather', label: 'Weather', icon: CloudSun, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT'] },
    { to: '/admin/market', label: 'Market Intel', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC'] },
    { to: '/admin/community-reports', label: 'Outbreak Alerts', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT'] },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT'] },
    { to: '/admin/schemes', label: 'Gov Schemes', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN', 'AGRI_EXPERT', 'SUPPORT_EXEC'] },
    { to: '/admin/tickets', label: 'Support Tickets', icon: Ticket, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC'] },
    { to: '/admin/reports', label: 'System Reports', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT'] },
    { to: '/admin/audit-logs', label: 'Security Audits', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_EXEC', 'AGRI_EXPERT'] },
  ];

  const filteredLinks = links.filter((link) => link.roles.includes(admin?.role));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white text-slate-800 flex flex-col border-r border-slate-200 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Sprout size={18} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            KrishiMitra Admin
          </span>
        </div>
        <button className="lg:hidden text-slate-400 hover:text-slate-900" onClick={toggleSidebar}>
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200">
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group text-[13px] ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 font-semibold border-l-4 border-emerald-600 rounded-r-lg rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg'
                }`
              }
            >
              <Icon size={16} className="shrink-0 transition-transform duration-205 group-hover:scale-105" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-emerald-600 font-bold text-xs">
            {admin?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-xs truncate text-slate-800">{admin?.name}</h4>
            <p className="text-[10px] text-slate-400 truncate capitalize font-medium">
              {admin?.role?.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-600 text-xs font-semibold transition-all duration-200 border border-slate-200 hover:border-red-200 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
