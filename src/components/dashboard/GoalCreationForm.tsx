import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Calendar, ListChecks, Repeat, Workflow, BookOpen, AlertTriangle, Trophy, BarChart3 } from 'lucide-react';
import type { Goal, Milestone, Metric, Routine } from '../../types';

interface GoalCreationFormProps {
  onClose: () => void;
  initialData?: Goal;
  onSubmit?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
}

const GoalCreationForm: React.FC<GoalCreationFormProps> = ({ 
  onClose, 
  initialData,
  onSubmit 
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [domain, setDomain] = useState<Goal['domain']>(initialData?.domain || 'personal');
  const [targetDate, setTargetDate] = useState(() => {
    if (initialData?.targetDate && !isNaN(new Date(initialData.targetDate).getTime())) {
      return new Date(initialData.targetDate).toISOString().split('T')[0];
    }
    return '';
  });
  const [milestones, setMilestones] = useState<Omit<Milestone, 'id' | 'completed' | 'completedDate'>[]>(
    initialData?.milestones.map(m => ({
      title: m.title,
      description: m.description,
      targetDate: m.targetDate,
      frequency: m.frequency
    })) || []
  );
  const [metrics, setMetrics] = useState<Omit<Metric, 'id' | 'history'>[]>(
    initialData?.metrics.map(m => ({
      name: m.name,
      type: m.type,
      target: m.target,
      current: m.current,
      unit: m.unit,
      frequency: m.frequency
    })) || []
  );
  const [weeklyActions, setWeeklyActions] = useState<string[]>(initialData?.weeklyActions || ['']);
  const [dailyHabits, setDailyHabits] = useState<string[]>(initialData?.dailyHabits || ['']);
  const [routines, setRoutines] = useState<Omit<Routine, 'id' | 'lastCompleted' | 'nextDue'>[]>(
    initialData?.routines.map(r => ({
      name: r.name,
      description: r.description,
      frequency: r.frequency,
      steps: r.steps
    })) || []
  );
  const [resources, setResources] = useState<string[]>(initialData?.resources || ['']);
  const [obstacles, setObstacles] = useState<string[]>(initialData?.obstacles || ['']);
  const [successCriteria, setSuccessCriteria] = useState<string[]>(initialData?.successCriteria || ['']);

  const domains: { value: Goal['domain']; label: string }[] = [
    { value: 'work', label: 'Work' },
    { value: 'financial', label: 'Financial' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'family', label: 'Family & Relationships' },
    { value: 'personal', label: 'Personal Growth' },
    { value: 'community', label: 'Community' },
    { value: 'home', label: 'Home' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const goalData = {
      title,
      description,
      domain,
      status: 'active' as const,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      milestones: milestones.map(m => ({
        ...m,
        id: crypto.randomUUID(),
        completed: false,
      })),
      metrics: metrics.map(m => ({
        ...m,
        id: crypto.randomUUID(),
        history: [],
      })),
      weeklyActions: weeklyActions.filter(action => action.trim() !== ''),
      dailyHabits: dailyHabits.filter(habit => habit.trim() !== ''),
      routines: routines.map(r => ({
        ...r,
        id: crypto.randomUUID(),
        lastCompleted: undefined,
        nextDue: undefined,
      })),
      resources: resources.filter(r => r.trim() !== ''),
      obstacles: obstacles.filter(o => o.trim() !== ''),
      successCriteria: successCriteria.filter(c => c.trim() !== ''),
    };

    try {
      if (initialData && onSubmit) {
        await onSubmit(initialData.id, goalData);
      } else {
        await addDoc(collection(db, 'goals'), {
          ...goalData,
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          reflections: [],
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, { 
      title: '', 
      description: '',
      targetDate: new Date(),
      frequency: 'once'
    }]);
  };

  const updateMilestone = (index: number, field: keyof Omit<Milestone, 'id' | 'completed' | 'completedDate'>, value: string | Date) => {
    setMilestones(prev => prev.map((m, i) => 
      i === index ? { 
        ...m, 
        [field]: field === 'targetDate' ? new Date(value) : value 
      } : m
    ));
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const addMetric = () => {
    setMetrics(prev => [...prev, { 
      name: '', 
      type: 'number', 
      target: 0, 
      current: 0,
      unit: '',
      frequency: 'daily'
    }]);
  };

  const updateMetric = (index: number, field: keyof Omit<Metric, 'id' | 'history'>, value: string | number | boolean) => {
    setMetrics(prev => prev.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const removeMetric = (index: number) => {
    setMetrics(prev => prev.filter((_, i) => i !== index));
  };

  const addRoutine = () => {
    setRoutines(prev => [...prev, {
      name: '',
      description: '',
      frequency: 'daily',
      steps: ['']
    }]);
  };

  const updateRoutine = (index: number, field: keyof Omit<Routine, 'id' | 'lastCompleted' | 'nextDue'>, value: any) => {
    setRoutines(prev => prev.map((r, i) => 
      i === index ? { ...r, [field]: value } : r
    ));
  };

  const removeRoutine = (index: number) => {
    setRoutines(prev => prev.filter((_, i) => i !== index));
  };

  const addRoutineStep = (routineIndex: number) => {
    setRoutines(prev => prev.map((r, i) => 
      i === routineIndex ? { ...r, steps: [...r.steps, ''] } : r
    ));
  };

  const updateRoutineStep = (routineIndex: number, stepIndex: number, value: string) => {
    setRoutines(prev => prev.map((r, i) => 
      i === routineIndex ? {
        ...r,
        steps: r.steps.map((s, si) => si === stepIndex ? value : s)
      } : r
    ));
  };

  const removeRoutineStep = (routineIndex: number, stepIndex: number) => {
    setRoutines(prev => prev.map((r, i) => 
      i === routineIndex ? {
        ...r,
        steps: r.steps.filter((_, si) => si !== stepIndex)
      } : r
    ));
  };

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const updateArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {initialData ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as Goal['domain'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {domains.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Milestones Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ListChecks size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Milestones</label>
                </div>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Milestone
                </button>
              </div>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          placeholder="Milestone title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="date"
                          value={
                            milestone.targetDate instanceof Date && !isNaN(milestone.targetDate.getTime())
                              ? milestone.targetDate.toISOString().split('T')[0]
                              : typeof milestone.targetDate === 'string'
                              ? milestone.targetDate
                              : ''
                          }
                          onChange={(e) => updateMilestone(index, 'targetDate', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <select
                          value={milestone.frequency}
                          onChange={(e) => updateMilestone(index, 'frequency', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Metrics</label>
                </div>
                <button
                  type="button"
                  onClick={addMetric}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Metric
                </button>
              </div>
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={metric.name}
                          onChange={(e) => updateMetric(index, 'name', e.target.value)}
                          placeholder="Metric name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMetric(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex gap-4">
                        <select
                          value={metric.type}
                          onChange={(e) => updateMetric(index, 'type', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="number">Number</option>
                          <option value="boolean">Yes/No</option>
                          <option value="rating">Rating</option>
                        </select>
                        <input
                          type={metric.type === 'boolean' ? 'checkbox' : 'number'}
                          checked={metric.type === 'boolean' ? metric.target as boolean : undefined}
                          value={metric.type !== 'boolean' ? metric.target as number : undefined}
                          onChange={(e) => updateMetric(index, 'target', 
                            metric.type === 'boolean' ? e.target.checked : parseFloat(e.target.value)
                          )}
                          placeholder="Target"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={metric.unit}
                          onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                          placeholder="Unit (e.g., kg, km)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <select
                          value={metric.frequency}
                          onChange={(e) => updateMetric(index, 'frequency', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Actions Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Weekly Actions</label>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem(setWeeklyActions)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Action
                </button>
              </div>
              <div className="space-y-2">
                {weeklyActions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => updateArrayItem(setWeeklyActions, index, e.target.value)}
                      placeholder="Weekly action"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(setWeeklyActions, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Habits Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Repeat size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Daily Habits</label>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem(setDailyHabits)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Habit
                </button>
              </div>
              <div className="space-y-2">
                {dailyHabits.map((habit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={habit}
                      onChange={(e) => updateArrayItem(setDailyHabits, index, e.target.value)}
                      placeholder="Daily habit"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(setDailyHabits, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Routines Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Workflow size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Routines</label>
                </div>
                <button
                  type="button"
                  onClick={addRoutine}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Routine
                </button>
              </div>
              <div className="space-y-4">
                {routines.map((routine, routineIndex) => (
                  <div key={routineIndex} className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={routine.name}
                          onChange={(e) => updateRoutine(routineIndex, 'name', e.target.value)}
                          placeholder="Routine name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRoutine(routineIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={routine.description}
                        onChange={(e) => updateRoutine(routineIndex, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <select
                        value={routine.frequency}
                        onChange={(e) => updateRoutine(routineIndex, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Steps</label>
                        <button
                          type="button"
                          onClick={() => addRoutineStep(routineIndex)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Step
                        </button>
                      </div>
                      {routine.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                            {stepIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => updateRoutineStep(routineIndex, stepIndex, e.target.value)}
                            placeholder={`Step ${stepIndex + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeRoutineStep(routineIndex, stepIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Resources Needed</label>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem(setResources)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Resource
                </button>
              </div>
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resource}
                      onChange={(e) => updateArrayItem(setResources, index, e.target.value)}
                      placeholder="Resource needed"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(setResources, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Obstacles Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Potential Obstacles</label>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem(setObstacles)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Obstacle
                </button>
              </div>
              <div className="space-y-2">
                {obstacles.map((obstacle, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={obstacle}
                      onChange={(e) => updateArrayItem(setObstacles, index, e.target.value)}
                      placeholder="Potential obstacle"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(setObstacles, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Criteria Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">Success Criteria</label>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem(setSuccessCriteria)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Criteria
                </button>
              </div>
              <div className="space-y-2">
                {successCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={criteria}
                      onChange={(e) => updateArrayItem(setSuccessCriteria, index, e.target.value)}
                      placeholder="Success criteria"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(setSuccessCriteria, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {initialData ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoalCreationForm;