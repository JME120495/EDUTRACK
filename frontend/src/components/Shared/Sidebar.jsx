import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Truck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const location = useLocation();
  const [expanded, setExpanded] = useState({});

  const categories = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      roles: ['DIRECTOR', 'CENSEUR', 'INTENDANT', 'TEACHER', 'PARENT', 'STUDENT', 'SURVEILLANT'],
      path: user?.role === 'PARENT' ? '/parent' : user?.role === 'STUDENT' ? '/student' : user?.role === 'CENSEUR' ? '/censeur/dashboard' : user?.role === 'INTENDANT' ? '/intendant/dashboard' : user?.role === 'TEACHER' ? '/teacher/dashboard' : '/dashboard'
    },
    // 1. Configuration Académique
    {
      id: 'academic_config',
      label: 'Configuration Académique',
      icon: School,
      roles: ['DIRECTOR', 'CENSEUR'],
      subItems: [
        { path: '/classes', label: t('nav.classes'), roles: ['DIRECTOR', 'CENSEUR'] },
        { path: '/teachers', label: t('nav.teachers') || 'Gestion Enseignants', roles: ['DIRECTOR', 'CENSEUR'] },
        { path: '/students', label: t('nav.students'), roles: ['DIRECTOR', 'CENSEUR'] },
        { path: '/director/timetable', label: 'Emplois du Temps', roles: ['DIRECTOR', 'CENSEUR'] }
      ]
    },
    // 2. Opérations Académiques Journalières / Périodiques
    {
      id: 'vie_scolaire',
      label: 'Vie Scolaire',
      icon: ClipboardCheck,
      roles: ['DIRECTOR', 'CENSEUR', 'TEACHER', 'SURVEILLANT'],
      subItems: [
        { path: '/absences', label: t('nav.absences'), roles: ['DIRECTOR', 'CENSEUR', 'TEACHER', 'SURVEILLANT'] },
        { path: '/grades', label: t('nav.grades'), roles: ['DIRECTOR', 'CENSEUR', 'TEACHER'] },
        { path: '/bulletins', label: t('nav.bulletins'), roles: ['DIRECTOR', 'CENSEUR', 'TEACHER'] }
      ]
    },
    // 3. Gestion Administrative & RH
    {
      id: 'admin_finance',
      label: 'Administration & Finance',
      icon: CreditCard,
      roles: ['DIRECTOR', 'INTENDANT'],
      subItems: [
        { path: '/payments', label: t('nav.payments'), roles: ['DIRECTOR', 'INTENDANT'], requiredPlans: ['STANDARD', 'PREMIUM', 'CUSTOM'] },
        { path: '/accounting', label: 'Comptabilité (OHADA)', roles: ['DIRECTOR', 'INTENDANT'], requiredPlans: ['PREMIUM', 'CUSTOM'] },
        { path: '/hr', label: t('nav.hr') || 'Ressources Humaines', roles: ['DIRECTOR', 'INTENDANT'], requiredPlans: ['PREMIUM', 'CUSTOM'] },
        { path: '/payroll', label: 'Paie des Enseignants', roles: ['DIRECTOR', 'INTENDANT'] },
        { path: '/admin-staff', label: 'Personnel Administratif', roles: ['DIRECTOR'] },
        { path: '/support-staff', label: t('supportStaff.title') || "Personnel d'Appui", roles: ['DIRECTOR'] }
      ]
    },
    // 4. Services Auxiliaires & Bibliothèque
    {
      id: 'services_logistics',
      label: 'Services & Logistique',
      icon: Truck,
      roles: ['DIRECTOR', 'INTENDANT', 'CENSEUR'],
      subItems: [
        { path: '/logistics', label: 'Logistique (Bus & Cantine)', roles: ['DIRECTOR', 'INTENDANT'] },
        { path: '/director/library', label: 'Bibliothèque', roles: ['DIRECTOR', 'CENSEUR'] },
        { path: '/documents', label: t('nav.documents') || 'Documents & Badges', roles: ['DIRECTOR', 'CENSEUR'] }
      ]
    },
    // 5. Rôles Spécifiques
    {
      id: 'teacher_payroll',
      label: t('nav.teacherPayroll') || 'Ma Paie',
      icon: Coins,
      roles: ['TEACHER'],
      path: '/teacher/payroll'
    },
    // 6. Communication & Messagerie
    {
      id: 'messages',
      label: 'Messagerie',
      icon: MessageSquare,
      roles: ['DIRECTOR', 'CENSEUR', 'INTENDANT', 'TEACHER', 'PARENT', 'STUDENT', 'SURVEILLANT'],
      path: '/messages'
    },
    // 7. Paramètres & Facturation
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      roles: ['DIRECTOR'],
      subItems: [
        { path: '/billing', label: t('billing.title') || 'Abonnement & Facturation', roles: ['DIRECTOR'] },
        { path: '/settings', label: t('nav.settings'), roles: ['DIRECTOR'] }
      ]
    }
  ];

  // Auto-expand category that contains currently active route on mount
  useEffect(() => {
    const activeCat = {};
    categories.forEach(cat => {
      if (cat.subItems) {
        const hasActive = cat.subItems.some(sub => location.pathname === sub.path);
        if (hasActive) {
          activeCat[cat.id] = true;
        }
      }
    });
    setExpanded(activeCat);
  }, [location.pathname]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getLinkClass = (isActive) => `
    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
    ${isActive 
      ? 'bg-[#1E3A5F] text-[#F5A623] shadow-md border-l-4 border-[#F5A623]' 
      : 'text-slate-600 hover:bg-slate-100 hover:text-[#1E3A5F]'
    }
  `;

  const getSubLinkClass = (isActive) => `
    flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 pl-6
    ${isActive 
      ? 'bg-slate-100 text-[#1E3A5F] font-extrabold' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }
  `;

  // Render a category block
  const renderCategory = (cat) => {
    const currentPlan = user?.subscriptionPlan || 'PREMIUM';
    
    // Filter visible sub-items based on user's role
    const visibleSubItems = cat.subItems 
      ? cat.subItems.filter(sub => sub.roles.includes(user?.role))
      : [];

    if (!cat.roles.includes(user?.role)) return null;

    // Category with no sub-items (Direct Link)
    if (!cat.subItems || visibleSubItems.length === 0) {
      const path = cat.path || '/';
      const isActive = location.pathname === path;
      return (
        <NavLink
          key={cat.id}
          to={path}
          onClick={onClose}
          className={getLinkClass(isActive)}
        >
          <cat.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{cat.label}</span>
        </NavLink>
      );
    }

    // Category with only 1 visible sub-item (simplify as direct link)
    if (visibleSubItems.length === 1) {
      const sub = visibleSubItems[0];
      const isLocked = sub.requiredPlans && !sub.requiredPlans.includes(currentPlan);
      const isActive = location.pathname === sub.path;
      return (
        <NavLink
          key={sub.path}
          to={sub.path}
          onClick={onClose}
          className={getLinkClass(isActive)}
        >
          <cat.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{sub.label}</span>
          {isLocked && <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
        </NavLink>
      );
    }

    // Category with multiple sub-items (Accordion)
    const isExpanded = expanded[cat.id];
    const isAnyChildActive = visibleSubItems.some(sub => location.pathname === sub.path);

    return (
      <div key={cat.id} className="space-y-1">
        {/* Accordion Toggle Header */}
        <button
          onClick={() => toggleExpand(cat.id)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isAnyChildActive 
              ? 'bg-slate-50 text-[#1E3A5F] border-l-4 border-[#1E3A5F]/40' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <cat.icon className={`h-5 w-5 shrink-0 transition-transform ${isAnyChildActive ? 'text-[#1E3A5F]' : ''}`} />
            <span>{cat.label}</span>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </button>

        {/* Collapsible Sub-menu */}
        {isExpanded && (
          <div className="pl-4 ml-3 border-l border-slate-100/80 space-y-1.5 py-1 animate-in slide-in-from-top duration-200">
            {visibleSubItems.map(sub => {
              const isLocked = sub.requiredPlans && !sub.requiredPlans.includes(currentPlan);
              const isActive = location.pathname === sub.path;
              return (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  onClick={onClose}
                  className={getSubLinkClass(isActive)}
                >
                  <span className="flex-1 text-left">{sub.label}</span>
                  {isLocked && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 px-4 py-6 shadow-sm">
      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
        {categories.map(cat => renderCategory(cat))}
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
