import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
}

const Equipe: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from<TeamMember>('users')
        .select('id, name, email, role, department, avatar');
      if (error) throw error;
      if (data) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Erreur fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(teamMembers.map((member) => member.department))];

  const getDepartmentMembers = (department: string) => {
    return teamMembers.filter((member) => member.department === department);
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      Technique: 'bg-blue-100 text-blue-800',
      'Marketing & Commercial': 'bg-green-100 text-green-800',
      Intégrateur: 'bg-purple-100 text-purple-800',
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-gray-500">
        Chargement de l'équipe...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Équipe Dromiss</h1>
            <p className="text-gray-600 mt-1">Gestion de l'équipe et des départements</p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{teamMembers.length} membres</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{departments.length} départements</span>
            </div>
          </div>
        </div>
      </div>

      {/* Departments */}
      {departments.map((department) => {
        const members = getDepartmentMembers(department);
        return (
          <div key={department} className="bg-white rounded-lg shadow-md border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{department}</h2>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getDepartmentColor(
                    department
                  )}`}
                >
                  {members.length} membre{members.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          member.avatar ||
                          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
                        }
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="w-4 h-4 mr-1" />
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Département</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(
                            member.department
                          )}`}
                        >
                          {member.department}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Team Statistics */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Statistiques de l'Équipe</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departments.map((department) => {
              const members = getDepartmentMembers(department);
              const managers = members.filter(
                (m) => m.role.includes('Manager') || m.role.includes('Responsable')
              );
              const stagiaires = members.filter((m) => m.role.includes('Stagiaire'));

              return (
                <div key={department} className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{department}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{members.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Managers:</span>
                      <span className="font-medium">{managers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stagiaires:</span>
                      <span className="font-medium">{stagiaires.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equipe;
