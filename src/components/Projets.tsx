import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Clock, Calendar, Users, Trash2 } from 'lucide-react';
import ProjectModal from './ProjectModal';
import { supabase } from '../lib/supabaseClient';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planning' | 'completed' | 'on-hold';
  progress: number;
  start_date: string;
  end_date: string;
  team_members: string[] | string;  // يمكن أن تكون مصفوفة أو نص JSON
}

const Projets: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<{id: string; name: string}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

  // جلب جميع المستخدمين من قاعدة البيانات (الأعضاء)
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, name');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // جلب المشاريع وفك تشفير team_members إذا كانت نص JSON
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;

      const projectsWithParsed = (data || []).map(p => {
        if (typeof p.team_members === 'string') {
          try {
            p.team_members = JSON.parse(p.team_members);
            if (!Array.isArray(p.team_members)) p.team_members = [];
          } catch {
            p.team_members = [];
          }
        }
        return p;
      });

      setProjects(projectsWithParsed);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  // دالة لجلب أسماء الأعضاء بناءً على team_members (مصفوفة أو نص)
  const getTeamMemberNames = (
    teamMembersField: string[] | string | undefined,
    usersList: {id: string; name: string}[]
  ) => {
    if (!teamMembersField) return [];

    let memberIds: string[] = [];

    if (Array.isArray(teamMembersField)) {
      memberIds = teamMembersField.map(id => String(id).trim());
    } else if (typeof teamMembersField === 'string') {
      try {
        memberIds = JSON.parse(teamMembersField);
        if (!Array.isArray(memberIds)) memberIds = [];
        else memberIds = memberIds.map(id => String(id).trim());
      } catch {
        memberIds = teamMembersField.split(',').map(id => id.trim());
      }
    } else {
      return [];
    }

    return memberIds
      .map(id => usersList.find(u => String(u.id) === id))
      .filter(Boolean)
      .map(u => u!.name);
  };

  // ألوان الحالة ونصوصها
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'planning': return 'Planification';
      case 'completed': return 'Terminé';
      case 'on-hold': return 'En pause';
      default: return status;
    }
  };

  // حذف المشروع
  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce projet ?')) return;
    try {
      setLoadingDelete(projectId);
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      await fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Erreur lors de la suppression du projet: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoadingDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-gray-600 mt-1">Suivez l'avancement de tous vos projets</p>
        </div>
        <button
          onClick={() => {
            setSelectedProject(undefined);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Projet
        </button>
      </div>

      {/* Statistiques projets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Projets</p>
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Actifs</p>
            <p className="text-2xl font-bold text-gray-900">
              {projects.filter(p => p.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">En planification</p>
            <p className="text-2xl font-bold text-gray-900">
              {projects.filter(p => p.status === 'planning').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Progression Moy.</p>
            <p className="text-2xl font-bold text-gray-900">
              {projects.length > 0
                ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Liste projets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map(project => {
          const teamNames = getTeamMemberNames(project.team_members, users);
          return (
            <div key={project.id} className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-gray-600 text-sm">{project.description}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>

              {/* Progression */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div>
                  <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Début</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Fin prévue</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
              </div>

              {/* Membres assignés */}
              <div className="text-sm mb-4">
                <strong>Membres assignés: </strong>
                {teamNames.length > 0 ? teamNames.join(', ') : 'Aucun membre assigné'}
              </div>

              {/* Boutons modifier et supprimer */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Modifier le projet →
                </button>

                <button
                  onClick={() => handleDeleteProject(project.id)}
                  disabled={loadingDelete === project.id}
                  title="Supprimer le projet"
                  className="text-red-600 hover:text-red-800 transition-colors flex items-center"
                >
                  {loadingDelete === project.id ? (
                    <svg
                      className="animate-spin h-5 w-5 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal du projet */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
        onProjectSaved={() => {
          setIsModalOpen(false);
          fetchProjects();
        }}
      />
    </div>
  );
};

export default Projets;
