import React, { useState, useEffect } from 'react';
import { Save, User, Users, Edit, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  password?: string;
}

interface UserData {
  id: string;
  auth_id: string | null;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  created_at: string;
}

const Parametres: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    role: '',
    department: '',
    avatar: '',
    password: '',
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingUser, setEditingUser] = useState<UserData & { password?: string } | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    password: '',
    avatar: '',
  });
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const { user, userProfile } = useAuth();

  const departments = [
    'Technique',
    'Marketing & Commercial',
    'Intégrateur',
    'Ressources Humaines',
    'Finance',
    'Direction',
  ];

  const roles = [
    'Manager Technique',
    'Responsable Technique',
    'Responsable Marketing',
    'Développeur',
    'Technicien',
    'Commercial',
    'Intégrateur',
    'RH',
    'Comptable',
    'Directeur',
    'Stagiaire',
  ];

  const isAdmin =
    userProfile?.role === 'Manager Technique' || userProfile?.role === 'Responsable Technique' ||
    userProfile?.role === 'Responsable Marketing';

  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    ...(isAdmin ? [{ id: 'users', label: 'Gestion des Utilisateurs', icon: Users }] : []),
  ];

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        email: userProfile.email || user?.email || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        avatar: userProfile.avatar || '',
        password: '',
      });
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Fetch users error:', error);
      showMessage('error', 'Erreur lors du chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
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
          avatar: profileData.avatar || null,
        })
        .eq('auth_id', user.id);
      if (error) throw error;

      if (profileData.password && profileData.password.length >= 6) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: profileData.password,
        });
        if (pwError) throw pwError;
      }

      showMessage('success', 'Profil mis à jour avec succès !');
      setProfileData((p) => ({ ...p, password: '' }));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showMessage(
        'error',
        `Erreur lors de la mise à jour du profil : ${error.message || JSON.stringify(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (
      !newUser.email ||
      !newUser.name ||
      !newUser.role ||
      !newUser.department ||
      !newUser.password
    ) {
      showMessage('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (newUser.password.length < 6) {
      showMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          name: newUser.name,
          role: newUser.role,
          department: newUser.department,
          avatar: newUser.avatar || null,
        },
      });
      if (error) throw error;

      const { error: insertError } = await supabase.from('users').insert([
        {
          auth_id: data.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          avatar: newUser.avatar || null,
          created_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;

      showMessage('success', `Utilisateur ${newUser.name} créé avec succès !`);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', role: '', department: '', password: '', avatar: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      showMessage('error', error.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editingUser.name || !editingUser.role || !editingUser.department) {
      showMessage('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editingUser.name.trim(),
          role: editingUser.role,
          department: editingUser.department,
          avatar: editingUser.avatar || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);
      if (error) throw error;

      if (editingUser.password && editingUser.password.length >= 6 && editingUser.auth_id) {
        const { error: pwError } = await supabase.auth.admin.updateUserById(editingUser.auth_id, {
          password: editingUser.password,
        });
        if (pwError) throw pwError;
      }

      showMessage('success', 'Utilisateur mis à jour avec succès !');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      showMessage('error', "Erreur lors de la mise à jour de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    setLoading(true);
    try {
      const { data: userData, error: getUserError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', userId)
        .single();
      if (getUserError) throw getUserError;

      if (userData?.auth_id) {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userData.auth_id);
        if (deleteAuthError) throw deleteAuthError;
      }

      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      showMessage('success', 'Utilisateur supprimé avec succès !');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showMessage('error', "Erreur lors de la suppression de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">
        Informations du Profil
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom complet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email (non modifiable) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profileData.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
        </div>

        {/* Poste */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
          <select
            value={profileData.role}
            onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un poste</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Département */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
          <select
            value={profileData.department}
            onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un département</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe (laisser vide pour ne pas changer)
          </label>
          <input
            type="password"
            value={profileData.password}
            onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
            placeholder="Nouveau mot de passe"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Avatar */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
        <div className="flex items-center space-x-6">
          <img
            src={
              profileData.avatar ||
              'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
            }
            alt="Aperçu"
            className="w-20 h-20 rounded-full object-cover border-4 border-blue-600"
          />
          <input
            type="url"
            value={profileData.avatar}
            onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
            placeholder="Ex: https://example.com/avatar.jpg"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Choix rapide d'avatars */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Choisir un avatar :</p>
          <div className="flex space-x-4">
            {[
              'https://i.pravatar.cc/100?img=1',
              'https://i.pravatar.cc/100?img=12',
              'https://i.pravatar.cc/100?img=32',
              'https://i.pravatar.cc/100?img=47',
            ].map((url) => (
              <img
                key={url}
                src={url}
                onClick={() => setProfileData({ ...profileData, avatar: url })}
                className={`w-16 h-16 rounded-full cursor-pointer border-2 ${
                  profileData.avatar === url ? 'border-blue-600' : 'border-gray-300'
                }`}
                title="Cliquer pour sélectionner"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bouton de mise à jour */}
      <div className="mt-8 text-right">
        <button
          onClick={handleProfileUpdate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
        >
          {loading ? (
            'Mise à jour...'
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Mettre à jour le profil</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderUsersManagement = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h3>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
          disabled={loading}
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
            <h4 className="text-lg font-semibold mb-5">Nouvel Utilisateur</h4>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom complet *"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Mot de passe *"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un poste *</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <select
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un département *</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Avatar URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <input
                  type="url"
                  placeholder="URL de l'avatar"
                  value={newUser.avatar}
                  onChange={(e) => setNewUser({ ...newUser, avatar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Avatar Preview */}
              {newUser.avatar ? (
                <div className="mt-4 flex items-center space-x-4">
                  <img
                    src={newUser.avatar}
                    alt="Aperçu avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-600"
                  />
                </div>
              ) : (
                <p className="mt-2 text-gray-500 text-sm">Aucun avatar sélectionné</p>
              )}

              {/* Quick avatar choices */}
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Choisir un avatar :</p>
                <div className="flex space-x-4">
                  {[
                    'https://i.pravatar.cc/100?img=1',
                    'https://i.pravatar.cc/100?img=12',
                    'https://i.pravatar.cc/100?img=32',
                    'https://i.pravatar.cc/100?img=47',
                  ].map((url) => (
                    <img
                      key={url}
                      src={url}
                      onClick={() => setNewUser({ ...newUser, avatar: url })}
                      className={`w-16 h-16 rounded-full cursor-pointer border-2 ${
                        newUser.avatar === url ? 'border-blue-600' : 'border-gray-300'
                      }`}
                      title="Cliquer pour sélectionner"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Poste
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Département
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avatar
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  {loading ? 'Chargement...' : 'Aucun utilisateur trouvé.'}
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.department}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={`${u.name} avatar`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 italic">Pas d'avatar</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                  <button
                    onClick={() => setEditingUser({ ...u, password: '' })}
                    className="text-blue-600 hover:text-blue-900"
                    title="Modifier"
                  >
                    <Edit className="inline-block w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Supprimer"
                  >
                    <Trash2 className="inline-block w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
              <h4 className="text-lg font-semibold mb-5">Modifier l'utilisateur</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom complet *"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
                  value={editingUser.password || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un poste *</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  value={editingUser.department}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, department: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un département *</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Avatar URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                  <input
                    type="url"
                    placeholder="URL de l'avatar"
                    value={editingUser.avatar || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, avatar: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Avatar Preview */}
                {editingUser.avatar ? (
                  <div className="mt-4 flex items-center space-x-4">
                    <img
                      src={editingUser.avatar}
                      alt="Aperçu avatar"
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-600"
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500 text-sm">Aucun avatar sélectionné</p>
                )}

                {/* Quick avatar choices */}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Choisir un avatar :</p>
                  <div className="flex space-x-4">
                    {[
                      'https://i.pravatar.cc/100?img=1',
                      'https://i.pravatar.cc/100?img=12',
                      'https://i.pravatar.cc/100?img=32',
                      'https://i.pravatar.cc/100?img=47',
                    ].map((url) => (
                      <img
                        key={url}
                        src={url}
                        onClick={() => setEditingUser({ ...editingUser, avatar: url })}
                        className={`w-16 h-16 rounded-full cursor-pointer border-2 ${
                          editingUser.avatar === url ? 'border-blue-600' : 'border-gray-300'
                        }`}
                        title="Cliquer pour sélectionner"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar / Navigation */}
      <nav className="w-64 bg-white border-r border-gray-200 p-6">
        <ul className="space-y-4">
          {sections.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveSection(id)}
                className={`flex items-center space-x-3 px-4 py-2 rounded-md w-full text-left font-medium ${
                  activeSection === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <main className="flex-grow p-8">
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md text-white ${
              message.type === 'success'
                ? 'bg-green-600'
                : message.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {activeSection === 'profile' && renderProfileSettings()}
        {activeSection === 'users' && isAdmin && renderUsersManagement()}
      </main>
    </div>
  );
};

export default Parametres;
