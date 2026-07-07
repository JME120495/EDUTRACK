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
  Calculator,
  GraduationCap,
  Coins,
  Briefcase,
  QrCode,
  MessageSquare,
  LogOut,
  User,
  Shield,
  Book,
  Lock,
  Truck
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
      path: '/censeur/dashboard',
      label: t('nav.dashboard') || 'Tableau de Bord',
      icon: LayoutDashboard,
      roles: ['CENSEUR']
    },
    {
      path: '/intendant/dashboard',
      label: t('nav.dashboard') || 'Tableau de Bord',
      icon: LayoutDashboard,
      roles: ['INTENDANT']
    },
    {
      path: '/teacher/dashboard',
      label: t('nav.dashboard') || 'Tableau de Bord',
      icon: LayoutDashboard,
      roles: ['TEACHER']
    },
    {
      path: '/parent',
      label: t('nav.portalParent'),
      icon: GraduationCap,
      roles: ['PARENT']
    },
    {
      path: '/student',
      label: 'Portail Élève',
      icon: GraduationCap,
      roles: ['STUDENT']
    },

    // 1. Structure & Configuration Académique (Flow de création logique)
    {
      path: '/classes',
      label: t('nav.classes'),
      icon: School,
      roles: ['DIRECTOR', 'CENSEUR']
    },
    {
      path: '/teachers',
      label: t('nav.teachers') || 'Gestion Enseignants',
      icon: GraduationCap,
      roles: ['DIRECTOR', 'CENSEUR']
    },
    {
      path: '/students',
      label: t('nav.students'),
      icon: Users,
      roles: ['DIRECTOR', 'CENSEUR']
    },
    {
      path: '/director/timetable',
      label: 'Emplois du Temps',
      icon: Calendar,
      roles: ['DIRECTOR', 'CENSEUR']
    },

    // 2. Opérations Académiques Journalières / Périodiques
    {
      path: '/absences',
      label: t('nav.absences'),
      icon: ClipboardCheck,
      roles: ['DIRECTOR', 'CENSEUR', 'TEACHER', 'SURVEILLANT']
    },
    {
      path: '/grades',
      label: t('nav.grades'),
      icon: FileSpreadsheet,
      roles: ['DIRECTOR', 'CENSEUR', 'TEACHER']
    },
    {
      path: '/bulletins',
      label: t('nav.bulletins'),
      icon: FileText,
      roles: ['DIRECTOR', 'CENSEUR', 'TEACHER']
    },

    // 3. Gestion Administrative & RH
    {
      path: '/payments',
      label: t('nav.payments'),
      icon: CreditCard,
      roles: ['DIRECTOR', 'INTENDANT'],
      requiredPlans: ['STANDARD', 'PREMIUM', 'CUSTOM']
    },
    {
      path: '/accounting',
      label: 'Comptabilité (OHADA)',
      icon: Calculator,
      roles: ['DIRECTOR', 'INTENDANT'],
      requiredPlans: ['PREMIUM', 'CUSTOM']
    },
    {
      path: '/hr',
      label: t('nav.hr') || 'Ressources Humaines',
      icon: Briefcase,
      roles: ['DIRECTOR', 'INTENDANT'],
      requiredPlans: ['PREMIUM', 'CUSTOM']
    },
    {
      path: '/payroll',
      label: 'Paie des Enseignants',
      icon: Coins,
      roles: ['DIRECTOR', 'INTENDANT']
    },
    {
      path: '/admin-staff',
      label: 'Personnel Administratif',
      icon: Briefcase,
      roles: ['DIRECTOR']
    },
    {
      path: '/support-staff',
      label: t('supportStaff.title') || "Personnel d'Appui",
      icon: Shield,
      roles: ['DIRECTOR']
    },

    // 4. Services Auxiliaires & Bibliothèque
    {
      path: '/logistics',
      label: 'Logistique (Bus & Cantine)',
      icon: Truck,
      roles: ['DIRECTOR', 'INTENDANT']
    },
    {
      path: '/director/library',
      label: 'Bibliothèque',
      icon: Book,
      roles: ['DIRECTOR', 'CENSEUR']
    },
    {
      path: '/documents',
      label: t('nav.documents') || 'Documents & Badges',
      icon: QrCode,
      roles: ['DIRECTOR', 'CENSEUR']
    },

    // 5. Rôles Spécifiques
    {
      path: '/teacher/payroll',
      label: t('nav.teacherPayroll') || 'Ma Paie',
      icon: Coins,
      roles: ['TEACHER']
    },

    // 6. Communication & Messagerie
    {
      path: '/messages',
      label: 'Messagerie',
      icon: MessageSquare,
      roles: ['DIRECTOR', 'CENSEUR', 'INTENDANT', 'TEACHER', 'PARENT', 'STUDENT', 'SURVEILLANT']
    },

    // 7. Paramètres & Facturation
    {
      path: '/billing',
      label: t('billing.title') || 'Abonnement & Facturation',
      icon: CreditCard,
      roles: ['DIRECTOR']
    },
    {
      path: '/settings',
      label: t('nav.settings'),
      icon: Settings,
      roles: ['DIRECTOR']
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
        {filteredItems.map(item => {
          const currentPlan = user?.subscriptionPlan || 'PREMIUM';
          const isLocked = item.requiredPlans && !item.requiredPlans.includes(currentPlan);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={linkClass}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isLocked && <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
            </NavLink>
          );
        })}
      </div>
      <div className="border-t border-slate-150 pt-4 px-2 text-center">
        <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
          EduTrack School Management
        </p>
        <p className="text-[9px] text-slate-400 mt-0.5">
          v1.1.0 &copy; 2026
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
