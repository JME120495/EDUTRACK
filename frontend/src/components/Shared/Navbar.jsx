import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { Globe, LogOut, Menu, X, User } from 'lucide-react';
import { ServerStatusIndicator } from './ServerStatus';

export default function Navbar({ onMobileMenuToggle }) {
  const { user, logout, updateLanguage, academicYears, selectedYear, changeAcademicYear } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language.toUpperCase() === 'FR' ? 'EN' : 'FR';
    updateLanguage(nextLang);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#1E3A5F]/90 text-white border-b border-white/10 shadow-lg px-4 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-wide font-outfit">
          <span className="text-2xl">🎓</span>
          <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent font-extrabold font-outfit">
            EduTrack
          </span>
        </Link>
      </div>

      {/* Center - Role Badge */}
      <div className="hidden sm:flex items-center">
        <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300">
          {user?.role ? t(`nav.portal${user.role.charAt(0) + user.role.slice(1).toLowerCase()}`) : ''}
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Server Status Indicator */}
        <ServerStatusIndicator />

        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-xs font-semibold"
          title="Toggle Language"
        >
          <Globe className="h-3.5 w-3.5 text-amber-300" />
          <span className="hidden sm:inline">{i18n.language.toUpperCase() === 'FR' ? '🇫🇷 FR' : '🇬🇧 EN'}</span>
        </button>

        {/* Academic Year Switcher */}
        {academicYears && academicYears.length > 0 && selectedYear && (
          <div className="relative">
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 transition-all border border-indigo-400/30 text-xs font-semibold whitespace-nowrap"
            >
              <span className="text-indigo-200">📅</span>
              <span className="text-white hidden sm:inline">{selectedYear.label}</span>
            </button>
            
            {yearDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setYearDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white text-[#1E3A5F] border border-slate-200 shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Année Scolaire
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {academicYears.map((year) => (
                      <button
                        key={year.id}
                        onClick={() => {
                          changeAcademicYear(year);
                          setYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between transition-colors ${selectedYear.id === year.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'}`}
                      >
                        {year.label}
                        {year.active && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Actuelle</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 pr-3"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-bold text-sm text-[#1E3A5F] shadow-inner font-outfit">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <span className="hidden md:inline text-xs font-medium max-w-[120px] truncate">
              {user?.name}
            </span>
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-[#1E3A5F] border border-slate-200 shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {user?.role}
                  </p>
                  <p className="text-sm font-bold truncate text-[#1E3A5F] mt-0.5">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
