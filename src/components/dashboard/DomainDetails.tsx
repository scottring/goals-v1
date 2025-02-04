import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle2, 
  Target, 
  Calendar, 
  BarChart3, 
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import type { Goal } from '../../types';
import GoalCreationForm from './GoalCreationForm';

interface DomainDetailsProps {
  domainId: string;
  onClose: () => void;
}

export const DomainDetails: React.FC<DomainDetailsProps> = ({ domainId, onClose }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;

      try {
        const goalsQuery = query(
          collection(db, 'goals'),
          where('userId', '==', user.uid),
          where('domain', '==', domainId)
        );
        
        const goalsSnapshot = await getDocs(goalsQuery);
        const goalsData = goalsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Goal[];
        
        setGoals(goalsData);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user, domainId]);

  const getProgressPercentage = (goal: Goal) => {
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-semibold capitalize">{domainId} Goals</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
                    <p className="mt-1 text-gray-600">{goal.description}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusColor(goal.status)
                      )}>
                        {goal.status}
                      </span>
                      {goal.targetDate && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  >
                    <Edit size={20} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{getProgressPercentage(goal)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercentage(goal)}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                {goal.milestones.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <ListChecks size={16} />
                      Milestones
                    </h4>
                    <div className="space-y-2">
                      {goal.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className={cn(
                            "flex-shrink-0",
                            milestone.completed ? "text-green-500" : "text-gray-400"
                          )}>
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900">{milestone.title}</p>
                            {milestone.description && (
                              <p className="text-sm text-gray-500">{milestone.description}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Habits and Routines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Daily Habits */}
                  {goal.dailyHabits && goal.dailyHabits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Repeat size={16} />
                        Daily Habits
                      </h4>
                      <div className="space-y-2">
                        {goal.dailyHabits.map((habit, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            {habit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Routines */}
                  {goal.routines && goal.routines.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Workflow size={16} />
                        Routines
                      </h4>
                      <div className="space-y-2">
                        {goal.routines.map((routine) => (
                          <div key={routine.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{routine.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{routine.description}</p>
                            <div className="mt-2 space-y-1">
                              {routine.steps.map((step, stepIndex) => (
                                <div key={stepIndex} className="flex items-center gap-2 text-sm">
                                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    {stepIndex + 1}
                                  </span>
                                  {step}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resources and Obstacles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Resources */}
                  {goal.resources && goal.resources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <BookOpen size={16} />
                        Resources
                      </h4>
                      <div className="space-y-2">
                        {goal.resources.map((resource, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            {resource}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Obstacles */}
                  {goal.obstacles && goal.obstacles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Obstacles
                      </h4>
                      <div className="space-y-2">
                        {goal.obstacles.map((obstacle, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            {obstacle}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Success Criteria */}
                {goal.successCriteria && goal.successCriteria.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Trophy size={16} />
                      Success Criteria
                    </h4>
                    <div className="space-y-2">
                      {goal.successCriteria.map((criteria, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          {criteria}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {goals.length === 0 && (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No goals in this domain</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new goal.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingGoal && (
        <GoalCreationForm 
          onClose={() => setEditingGoal(null)}
          initialData={editingGoal}
          onSubmit={async (goalId, updates) => {
            try {
              await updateDoc(doc(db, 'goals', goalId), {
                ...updates,
                updatedAt: new Date()
              });
              setEditingGoal(null);
            } catch (error) {
              console.error('Error updating goal:', error);
            }
          }}
        />
      )}
    </div>
  );
};