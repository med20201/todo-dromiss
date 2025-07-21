import React, { useEffect, useState } from 'react';
import { Users, CheckSquare, FolderOpen, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type Task = {
  id: string;
  title: string;
  status: string;
  assigned_to: string | string[]; // Can be string or array
  due_date?: string;
  priority?: string;
};

type TeamMember = {
  id: string | number;
  name: string;
  department?: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  description?: string;
  progress?: number;
  teamMembers?: string | (string | number)[];
};

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Translation maps
  const statusLabels: Record<string, string> = {
    todo: 'À faire',
    'in-progress': 'En cours',
    completed: 'Terminé',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
        if (tasksError) throw tasksError;

        // Fetch users (team members)
        const { data: usersData, error: usersError } = await supabase.from('users').select('*');
        if (usersError) throw usersError;

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
        if (projectsError) throw projectsError;

        // Parse teamMembers from projects (handle JSON string or array)
        const parsedProjects = (projectsData || []).map(proj => {
          let members: (string | number)[] = [];
          if (typeof proj.teammembers === 'string') {
            try {
              members = JSON.parse(proj.teammembers);
            } catch {
              members = [];
            }
          } else if (Array.isArray(proj.teammembers)) {
            members = proj.teammembers;
          }
          return { ...proj, teamMembers: members };
        });

        setTasks(tasksData || []);
        setTeamMembers(usersData || []);
        setProjects(parsedProjects);
      } catch (error: any) {
        setError(`Erreur lors du chargement des données: ${error.message || error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format assigned users (handle string or array)
  const formatAssignedUsers = (assignedTo: string | string[]) => {
    if (!assignedTo) return 'Non assigné';

    let assignedIds: (string | number)[] = [];

    try {
      if (Array.isArray(assignedTo)) {
        assignedIds = assignedTo;
      } else if (typeof assignedTo === 'string') {
        if (assignedTo.trim().startsWith('[') && assignedTo.trim().endsWith(']')) {
          assignedIds = JSON.parse(assignedTo);
        } else {
          assignedIds = [assignedTo];
        }
      }

      if (!Array.isArray(assignedIds) || assignedIds.length === 0) {
        return 'Non assigné';
      }

      const names = assignedIds.map(id => {
        const user = teamMembers.find(m => String(m.id) === String(id));
        return user ? user.name : `ID: ${id}`;
      });

      return names.join(', ');
    } catch {
      return 'Erreur de format';
    }
  };

  // Stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const stats = [
    {
      title: "Membres d'équipe",
      value: teamMembers.length,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Tâches terminées',
      value: completedTasks,
      icon: CheckSquare,
      color: 'bg-green-500',
    },
    {
      title: 'Projets actifs',
      value: activeProjects,
      icon: FolderOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'Productivité',
      value: '87%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const recentTasks = tasks.slice(0, 5);
  const urgentTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'completed');

  if (loading) return <div className="p-8 text-center text-gray-600">Chargement des données...</div>;
  if (error) return (
    <div className="p-8 text-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Tableau de Bord Dromiss</h1>
        <p className="text-blue-100">Bienvenue dans votre espace de gestion des tâches et projets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Tâches Récentes ({recentTasks.length})</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentTasks.length > 0 ? recentTasks.map(task => (
              <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-600">Assigné à {formatAssignedUsers(task.assigned_to)}</p>
                  <p className="text-xs text-gray-500">
                    Statut: {statusLabels[task.status] || task.status} | Priorité: {priorityLabels[task.priority || ''] || 'Aucune'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[task.status] || task.status}
                </span>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">Aucune tâche trouvée</p>
            )}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Tâches Urgentes ({urgentTasks.length})</h3>
          </div>
          <div className="p-6 space-y-4">
            {urgentTasks.length > 0 ? urgentTasks.map(task => (
              <div key={task.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-red-700">Assigné à {formatAssignedUsers(task.assigned_to)}</p>
                <p className="text-xs text-red-600">
                  Échéance: {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  Priorité haute
                </span>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">Aucune tâche urgente</p>
            )}
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Aperçu des Projets ({projects.length})</h3>
        </div>
        <div className="p-6">
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => {
                const membersArray = Array.isArray(project.teamMembers) ? project.teamMembers : [];
                const members = membersArray
                  .map(id => teamMembers.find(m => String(m.id) === String(id)))
                  .filter(Boolean) as TeamMember[];

                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'active' ? 'Actif' :
                         project.status === 'planning' ? 'Planification' : project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    )}
                    {typeof project.progress === 'number' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progression</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{members.length} membres</span>
                    </div>
                    <div className="text-xs text-gray-700">
                      {members.length > 0 ? members.map(m => (
                        <div key={m.id}>{m.name}</div>
                      )) : (
                        <span>Aucun membre assigné</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun projet trouvé</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
