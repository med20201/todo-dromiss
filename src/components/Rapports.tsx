import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  CheckSquare,
} from 'lucide-react'

type Task = {
  id: string
  status: string
  assigned_to: string | number
  // ممكن تزيد حقول أخرى حسب جدولك
}

type TeamMember = {
  id: string | number
  name: string
  department?: string
}

type Project = {
  id: string
  status: string
}

const Rapports: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*')
        if (tasksError) throw tasksError

        const { data: usersData, error: usersError } = await supabase.from('users').select('*')
        if (usersError) throw usersError

        const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*')
        if (projectsError) throw projectsError

        setTasks(tasksData || [])
        setTeamMembers(usersData || [])
        setProjects(projectsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Chargement des données...</div>
  }

  // حساب إحصائيات المهام
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // إنتاجية كل عضو في الفريق
  const teamProductivity = teamMembers.map(member => {
    const memberTasks = tasks.filter(task => task.assigned_to == member.id)
    const memberCompleted = memberTasks.filter(task => task.status === 'completed')
    return {
      name: member.name,
      total: memberTasks.length,
      completed: memberCompleted.length,
      rate: memberTasks.length > 0 ? Math.round((memberCompleted.length / memberTasks.length) * 100) : 0,
    }
  })

  // إحصائيات الأقسام
  const departments = Array.from(new Set(teamMembers.map(m => m.department).filter(Boolean))) as string[]
  const departmentStats = departments.map(dept => {
    const deptMembers = teamMembers.filter(m => m.department === dept)
    const deptTasks = tasks.filter(task => deptMembers.some(m => m.id == task.assigned_to))
    const deptCompleted = deptTasks.filter(task => task.status === 'completed')
    return {
      name: dept,
      members: deptMembers.length,
      tasks: deptTasks.length,
      completed: deptCompleted.length,
      rate: deptTasks.length > 0 ? Math.round((deptCompleted.length / deptTasks.length) * 100) : 0,
    }
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports et Analyses</h1>
            <p className="text-gray-600 mt-1">Suivez les performances et la productivité de votre équipe</p>
          </div>
          <button className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux de Completion</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productivité</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Équipe Active</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projets Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Distribution Chart */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Distribution des Tâches</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ToDo Tasks */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{todoTasks}</div>
                    <div className="text-xs text-gray-600">À faire</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-600 h-2 rounded-full"
                  style={{ width: `${totalTasks ? (todoTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* In Progress Tasks */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{inProgressTasks}</div>
                    <div className="text-xs text-blue-700">En cours</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${totalTasks ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900">{completedTasks}</div>
                    <div className="text-xs text-green-700">Terminées</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity per member */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Productivité par Membre</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {teamProductivity.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">
                    {member.completed}/{member.total} tâches terminées
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${member.rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{member.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance par Département</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departmentStats.map((dept, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{dept.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Membres:</span>
                    <span className="font-medium">{dept.members}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tâches totales:</span>
                    <span className="font-medium">{dept.tasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Terminées:</span>
                    <span className="font-medium">{dept.completed}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Taux de réussite:</span>
                      <span className="font-medium">{dept.rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Rapports
