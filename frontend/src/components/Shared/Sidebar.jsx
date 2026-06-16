import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  School,
  Calendar, 
  FileSpreadsheet, 
  ClipboardCheck,
  FileText, 
  CreditCard, 
  Settings,
  GraduationCap,
  Coins
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const menuItems = [
    {
      path: '/dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      roles: ['DIRECTOR']
    },
    {
      path: '/students',
      label: t('nav.students'),
      icon: Users,
      roles: ['DIRECTOR']
    },
    {
      path: '/classes',
      label: t('nav.classes'),
      icon: School,
      roles: ['DIRECTOR']
    },
    {
      path: '/teachers',
      label: t('nav.teachers') || 'Gestion Enseignants',
      icon: GraduationCap,
      roles: ['DIRECTOR']
    },
    {
      path: '/timetable',
      label: t('nav.timetable'),
      icon: Calendar,
      roles: ['DIRECTOR']
    },
    {
      path: '/grades',
      label: t('nav.grades'),
      icon: FileSpreadsheet,
      roles: ['DIRECTOR', 'TEACHER']
    },
    {
      path: '/absences',
      label: t('nav.absences'),
      icon: ClipboardCheck,
      roles: ['DIRECTOR', 'TEACHER']
    },
    {
      path: '/bulletins',
      label: t('nav.bulletins'),
      icon: FileText,
      roles: ['DIRECTOR', 'TEACHER']
    },
    {
      path: '/payments',
      label: t('nav.payments'),
      icon: CreditCard,
      roles: ['DIRECTOR']
    },
    {
      path: '/payroll',
      label: t('nav.payroll') || 'Paie Enseignants',
      icon: Coins,
      roles: ['DIRECTOR']
    },
    {
      path: '/settings',
      label: t('nav.settings'),
      icon: Settings,
      roles: ['DIRECTOR']
    },
    {
      path: '/parent',
      label: t('nav.portalParent'),
      icon: GraduationCap,
      roles: ['PARENT']
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const linkClass = ({ isActive }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
    ${isActive 
      ? 'bg-[#1E3A5F] text-[#F5A623] shadow-md border-l-4 border-[#F5A623]' 
      : 'text-slate-600 hover:bg-slate-100 hover:text-[#1E3A5F]'
    }
  `;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 px-4 py-6 shadow-sm">
      <div className="space-y-1.5 flex-1">
        {filteredItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={linkClass}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="border-t border-slate-150 pt-4 px-2 text-center">
        <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
          EduTrack School Management
        </p>
        <p className="text-[9px] text-slate-400 mt-0.5">
          v1.0.0 &copy; 2026
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 w-64 h-[calc(100vh-60px)] sticky top-[60px] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative flex flex-col z-10 w-64 max-w-xs bg-white animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
