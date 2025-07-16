import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient' // تأكد من المسار الصحيح

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project?: any
  onProjectSaved: () => void
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project, onProjectSaved }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as 'active' | 'planning' | 'completed' | 'on-hold',
    progress: 0,
    start_date: '',
    end_date: '',
    teamMembers: [] as string[],
  })

  const [teamMembersList, setTeamMembersList] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers()
      if (project) {
        setFormData({
          name: project.name || '',
          description: project.description || '',
          status: project.status || 'planning',
          progress: project.progress || 0,
          start_date: project.start_date ? project.start_date.split('T')[0] : '',
          end_date: project.end_date ? project.end_date.split('T')[0] : '',
          teamMembers: project.teamMembers || [],
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
    const { data, error } = await supabase.from('users').select('*')
    if (error) {
      console.error('Erreur fetch team members:', error)
    } else {
      setTeamMembersList(data || [])
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
    if (!user) return
    setLoading(true)

    try {
      const projectData = {
        ...formData,
        progress: Number(formData.progress),
        updated_at: new Date().toISOString(),
        teamMembers: formData.teamMembers,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      if (project) {
        // تحديث مشروع موجود
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)
        if (error) throw error
      } else {
        // إضافة مشروع جديد
        const { error } = await supabase
          .from('projects')
          .insert([
            {
              ...projectData,
              created_by: user.id,
              created_at: new Date().toISOString(),
              id: Date.now().toString(),
            },
          ])
        if (error) throw error
      }

      onProjectSaved()
      onClose()
    } catch (error) {
      console.error('Erreur sauvegarde projet:', error)
      alert('Erreur lors de la sauvegarde du projet')
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

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
                    checked={formData.teamMembers.includes(member.id)}
                    onChange={() => handleCheckboxChange(member.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>{member.name} ({member.role || 'Membre'})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
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
              {project ? 'Mettre à jour' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectModal
