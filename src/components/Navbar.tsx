import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { userProfile, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipe', label: 'Équipe', icon: Users },
    { id: 'taches', label: 'Tâches', icon: CheckSquare },
    { id: 'projets', label: 'Projets', icon: FolderOpen },
    { id: 'rapports', label: 'Rapports', icon: BarChart3 },
    { id: 'parametres', label: 'Paramètres', icon: Settings }
  ];

  const avatarDefault = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';

  return (
    <nav className="bg-white shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center mr-10">
            <span className="text-xl font-bold text-gray-900">
              <span className="text-blue-700">DROMISS</span>
              <span className="text-orange-500 text-sm ml-1">LOGISTICS</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}

            {/* User */}
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
              {userProfile ? (
                <div className="flex items-center space-x-2">
                  <img
                    src={userProfile.avatar || avatarDefault}
                    alt={userProfile.name || 'Utilisateur'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-700">
                    {userProfile.name || userProfile.email || 'Utilisateur'}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Chargement...</span>
              )}
              <button
                onClick={signOut}
                className="flex items-center px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 border-t border-gray-200">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center w-full px-3 py-2 rounded-md text-base transition-colors ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </button>
          ))}

          {userProfile ? (
            <div className="border-t border-gray-200 mt-4 pt-3">
              <div className="flex items-center px-3">
                <img
                  src={userProfile.avatar || avatarDefault}
                  alt={userProfile.name || 'Utilisateur'}
                  className="w-8 h-8 rounded-full object-cover mr-3"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{userProfile.name || userProfile.email || 'Utilisateur'}</div>
                  <div className="text-xs text-gray-600">{userProfile.role || ''}</div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center w-full mt-2 px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Chargement...</span>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
