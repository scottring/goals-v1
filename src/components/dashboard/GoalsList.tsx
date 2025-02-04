import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Target, Calendar, CheckCircle2, Sparkles, MessageSquare, Edit, Trash2, 
  MoreVertical, X, Plus, ListChecks, Repeat, Workflow, BookOpen, AlertTriangle, Trophy 
} from 'lucide-react';
import type { Goal } from '../../types';
import GoalCreationForm from './GoalCreationForm';
import { AIGoalCreation } from './AIGoalCreation';
import { FreeformAIChat } from './FreeformAIChat';
import { GoalDetails } from './GoalDetails';
import { cn } from '../../lib/utils';

const formatDate = (date: Date | undefined | null): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const GoalsList = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAICreation, setShowAICreation] = useState(false);
  const [showFreeformChat, setShowFreeformChat] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'goals'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newGoals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Goal[];
      setGoals(newGoals);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const newGoal = {
        ...goalData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'goals'), newGoal);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'goals', goalId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEditGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return;

    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        ...updates,
        updatedAt: new Date()
      });
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string, completed: boolean) => {
    if (!user) return;

    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const updatedMilestones = goal.milestones.map(m => 
        m.id === milestoneId ? { 
          ...m, 
          completed, 
          completedDate: completed ? new Date() : undefined 
        } : m
      );

      await updateDoc(goalRef, {
        milestones: updatedMilestones,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
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

  const getProgressPercentage = (goal: Goal) => {
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Goals</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFreeformChat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <MessageSquare size={16} />
            Chat with AI
          </button>
          <button
            onClick={() => setShowAICreation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Sparkles size={16} />
            Guided Creation
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Target size={16} />
            Manual Create
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedGoal(goal.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
                <p className="mt-1 text-gray-600 line-clamp-2">{goal.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(goal.status)
                  )}>
                    {goal.status}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    Target: {formatDate(goal.targetDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === goal.id ? null : goal.id);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {menuOpen === goal.id && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit size={16} />
                        Edit Goal
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(goal.id);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Delete Goal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-blue-600" />
                <span>{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} Milestones</span>
              </div>
              {goal.dailyHabits?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Repeat size={16} className="text-purple-600" />
                  <span>{goal.dailyHabits.length} Habits</span>
                </div>
              )}
              {goal.routines?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Workflow size={16} className="text-indigo-600" />
                  <span>{goal.routines.length} Routines</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No goals yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new goal.</p>
          </div>
        )}
      </div>

      {showCreateForm && (
        <GoalCreationForm onClose={() => setShowCreateForm(false)} />
      )}

      {showAICreation && (
        <AIGoalCreation
          onClose={() => setShowAICreation(false)}
          onCreateGoal={handleCreateGoal}
        />
      )}

      {showFreeformChat && (
        <FreeformAIChat
          onClose={() => setShowFreeformChat(false)}
          onCreateGoal={handleCreateGoal}
        />
      )}

      {selectedGoal && (
        <GoalDetails
          goalId={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onEdit={() => {
            const goal = goals.find(g => g.id === selectedGoal);
            if (goal) {
              setEditingGoal(goal);
              setSelectedGoal(null);
            }
          }}
        />
      )}

      {editingGoal && (
        <GoalCreationForm 
          onClose={() => setEditingGoal(null)}
          initialData={editingGoal}
          onSubmit={handleEditGoal}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Delete Goal</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGoal(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};