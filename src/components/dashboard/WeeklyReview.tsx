import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, XCircle, Lightbulb, ArrowRight } from 'lucide-react';
import type { Reflection } from '../../types';

export const WeeklyReview = () => {
  const { user } = useAuth();
  const [reflection, setReflection] = useState({
    progress: '',
    challenges: '',
    insights: '',
    nextSteps: '',
    satisfaction: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newReflection: Omit<Reflection, 'id'> = {
        ...reflection,
        userId: user.uid, // Add userId to the reflection
        date: new Date(),
        type: 'weekly',
      };

      await addDoc(collection(db, 'reflections'), newReflection);
      
      setReflection({
        progress: '',
        challenges: '',
        insights: '',
        nextSteps: '',
        satisfaction: 5,
      });
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Weekly Review</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <CheckCircle2 className="text-green-500" size={16} />
            What progress did you make this week?
          </label>
          <textarea
            value={reflection.progress}
            onChange={(e) => setReflection(prev => ({ ...prev, progress: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <XCircle className="text-red-500" size={16} />
            What challenges did you face?
          </label>
          <textarea
            value={reflection.challenges}
            onChange={(e) => setReflection(prev => ({ ...prev, challenges: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Lightbulb className="text-yellow-500" size={16} />
            What insights or lessons did you learn?
          </label>
          <textarea
            value={reflection.insights}
            onChange={(e) => setReflection(prev => ({ ...prev, insights: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <ArrowRight className="text-blue-500" size={16} />
            What are your next steps?
          </label>
          <textarea
            value={reflection.nextSteps}
            onChange={(e) => setReflection(prev => ({ ...prev, nextSteps: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall satisfaction (1-10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={reflection.satisfaction}
            onChange={(e) => setReflection(prev => ({ ...prev, satisfaction: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>1</span>
            <span>{reflection.satisfaction}</span>
            <span>10</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Weekly Review
        </button>
      </form>
    </div>
  );
};