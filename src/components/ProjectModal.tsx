import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'  // تأكد أنك كتستورد supabase من هنا

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
    teamMembers: [] as string[], // array of user IDs
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

  // fetch team members from supabase
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
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)

        if (error) throw error
      } else {
        // Insert new project
        const { error } = await supabase
          .from('projects')
          .insert([
            {
              ...projectData,
              created_by: user.id,
              created_at: new Date().toISOString(),
              id: Date.now().toString(), // or use UUID on backend
            }
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
          {/* ... نفس الفورم ... */}
          {/* محتوى الفورم يبقى كما هو */}
          {/* فقط استبدال submit event فقط */}
        </form>
      </div>
    </div>
  )
}

export default ProjectModal
