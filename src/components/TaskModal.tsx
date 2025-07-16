import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: any
  onTaskSaved: () => void
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task, onTaskSaved }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: [] as string[], // مصفوفة IDs لأعضاء الفريق
    project_id: '',
    due_date: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers()
      fetchProjects()

      if (task) {
        // التأكد من أن assigned_to هي مصفوفة نصوص دائماً
        let assignedArray: string[] = []
        try {
          const parsed = JSON.parse(task.assigned_to)
          assignedArray = Array.isArray(parsed) ? parsed.map(String) : []
        } catch {
          assignedArray = []
        }

        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          assigned_to: assignedArray,
          project_id: task.project_id || '',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
        })
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assigned_to: [],
          project_id: '',
          due_date: '',
        })
      }
    }
  }, [isOpen, task])

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase.from('users').select('id, name, role')
    if (error) {
      console.error('Erreur fetch team members:', error)
    } else {
      setTeamMembers(data || [])
    }
  }

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('id, name')
    if (error) {
      console.error('Erreur fetch projects:', error)
    } else {
      setProjects(data || [])
    }
  }

  const handleCheckboxChange = (memberId: string) => {
    setFormData(prev => {
      const assigned = Array.isArray(prev.assigned_to) ? prev.assigned_to : []
      if (assigned.includes(memberId)) {
        return { ...prev, assigned_to: assigned.filter(id => id !== memberId) }
      } else {
        return { ...prev, assigned_to: [...assigned, memberId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Utilisateur non connecté')
      return
    }

    setLoading(true)

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigned_to: JSON.stringify(formData.assigned_to), // نخزن كمصفوفة JSON نصية
        project_id: formData.project_id || null,
        due_date: formData.due_date || null,
        updated_at: new Date().toISOString(),
      }

      let error

      if (task) {
        // تحديث مهمة موجودة
        const { error: err } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
        error = err
      } else {
        // إنشاء مهمة جديدة
        const { error: err } = await supabase
          .from('tasks')
          .insert([
            {
              ...taskData,
              id: uuidv4(),
              created_by: user.id,
              created_at: new Date().toISOString(),
            },
          ])
        error = err
      }

      if (error) throw error

      onTaskSaved()
      onClose()
    } catch (error: any) {
      console.error('Erreur sauvegarde tâche:', error)
      alert('Erreur lors de la sauvegarde de la tâche: ' + (error.message || error.details || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)
      if (error) throw error

      onTaskSaved()
      onClose()
    } catch (error: any) {
      console.error('Erreur suppression tâche:', error)
      alert('Erreur lors de la suppression de la tâche: ' + (error.message || error.details || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la tâche *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez le titre de la tâche"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez la tâche en détail"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todo">À faire</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>

          {/* قائمة Checkboxes لأعضاء الفريق */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigné à *
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              {teamMembers.map(member => (
                <label key={member.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.assigned_to) && formData.assigned_to.includes(String(member.id))}
                    onChange={() => handleCheckboxChange(String(member.id))}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>{member.name} - {member.role || 'Membre'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projet
              </label>
              <select
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Aucun projet</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>

            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                Supprimer
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {task ? 'Mettre à jour' : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
