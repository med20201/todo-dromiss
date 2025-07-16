import { User, Task, Project } from '../types';

export const teamMembers: User[] = [
  {
    id: '1',
    name: 'Mohamed Aboummar',
    role: 'Responsable Technique',
    department: 'Technique',
    email: 'mohamed@dromiss.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '2',
    name: 'Fatima Zahra FIGASSOUN',
    role: 'Responsable Marketing & Commercial',
    department: 'Marketing & Commercial',
    email: 'fatima@dromiss.com',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '3',
    name: 'Amine',
    role: 'Stagiaire Intégrateur Odoo',
    department: 'Intégrateur',
    email: 'amine@dromiss.com',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '4',
    name: 'Ibtissam',
    role: 'Stagiaire Marketing & Commercial',
    department: 'Marketing & Commercial',
    email: 'ibtissam@dromiss.com',
    avatar: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '5',
    name: 'Abderrahman',
    role: 'Stagiaire Intégrateur Odoo',
    department: 'Intégrateur',
    email: 'abderrahman@dromiss.com',
    avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '6',
    name: 'Oualid',
    role: 'Manager Technique',
    department: 'Technique',
    email: 'oualid@dromiss.com',
    avatar: 'https://images.pexels.com/photos/2182973/pexels-photo-2182973.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '7',
    name: 'Oussama',
    role: 'Manager Marketing & Commercial',
    department: 'Marketing & Commercial',
    email: 'oussama@dromiss.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '8',
    name: 'Nouhaila',
    role: 'Stagiaire Marketing & Commercial',
    department: 'Marketing & Commercial',
    email: 'nouhaila@dromiss.com',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];

export const tasks: Task[] = [
  {
    id: '1',
    title: 'Configuration Odoo ERP',
    description: 'Configurer les modules de base d\'Odoo pour le client',
    status: 'in-progress',
    priority: 'high',
    assignedTo: '3',
    projectId: '1',
    dueDate: '2025-01-20',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-15'
  },
  {
    id: '2',
    title: 'Campagne Marketing Q1',
    description: 'Planifier et lancer la campagne marketing pour le premier trimestre',
    status: 'todo',
    priority: 'medium',
    assignedTo: '2',
    projectId: '2',
    dueDate: '2025-01-25',
    createdAt: '2025-01-12',
    updatedAt: '2025-01-12'
  },
  {
    id: '3',
    title: 'Développement API',
    description: 'Développer l\'API REST pour l\'intégration mobile',
    status: 'in-progress',
    priority: 'high',
    assignedTo: '1',
    projectId: '1',
    dueDate: '2025-01-30',
    createdAt: '2025-01-08',
    updatedAt: '2025-01-15'
  },
  {
    id: '4',
    title: 'Formation Équipe Odoo',
    description: 'Former l\'équipe sur les nouvelles fonctionnalités Odoo',
    status: 'completed',
    priority: 'medium',
    assignedTo: '5',
    projectId: '1',
    dueDate: '2025-01-15',
    createdAt: '2025-01-05',
    updatedAt: '2025-01-15'
  }
];

export const projects: Project[] = [
  {
    id: '1',
    name: 'Projet Odoo ERP',
    description: 'Implémentation complète d\'Odoo ERP pour les clients',
    status: 'active',
    progress: 65,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    teamMembers: ['1', '3', '5', '6'],
    tasks: ['1', '3', '4']
  },
  {
    id: '2',
    name: 'Stratégie Marketing 2025',
    description: 'Développement de la stratégie marketing pour l\'année 2025',
    status: 'planning',
    progress: 25,
    startDate: '2025-01-15',
    endDate: '2025-12-31',
    teamMembers: ['2', '4', '7', '8'],
    tasks: ['2']
  }
];