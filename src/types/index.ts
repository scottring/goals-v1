export interface User {
  id: string;
  email: string;
  displayName: string | null;
  domains?: {
    [key: string]: {
      lastReview: Date;
      nextReview: Date;
    };
  };
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  domain: 'financial' | 'health' | 'family' | 'personal' | 'community' | 'home' | 'work';
  status: 'active' | 'completed' | 'paused';
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  milestones: Milestone[];
  metrics: Metric[];
  weeklyActions: string[];
  dailyHabits: string[];
  routines: Routine[];
  resources: string[];
  obstacles: string[];
  successCriteria: string[];
  reflections: Reflection[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

export interface Metric {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'rating';
  target: number | boolean;
  current: number | boolean;
  unit?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  history: {
    date: Date;
    value: number | boolean;
  }[];
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  steps: string[];
  lastCompleted?: Date;
  nextDue?: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface Reflection {
  id: string;
  userId: string;
  date: Date;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  progress: string;
  challenges: string;
  insights: string;
  nextSteps: string;
  satisfaction: number;
}