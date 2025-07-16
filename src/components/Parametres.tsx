import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Shield, Globe, Palette, Database, Upload, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
}

interface NotificationSettings {
  newTasks: boolean;
  deadlineReminders: boolean;
  projectUpdates: boolean;
  weeklyReports: boolean;
}

const Parametres: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    role: '',
    department: '',
    avatar: ''
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newTasks: true,
    deadlineReminders: true,
    projectUpdates: false,
    weeklyReports: true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const { user, userProfile } = useAuth();

  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'data', label: 'Données', icon: Database },
  ];

  const departments = [
    'Technique',
    'Marketing & Commercial',
    'Intégrateur',
    'Ressources Humaines',
    'Finance',
    'Direction'
  ];

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        email: userProfile.email || user?.email || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        avatar: userProfile.avatar || ''
      });
    }
  }, [userProfile, user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileUpdate = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          role: profileData.role,
          department: profileData.department,
          avatar: profileData.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      showMessage('success', 'Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showMessage('success', 'Mot de passe modifié avec succès !');
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // In a real app, you'd save this to a notifications_settings table
      // For now, we'll store it in user_metadata
      const { error } = await supabase.auth.updateUser({
        data: { notifications }
      });

      if (error) throw error;

      showMessage('success', 'Préférences de notification mises à jour !');
    } catch (error) {
      console.error('Error updating notifications:', error);
      showMessage('error', 'Erreur lors de la mise à jour des notifications');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du Profil</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poste
            </label>
            <input
              type="text"
              value={profileData.role}
              onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Responsable Technique"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Département
            </label>
            <select 
              value={profileData.department}
              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un département</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Photo de Profil</h3>
        <div className="flex items-center space-x-4">
          <img
            src={profileData.avatar || "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
          <div className="flex flex-col space-y-2">
            <input
              type="url"
              value={profileData.avatar}
              onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
              placeholder="URL de l'image"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              onClick={handleProfileUpdate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Camera className="w-4 h-4 mr-2" />
              Mettre à jour la photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Préférences de Notification</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Nouvelles tâches assignées</h4>
              <p className="text-sm text-gray-600">Recevoir une notification quand une tâche vous est assignée</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.newTasks}
              onChange={(e) => setNotifications({ ...notifications, newTasks: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Échéances approchantes</h4>
              <p className="text-sm text-gray-600">Rappels pour les tâches avec échéance dans 24h</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.deadlineReminders}
              onChange={(e) => setNotifications({ ...notifications, deadlineReminders: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Mises à jour de projet</h4>
              <p className="text-sm text-gray-600">Notifications sur l'avancement des projets</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.projectUpdates}
              onChange={(e) => setNotifications({ ...notifications, projectUpdates: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Rapports hebdomadaires</h4>
              <p className="text-sm text-gray-600">Résumé hebdomadaire de votre activité</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.weeklyReports}
              onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Au moins 6 caractères"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Répétez le mot de passe"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Authentification à deux facteurs</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Activer 2FA</h4>
            <p className="text-sm text-gray-600">Ajouter une couche de sécurité supplémentaire</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Configurer
          </button>
        </div>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres Généraux</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Français</option>
              <option>English</option>
              <option>العربية</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>GMT+1 (Casablanca)</option>
              <option>GMT+0 (Londres)</option>
              <option>GMT+2 (Paris)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format de date
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Apparence</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thème
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
                <div className="w-full h-16 bg-white border rounded mb-2"></div>
                <span className="text-sm">Clair</span>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
                <div className="w-full h-16 bg-gray-800 rounded mb-2"></div>
                <span className="text-sm">Sombre</span>
              </div>
              <div className="border border-blue-500 rounded-lg p-4 text-center cursor-pointer bg-blue-50">
                <div className="w-full h-16 bg-gradient-to-r from-white to-gray-200 rounded mb-2"></div>
                <span className="text-sm">Auto</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur d'accent
            </label>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full cursor-pointer border-2 border-blue-800"></div>
              <div className="w-8 h-8 bg-green-600 rounded-full cursor-pointer"></div>
              <div className="w-8 h-8 bg-purple-600 rounded-full cursor-pointer"></div>
              <div className="w-8 h-8 bg-red-600 rounded-full cursor-pointer"></div>
              <div className="w-8 h-8 bg-orange-600 rounded-full cursor-pointer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gestion des Données</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Sauvegarde automatique</h4>
            <p className="text-sm text-blue-700 mb-3">
              Vos données sont automatiquement sauvegardées
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Sauvegarder maintenant
            </button>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-900 mb-2">Exporter les données</h4>
            <p className="text-sm text-green-700 mb-3">
              Télécharger une copie de toutes vos données
            </p>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Exporter
            </button>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-900 mb-2">Supprimer le compte</h4>
            <p className="text-sm text-red-700 mb-3">
              Supprimer définitivement votre compte et toutes vos données
            </p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'general':
        return renderGeneralSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'data':
        return renderDataSettings();
      default:
        return renderProfileSettings();
    }
  };

  const handleSave = () => {
    switch (activeSection) {
      case 'profile':
        handleProfileUpdate();
        break;
      case 'notifications':
        handleNotificationUpdate();
        break;
      case 'security':
        handlePasswordChange();
        break;
      default:
        showMessage('info', 'Paramètres sauvegardés localement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Gérez vos préférences et paramètres de compte</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-100">
            <div className="p-4">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md border border-gray-100">
            <div className="p-6">
              {renderContent()}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;