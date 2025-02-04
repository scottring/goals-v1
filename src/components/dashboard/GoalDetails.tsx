import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle2, 
  Target, 
  Calendar, 
  BarChart3, 
  MessageSquare,
  TrendingUp,
  Clock,
  X,
  Edit,
  ListChecks,
  Repeat,
  Workflow,
  BookOpen,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import type { Goal, Milestone, Metric, Reflection, Routine } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

interface GoalDetailsProps {
  goalId: string;
  onClose: () => void;
  onEdit?: () => void;
}

export const GoalDetails: React.FC<GoalDetailsProps> = ({ goalId, onClose, onEdit }) => {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'tasks' | 'habits' | 'routines' | 'metrics' | 'reflections'>('overview');

  useEffect(() => {
    const fetchGoal = async () => {
      if (!user) return;
      
      try {
        const goalDoc = await getDoc(doc(db, 'goals', goalId));
        if (goalDoc.exists()) {
          setGoal({ id: goalDoc.id, ...goalDoc.data() } as Goal);
        }
      } catch (error) {
        console.error('Error fetching goal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, [goalId, user]);

  const updateGoalStatus = async (status: Goal['status']) => {
    if (!user || !goal) return;

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        status,
        updatedAt: new Date()
      });
      setGoal({ ...goal, status });
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    if (!user || !goal) return;

    const updatedMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed, completedDate: completed ? new Date() : undefined } : m
    );

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        milestones: updatedMilestones,
        updatedAt: new Date()
      });
      setGoal({ ...goal, milestones: updatedMilestones });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const updateMetric = async (metricId: string, value: number | boolean) => {
    if (!user || !goal) return;

    const updatedMetrics = goal.metrics.map(m => {
      if (m.id === metricId) {
        return {
          ...m,
          current: value,
          history: [...m.history, { date: new Date(), value }]
        };
      }
      return m;
    });

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        metrics: updatedMetrics,
        updatedAt: new Date()
      });
      setGoal({ ...goal, metrics: updatedMetrics });
    } catch (error) {
      console.error('Error updating metric:', error);
    }
  };

  const addReflection = async (reflection: Omit<Reflection, 'id' | 'userId'>) => {
    if (!user || !goal) return;

    const newReflection: Reflection = {
      id: crypto.randomUUID(),
      userId: user.uid,
      ...reflection
    };

    const updatedReflections = [...goal.reflections, newReflection];

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        reflections: updatedReflections,
        updatedAt: new Date()
      });
      setGoal({ ...goal, reflections: updatedReflections });
    } catch (error) {
      console.error('Error adding reflection:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!goal) {
    return <div>Goal not found</div>;
  }

  const getProgressPercentage = () => {
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  };

  const getDaysRemaining = () => {
    if (!goal.targetDate) return null;
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{goal.title}</h2>
              <p className="text-gray-500 mt-1">{goal.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <Edit size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-6 pb-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Target size={16} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'progress' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <TrendingUp size={16} />
                Progress
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'tasks' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <ListChecks size={16} />
                Tasks & Milestones
              </button>
              <button
                onClick={() => setActiveTab('habits')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'habits' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Repeat size={16} />
                Habits
              </button>
              <button
                onClick={() => setActiveTab('routines')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'routines' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Workflow size={16} />
                Routines
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'metrics' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <BarChart3 size={16} />
                Metrics
              </button>
              <button
                onClick={() => setActiveTab('reflections')}
                className={cn(
                  "px-4 py-2 rounded-md flex items-center gap-2",
                  activeTab === 'reflections' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <MessageSquare size={16} />
                Reflections
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => updateGoalStatus('active')}
                      className={cn(
                        "flex-1 px-3 py-1 rounded-md text-sm",
                        goal.status === 'active' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      )}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => updateGoalStatus('completed')}
                      className={cn(
                        "flex-1 px-3 py-1 rounded-md text-sm",
                        goal.status === 'completed' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                      )}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => updateGoalStatus('paused')}
                      className={cn(
                        "flex-1 px-3 py-1 rounded-md text-sm",
                        goal.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-100'
                      )}
                    >
                      Paused
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Progress</h3>
                    <span className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {goal.milestones.filter(m => m.completed).length} of {goal.milestones.length} milestones completed
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Timeline</h3>
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <div className="mt-4">
                    {goal.targetDate ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {getDaysRemaining()} days
                        </p>
                        <p className="text-sm text-gray-500">
                          until {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">No target date set</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="text-blue-600" size={20} />
                    <h3 className="text-lg font-medium">Resources</h3>
                  </div>
                  <ul className="space-y-2">
                    {goal.resources?.map((resource, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-yellow-600" size={20} />
                    <h3 className="text-lg font-medium">Potential Obstacles</h3>
                  </div>
                  <ul className="space-y-2">
                    {goal.obstacles?.map((obstacle, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-yellow-600 rounded-full" />
                        {obstacle}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="text-green-600" size={20} />
                  <h3 className="text-lg font-medium">Success Criteria</h3>
                </div>
                <ul className="space-y-2">
                  {goal.successCriteria?.map((criteria, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <span className="w-2 h-2 bg-green-600 rounded-full" />
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-medium mb-6">Milestone Progress</h3>
                <div className="relative pt-4">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-8">
                    {goal.milestones.map((milestone, index) => (
                      <div key={milestone.id} className="relative pl-10">
                        <div 
                          className={cn(
                            "absolute left-2.5 -translate-x-1/2 w-3 h-3 rounded-full",
                            milestone.completed 
                              ? "bg-green-500 border-2 border-green-200" 
                              : "bg-white border-2 border-gray-300"
                          )}
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            {milestone.description && (
                              <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              Target: {new Date(milestone.targetDate).toLocaleDateString()}
                            </p>
                          </div>
                          {milestone.completed && milestone.completedDate && (
                            <span className="text-sm text-green-600">
                              Completed {new Date(milestone.completedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {goal.metrics.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-medium mb-6">Metrics Progress</h3>
                  <div className="space-y-6">
                    {goal.metrics.map((metric) => (
                      <div key={metric.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{metric.name}</h4>
                            {metric.frequency && (
                              <p className="text-sm text-gray-500">
                                Updated {metric.frequency}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            Target: {metric.target} {metric.unit}
                          </span>
                        </div>
                        {metric.history.length > 0 && (
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={metric.history.map(h => ({
                                date: new Date(h.date).toLocaleDateString(),
                                value: h.value
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#2563eb"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {goal.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleMilestone(milestone.id, !milestone.completed)}
                      className={`rounded-full p-1 ${
                        milestone.completed ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'
                      }`}
                    >
                      <CheckCircle2 size={24} />
                    </button>
                    <div>
                      <h4 className="font-medium">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-500">{milestone.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Target: {new Date(milestone.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {milestone.completed && milestone.completedDate && (
                    <span className="text-sm text-green-600">
                      Completed {new Date(milestone.completedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-4">
              {goal.dailyHabits?.map((habit, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Repeat className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium">{habit}</h4>
                    <p className="text-sm text-gray-500">Daily habit</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'routines' && (
            <div className="space-y-6">
              {goal.routines?.map((routine, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium">{routine.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{routine.frequency} routine</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {routine.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                          {stepIndex + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {goal.metrics.map((metric) => (
                <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{metric.name}</h4>
                      {metric.frequency && (
                        <p className="text-sm text-gray-500">
                          Updated {metric.frequency}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      Target: {metric.type === 'boolean' ? (metric.target ? 'Yes' : 'No') : `${metric.target} ${metric.unit || ''}`}
                    </span>
                  </div>
                  {metric.type === 'boolean' ? (
                    <button
                      onClick={() => updateMetric(metric.id, !metric.current)}
                      className={`px-4 py-2 rounded-md ${
                        metric.current ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {metric.current ? 'Yes' : 'No'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={metric.current as number}
                        onChange={(e) => updateMetric(metric.id, parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {metric.unit && (
                        <span className="text-gray-500">{metric.unit}</span>
                      )}
                    </div>
                  )}
                  {metric.history.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">History</h5>
                      <div className="space-y-2">
                        {metric.history.slice(-5).map((entry, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                            <span>{entry.value.toString()} {metric.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reflections' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Add Reflection</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addReflection({
                      date: new Date(),
                      type: 'weekly',
                      progress: formData.get('progress') as string,
                      challenges: formData.get('challenges') as string,
                      insights: formData.get('insights') as string,
                      nextSteps: formData.get('nextSteps') as string,
                      satisfaction: parseInt(formData.get('satisfaction') as string),
                    });
                    e.currentTarget.reset();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                    <textarea
                      name="progress"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Challenges</label>
                    <textarea
                      name="challenges"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insights</label>
                    <textarea
                      name="insights"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Steps</label>
                    <textarea
                      name="nextSteps"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Satisfaction (1-10)</label>
                    <input
                      type="range"
                      name="satisfaction"
                      min="1"
                      max="10"
                      className="w-full"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Reflection
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                {goal.reflections.map((reflection) => (
                  <div key={reflection.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm text-gray-500">
                        {new Date(reflection.date).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                        Satisfaction: {reflection.satisfaction}/10
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Progress</h5>
                        <p className="text-gray-600">{reflection.progress}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Challenges</h5>
                        <p className="text-gray-600">{reflection.challenges}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Insights</h5>
                        <p className="text-gray-600">{reflection.insights}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Next Steps</h5>
                        <p className="text-gray-600">{reflection.nextSteps}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};