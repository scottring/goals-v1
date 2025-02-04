import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { DomainOverview } from './DomainOverview';
import { GoalsList } from './GoalsList';
import { WeeklyReview } from './WeeklyReview';
import { Brain, Target, Calendar } from 'lucide-react';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'review'>('overview');

  const tabs = [
    { id: 'overview', label: 'Domain Overview', icon: Brain },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'review', label: 'Weekly Review', icon: Calendar },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-4">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center px-4 py-2 rounded-md ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'overview' && <DomainOverview />}
          {activeTab === 'goals' && <GoalsList />}
          {activeTab === 'review' && <WeeklyReview />}
        </div>
      </div>
    </Layout>
  );
};