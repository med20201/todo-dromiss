import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaskModal from './TaskModal';
import { supabase } from '../lib/supabaseClient';

const Taches: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) console.error('Erreur fetch tasks:', error);
    else setTasks(data || []);
    setLoading(false);
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Erreur fetch users:', error);
    else setTeamMembers(data || []);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) alert('Erreur lors de la suppression de la tâche');
    else fetchTasks();
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = () => {
    fetchTasks();
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in-progress': return 'En cours';
      default: return 'À faire';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      default: return 'Basse';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Liste des Tâches</h1>
        <button
          onClick={handleNewTask}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle Tâche
        </button>
      </div>

      {/* Filtres simples */}
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Recherche..."
          className="border px-3 py-1 rounded flex-grow"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="all">Tous Statuts</option>
          <option value="todo">À faire</option>
          <option value="in-progress">En cours</option>
          <option value="completed">Terminé</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="all">Toutes Priorités</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </div>

      {/* Liste des tâches */}
      {loading ? (
        <p>Chargement des tâches...</p>
      ) : filteredTasks.length === 0 ? (
        <p>Aucune tâche trouvée.</p>
      ) : (
        <ul className="space-y-4">
          {filteredTasks.map(task => (
            <li
              key={task.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => handleEditTask(task)}
              title="Cliquez pour modifier"
            >
              <div>
                <h3 className="font-semibold text-lg">{task.title || '(Sans titre)'}</h3>
                <p className="text-gray-600 text-sm">{task.description}</p>
                <div className="flex space-x-2 mt-1 text-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded ${getStatusIcon(task.status)?.props.className} bg-gray-100`}>
                    {getStatusIcon(task.status)}&nbsp;{getStatusText(task.status)}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${getPriorityColor(task.priority || 'low')}`}>
                    {getPriorityText(task.priority || 'low')}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                className="text-red-600 hover:text-red-800 p-1 rounded"
                title="Supprimer la tâche"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onTaskSaved={handleTaskSaved}
      />
    </div>
  );
};

export default Taches;
