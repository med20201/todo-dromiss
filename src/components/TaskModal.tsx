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
    assigned_to: [] as string[],
    project_id: '',
    due_date: '',
  })

  // Check if current user can delete (only creator can delete)
  const canDelete = task && user && String(task.created_by) === String(user.id)

  // Check if current user can update (assigned users can update status and priority)
  const canUpdateStatusAndPriority = task && user && (() => {
    try {
      // task.assigned_to is already parsed as JSONB from Supabase
      const assignedUsers = Array.isArray(task.assigned_to) ? task.assigned_to : []
      return assignedUsers.includes(String(user.id))
    } catch {
      return false
    }
  })()

  // Check if current user can fully edit (only creator can fully edit)
  const canFullyEdit = !task || (task && user && String(task.created_by) === String(user.id))

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers()
      fetchProjects()

      if (task) {
        let assignedArray: string[] = []
        try {
          // task.assigned_to is already parsed as JSONB from Supabase
          assignedArray = Array.isArray(task.assigned_to) ? task.assigned_to.map(String) : []
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

    // Check permissions before proceeding
    if (task && !canFullyEdit && !canUpdateStatusAndPriority) {
      alert('Vous n\'avez pas les permissions pour modifier cette tâche')
      return
    }

    setLoading(true)

    try {
      let taskData: any

      if (task && canUpdateStatusAndPriority && !canFullyEdit) {
        // If user is assigned but not creator, only update status and priority
        taskData = {
          status: formData.status,
          priority: formData.priority,
          updated_at: new Date().toISOString(),
        }
      } else {
        // If user is creator or creating new task, full update
        taskData = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to, // No need to stringify for JSONB
          project_id: formData.project_id || null,
          due_date: formData.due_date || null,
          updated_at: new Date().toISOString(),
        }
      }

      let error, data

      if (task) {
        // Update existing task
        console.log('Updating task with data:', taskData)
        console.log('Task ID:', task.id)
        console.log('User ID:', user.id)
        console.log('Task created_by:', task.created_by)
        console.log('Can fully edit:', canFullyEdit)
        console.log('Can update status/priority:', canUpdateStatusAndPriority)
        
        // Always use regular update - RLS policies will handle permissions
        const updateResult = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .select()
        
        console.log('Update result:', updateResult)
        
        if (updateResult.error) {
          console.error('Update error:', updateResult.error)
          throw updateResult.error
        }
        
        if (!updateResult.data || updateResult.data.length === 0) {
          console.error('Update returned no data - likely blocked by RLS')
          throw new Error('Vous n\'avez pas les permissions pour modifier cette tâche. Assurez-vous d\'être assigné à cette tâche.')
        }
        
        data = updateResult.data
        error = updateResult.error
      } else {
        // Create new task
        const insertResult = await supabase
          .from('tasks')
          .insert([
            {
              ...taskData,
              id: uuidv4(),
              created_by: user.id,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
        
        console.log('Insert result:', insertResult)
        data = insertResult.data
        error = insertResult.error
      }

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from database operation')
      }

      console.log('Task operation successful:', data)
      
      // Add a longer delay to ensure update propagates
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onTaskSaved()
      onClose()
    } catch (error: any) {
      console.error('Error saving task:', error)
      
      // More detailed error message
      let errorMessage = 'Erreur lors de la sauvegarde de la tâche: '
      
      if (error.message) {
        errorMessage += error.message
      } else if (error.details) {
        errorMessage += error.details
      } else if (error.hint) {
        errorMessage += error.hint
      } else {
        errorMessage += 'Erreur inconnue'
      }
      
      // Add RLS policy hint
      if (error.code === 'PGRST116' || error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage += '\n\nIl semble y avoir un problème de permissions. Vérifiez que vous êtes assigné à cette tâche.'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !canDelete) return
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
              disabled={!canFullyEdit}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
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
              disabled={!canFullyEdit}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
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
                disabled={!canFullyEdit && !canUpdateStatusAndPriority}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit && !canUpdateStatusAndPriority ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
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
                disabled={!canFullyEdit && !canUpdateStatusAndPriority}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit && !canUpdateStatusAndPriority ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>

          {/* Team members checkboxes - Only for creators */}
          {canFullyEdit && (
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projet
              </label>
              <select
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                disabled={!canFullyEdit}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
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
                required={!task || canFullyEdit}
                disabled={!canFullyEdit}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
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

            {/* Delete button - Only show for task creator */}
            {canDelete && (
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
              disabled={loading || (!canFullyEdit && !canUpdateStatusAndPriority)}
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