export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  projectId?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: string[];
  tasks: string[];
}

export interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'project';
  generatedAt: string;
  data: any;
}