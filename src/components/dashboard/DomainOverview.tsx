import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, DollarSign, Users, BookOpen, Globe, Home, Target, Calendar, Edit, Check, X } from 'lucide-react';
import type { User, Goal } from '../../types';
import { cn } from '../../lib/utils';
import { DomainDetails } from './DomainDetails';

interface DomainCard {
  id: keyof NonNullable<User['domains']>;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
}

const domains: DomainCard[] = [
  { id: 'health', label: 'Health & Wellness', icon: Heart, color: 'text-red-600' },
  { id: 'financial', label: 'Financial', icon: DollarSign, color: 'text-green-600' },
  { id: 'family', label: 'Family & Relationships', icon: Users, color: 'text-blue-600' },
  { id: 'personal', label: 'Personal Growth', icon: BookOpen, color: 'text-purple-600' },
  { id: 'community', label: 'Community', icon: Globe, color: 'text-indigo-600' },
  { id: 'home', label: 'Home', icon: Home, color: 'text-orange-600' },
];

interface DomainStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  upcomingMilestones: number;
}

interface EditableDomain {
  id: string;
  label: string;
  lastReview: Date | null;
  nextReview: Date | null;
}

export const DomainOverview = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [domainStats, setDomainStats] = useState<Record<string, DomainStats>>({});
  const [loading, setLoading] = useState(true);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editableDomain, setEditableDomain] = useState<EditableDomain | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }

        // Fetch goals for each domain
        const stats: Record<string, DomainStats> = {};
        
        for (const domain of domains) {
          const goalsQuery = query(
            collection(db, 'goals'),
            where('userId', '==', user.uid),
            where('domain', '==', domain.id)
          );
          
          const goalsSnapshot = await getDocs(goalsQuery);
          const goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Goal);
          
          const now = new Date();
          const upcomingMilestones = goals.reduce((count, goal) => {
            return count + goal.milestones.filter(m => 
              !m.completed && 
              new Date(m.targetDate) > now && 
              new Date(m.targetDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            ).length;
          }, 0);

          stats[domain.id] = {
            totalGoals: goals.length,
            activeGoals: goals.filter(g => g.status === 'active').length,
            completedGoals: goals.filter(g => g.status === 'completed').length,
            upcomingMilestones,
          };
        }

        setDomainStats(stats);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleEditDomain = (domainId: string) => {
    const domain = userData?.domains?.[domainId];
    setEditingDomain(domainId);
    setEditableDomain({
      id: domainId,
      label: domains.find(d => d.id === domainId)?.label || '',
      lastReview: domain?.lastReview ? new Date(domain.lastReview) : null,
      nextReview: domain?.nextReview ? new Date(domain.nextReview) : null,
    });
  };

  const handleSaveDomain = async () => {
    if (!user || !editableDomain) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`domains.${editableDomain.id}`]: {
          lastReview: editableDomain.lastReview,
          nextReview: editableDomain.nextReview,
        },
      });

      setUserData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          domains: {
            ...prev.domains,
            [editableDomain.id]: {
              lastReview: editableDomain.lastReview,
              nextReview: editableDomain.nextReview,
            },
          },
        };
      });

      setEditingDomain(null);
      setEditableDomain(null);
    } catch (error) {
      console.error('Error updating domain:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Life Domains</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map(({ id, label, icon: Icon, color }) => {
          const stats = domainStats[id] || {
            totalGoals: 0,
            activeGoals: 0,
            completedGoals: 0,
            upcomingMilestones: 0,
          };

          const isEditing = editingDomain === id;

          return (
            <div
              key={id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedDomain(id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center justify-center p-2 rounded-lg bg-opacity-10 ${color.replace('text', 'bg')}`}>
                    <Icon className={`${color}`} size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">{label}</h3>
                </div>
                <div className="text-right">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-500">Last Review</label>
                        <input
                          type="date"
                          value={editableDomain?.lastReview?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setEditableDomain(prev => ({
                            ...prev!,
                            lastReview: e.target.value ? new Date(e.target.value) : null,
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">Next Review</label>
                        <input
                          type="date"
                          value={editableDomain?.nextReview?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setEditableDomain(prev => ({
                            ...prev!,
                            nextReview: e.target.value ? new Date(e.target.value) : null,
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSaveDomain}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDomain(null);
                            setEditableDomain(null);
                          }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {userData?.domains?.[id]?.lastReview
                          ? `Last reviewed ${new Date(userData.domains[id].lastReview).toLocaleDateString()}`
                          : 'No reviews yet'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDomain(id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {stats.activeGoals} active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {stats.upcomingMilestones} upcoming
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color.replace('text', 'bg')}`}
                    style={{
                      width: `${stats.totalGoals > 0 
                        ? (stats.completedGoals / stats.totalGoals) * 100 
                        : 0}%`
                    }}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {stats.completedGoals} of {stats.totalGoals} goals completed
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDomain && (
        <DomainDetails
          domainId={selectedDomain}
          onClose={() => setSelectedDomain(null)}
        />
      )}
    </div>
  );
};