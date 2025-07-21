import React, { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project?: any
  onProjectSaved: () => void
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project, onProjectSaved }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [teamMembersList, setTeamMembersList] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as 'active' | 'planning' | 'completed' | 'on-hold',
    progress: 0,
    start_date: '',
    end_date: '',
    teamMembers: [] as string[],
  })

  // تحقق من صلاحيات الحذف (صاحب المشروع فقط)
  const canDelete = project && user && String(project.created_by) === String(user.id)

  // تحقق من صلاحيات تعديل الحالة والتقدم (الأعضاء المعينين)
  const canUpdateStatusAndProgress = project && user && (() => {
    try {
      const assignedUsers = Array.isArray(project.team_members) ? project.team_members : []
      return assignedUsers.includes(String(user.id))
    } catch {
      return false
    }
  })()

  // تحقق من صلاحية التعديل الكامل (صاحب المشروع فقط أو إنشاء جديد)
  const canFullyEdit = !project || (project && user && String(project.created_by) === String(user.id))

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers()

      if (project) {
        let teamMembersArray: string[] = []
        try {
          if (Array.isArray(project.team_members)) {
            teamMembersArray = project.team_members.map(String)
          } else if (project.team_members) {
            teamMembersArray = [String(project.team_members)]
          }
        } catch {
          teamMembersArray = []
        }

        setFormData({
          name: project.name || '',
          description: project.description || '',
          status: project.status || 'planning',
          progress: project.progress || 0,
          start_date: project.start_date ? project.start_date.split('T')[0] : '',
          end_date: project.end_date ? project.end_date.split('T')[0] : '',
          teamMembers: teamMembersArray,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          status: 'planning',
          progress: 0,
          start_date: '',
          end_date: '',
          teamMembers: [],
        })
      }
    }
  }, [isOpen, project])

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, name, role')
      if (error) throw error
      setTeamMembersList(data || [])
    } catch (error) {
      console.error('Failed to fetch team members:', error)
      alert('Erreur lors du chargement des membres de l\'équipe')
    }
  }

  const handleCheckboxChange = (userId: string) => {
    setFormData(prev => {
      const exists = prev.teamMembers.includes(userId)
      let newTeamMembers = []
      if (exists) {
        newTeamMembers = prev.teamMembers.filter(id => id !== userId)
      } else {
        newTeamMembers = [...prev.teamMembers, userId]
      }
      return { ...prev, teamMembers: newTeamMembers }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Utilisateur non connecté')
      return
    }

    if (project && !canFullyEdit && !canUpdateStatusAndProgress) {
      alert('Vous n\'avez pas les permissions pour modifier ce projet')
      return
    }

    setLoading(true)

    try {
      let projectData: any

      if (project && canUpdateStatusAndProgress && !canFullyEdit) {
        // تحديث محدود للحالة والتقدم فقط
        projectData = {
          status: formData.status,
          progress: Number(formData.progress),
          updated_at: new Date().toISOString(),
        }
      } else {
        // تحديث كامل أو إنشاء جديد
        projectData = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          progress: Number(formData.progress),
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          updated_at: new Date().toISOString(),
          team_members: formData.teamMembers, // توحيد الاسم مع DB
        }
      }

      let error, data

      if (project) {
        const updateResult = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)
          .select()

        if (updateResult.error) throw updateResult.error
        if (!updateResult.data || updateResult.data.length === 0) {
          throw new Error('Vous n\'avez pas les permissions pour modifier ce projet.')
        }

        data = updateResult.data
        error = updateResult.error
      } else {
        const insertResult = await supabase
          .from('projects')
          .insert([
            {
              ...projectData,
              id: uuidv4(),
              created_by: user.id,
              created_at: new Date().toISOString(),
            },
          ])
          .select()

        data = insertResult.data
        error = insertResult.error
      }

      if (error) throw error
      if (!data || data.length === 0) throw new Error('No data returned from database operation')

      await new Promise(resolve => setTimeout(resolve, 500))

      onProjectSaved()
      onClose()
    } catch (error: any) {
      console.error('Error saving project:', error)
      let errorMessage = 'Erreur lors de la sauvegarde du projet: '

      if (error.message) errorMessage += error.message
      else if (error.details) errorMessage += error.details
      else if (error.hint) errorMessage += error.hint
      else errorMessage += 'Erreur inconnue'

      if (error.code === 'PGRST116' || error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage += '\n\nIl semble y avoir un problème de permissions. Vérifiez vos droits d\'accès.'
      }

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project || !canDelete) return
    if (!window.confirm('Voulez-vous vraiment supprimer ce projet ?')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error

      onProjectSaved()
      onClose()
    } catch (error: any) {
      console.error('Error deleting project:', error)
      alert('Erreur lors de la suppression du projet: ' + (error.message || error.details || 'Erreur inconnue'))
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
            {project ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du projet *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={!canFullyEdit}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Entrez le nom du projet"
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
              placeholder="Description du projet"
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
                disabled={!canFullyEdit && !canUpdateStatusAndProgress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit && !canUpdateStatusAndProgress ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="active">Actif</option>
                <option value="planning">Planification</option>
                <option value="completed">Terminé</option>
                <option value="on-hold">En pause</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progression (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.progress}
                onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                disabled={!canFullyEdit && !canUpdateStatusAndProgress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit && !canUpdateStatusAndProgress ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="0 - 100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                disabled={!canFullyEdit}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin prévue
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                disabled={!canFullyEdit}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canFullyEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {canFullyEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membres de l'équipe
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {teamMembersList.map(member => (
                  <label
                    key={member.id}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.teamMembers.includes(String(member.id))}
                      onChange={() => handleCheckboxChange(String(member.id))}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span>{member.name} ({member.role || 'Membre'})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>

            {project && canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Supprimer
                <Trash2 className="w-5 h-5 ml-2" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || (!canFullyEdit && !canUpdateStatusAndProgress)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {project ? 'Mettre à jour' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectModal
