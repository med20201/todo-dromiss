import React, { useState, useEffect } from 'react'
import { Plus, Filter, Search, Calendar, User, AlertCircle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import TaskModal from './TaskModal'
import { supabase } from '../lib/supabaseClient'

const Taches: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchTasks()
    fetchTeamMembers()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })
    if (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role')
      .order('name', { ascending: true })
    if (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
    } else {
      setTeamMembers(data || [])
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      alert('Erreur lors de la suppression de la tâche')
    } else {
      fetchTasks()
    }
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleNewTask = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleTaskSaved = () => {
    fetchTasks()
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé'
      case 'in-progress':
        return 'En cours'
      default:
        return 'À faire'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Haute'
      case 'medium':
        return 'Moyenne'
      default:
        return 'Basse'
    }
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Tâches</h1>
            <p className="text-gray-600 mt-1">Organisez et suivez toutes vos tâches</p>
          </div>
          <button
            onClick={handleNewTask}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">À faire</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.todo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in-progress">En cours</option>
            <option value="completed">Terminé</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les priorités</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tâches ({filteredTasks.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Chargement des tâches...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune tâche trouvée</p>
                <button
                  onClick={handleNewTask}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer votre première tâche
                </button>
              </div>
            ) : (
              filteredTasks.map(task => {
                // assigned_to قد يكون JSON نصي أو مصفوفة
                let assignedIds: string[] = []
                try {
                  assignedIds = typeof task.assigned_to === 'string' ? JSON.parse(task.assigned_to) : task.assigned_to
                } catch {
                  assignedIds = []
                }

                const assignedUsers = teamMembers.filter(member => assignedIds.includes(member.id))

                return (
                  <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>
                              {assignedUsers.length > 0
                                ? assignedUsers.map(u => u.name).join(', ')
                                : 'Non assigné'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getStatusText(task.status)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        onTaskSaved={handleTaskSaved}
      />
    </div>
  )
}

export default Taches
