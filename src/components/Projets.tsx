import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import ProjectModal from './ProjectModal'
import { supabase } from '../lib/supabaseClient'  // تأكد المسار صحيح عندك

type Project = {
  id: string
  name: string
  description: string
  status: string
  progress: number
  start_date: string
  end_date: string
  teamMembers?: string[] // array of user ids
}

type User = {
  id: string
  name: string
  avatar: string | null
}

type Task = {
  id: string
  projectId: string
  status: string
}

const Projets: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // جلب المشاريع
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*')
      if (projectsError) throw projectsError

      // تحويل teamMembers من نص JSON إلى مصفوفة إذا لزم الأمر
      const projectsParsed = (projectsData || []).map(proj => {
        let teamMembersParsed: string[] = []
        if (typeof proj.teammembers === 'string') {  // لاحظ 'teammembers' صغير
          try {
            teamMembersParsed = JSON.parse(proj.teammembers)
          } catch (e) {
            teamMembersParsed = []
          }
        } else if (Array.isArray(proj.teammembers)) {
          teamMembersParsed = proj.teammembers
        }
        return {
          ...proj,
          teamMembers: teamMembersParsed,
        }
      })

      setProjects(projectsParsed)

      // جلب أعضاء الفريق
      const { data: usersData, error: usersError } = await supabase.from('users').select('*')
      if (usersError) throw usersError
      setTeamMembers(usersData || [])

      // جلب المهام
      const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*')
      if (tasksError) throw tasksError
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectid === projectId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on-hold': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'planning': return 'Planification'
      case 'completed': return 'Terminé'
      case 'on-hold': return 'En pause'
      default: return status
    }
  }

  const handleNewProject = () => {
    setEditingProject(undefined)
    setModalOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setModalOpen(true)
  }

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le projet "${name}" ?`)) return

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du projet')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-gray-600 mt-1">Suivez l'avancement de tous vos projets</p>
        </div>
        <button
          onClick={handleNewProject}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Projet
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-8 text-center text-gray-600">Chargement des projets...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(project => {
            const projectTasks = getProjectTasks(project.id)
            const completedTasksCount = projectTasks.filter(task => task.status === 'completed').length

            const members = project.teamMembers
              ? project.teamMembers
                .map(id => teamMembers.find(m => m.id === id))
                .filter(Boolean) as User[]
              : []

            return (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden cursor-pointer flex flex-col"
                onClick={() => handleEditProject(project)}
                title="Cliquer pour modifier"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h2>
                  <p className="text-gray-700 mb-4">{project.description}</p>

                  <div className="flex items-center mb-2 space-x-4">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Progression: {project.progress}%
                    </span>
                    <span className="text-sm text-gray-600">
                      Tâches terminées: {completedTasksCount}/{projectTasks.length}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mb-2">
                    <div>Début: {project.start_date}</div>
                    <div>Fin: {project.end_date}</div>
                  </div>

                  <div className="mt-auto">
                    <p className="text-sm font-semibold mb-1">Membres de l'équipe:</p>
                    <div className="flex space-x-2">
                      {members.length > 0 ? (
                        members.map(member => (
                          <span
                            key={member.id}
                            className="text-sm text-gray-700 bg-gray-100 rounded px-2 py-1"
                            title={member.name}
                          >
                            {member.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">Aucun membre</span>
                      )}

                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditProject(project)
                    }}
                  >
                    Voir les détails →
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id, project.name)
                    }}
                    title="Supprimer le projet"
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={editingProject}
        onProjectSaved={() => {
          fetchData()
          setModalOpen(false)
        }}
      />
    </div>
  )
}

export default Projets
