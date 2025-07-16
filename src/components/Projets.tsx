import React, { useEffect, useState } from 'react'
import { Plus, Calendar, Users, Trash2 } from 'lucide-react'
import ProjectModal from './ProjectModal'

type Project = {
  id: string
  name: string
  description: string
  status: string
  progress: number
  start_date: string
  end_date: string
  teamMembers?: string[]
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
      // لو كنت تستعمل API من السيرفر، بدّل الرابط أدناه
      const projectsResponse = await fetch('http://localhost:3001/projects')
      const projectsData = await projectsResponse.json()
      setProjects(projectsData || [])

      const usersResponse = await fetch('http://localhost:3001/users')
      const usersData = await usersResponse.json()
      setTeamMembers(usersData || [])

      const tasksResponse = await fetch('http://localhost:3001/tasks')
      const tasksData = await tasksResponse.json()
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'on-hold':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'planning':
        return 'Planification'
      case 'completed':
        return 'Terminé'
      case 'on-hold':
        return 'En pause'
      default:
        return status
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
      const response = await fetch(`http://localhost:3001/projects/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete project')
      fetchData()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du projet')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Projets</h1>
            <p className="text-gray-600 mt-1">Suivez l'avancement de tous vos projets</p>
          </div>
          <button
            onClick={handleNewProject}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </button>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-8 text-center text-gray-600">Chargement des projets...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(project => {
            const projectTasks = getProjectTasks(project.id)
            const completedTasks = projectTasks.filter(task => task.status === 'completed').length

            const members = project.teamMembers
              ? project.teamMembers
                  .map(id => teamMembers.find(m => m.id === id))
                  .filter(Boolean) as User[]
              : []

            return (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden cursor-pointer relative flex flex-col"
                onClick={() => handleEditProject(project)}
                title="Cliquer pour modifier"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-gray-600 text-sm">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>

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

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Début</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(project.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Fin prévue</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(project.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="w-4 h-4 mr-1" />
                      <span>Équipe ({members.length} membres)</span>
                    </div>
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map(member => (
                        <img
                          key={member.id}
                          src={member.avatar || '/default-avatar.png'}
                          alt={member.name}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          title={member.name}
                        />
                      ))}
                      {members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            +{members.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tâches</span>
                      <span className="font-medium text-gray-900">
                        {completedTasks}/{projectTasks.length} terminées
                      </span>
                    </div>
                    {projectTasks.length > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(completedTasks / projectTasks.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button at bottom */}
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
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
