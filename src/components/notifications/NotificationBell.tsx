import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Goal } from '../../types';

interface Notification {
  id: string;
  type: 'milestone' | 'review' | 'goal';
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!user) return;

      const newNotifications: Notification[] = [];
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Fetch goals
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid),
        where('status', '==', 'active')
      );

      const goalsSnapshot = await getDocs(goalsQuery);
      const goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Goal);

      // Check upcoming milestones
      goals.forEach(goal => {
        goal.milestones
          .filter(m => !m.completed && new Date(m.targetDate) <= weekFromNow)
          .forEach(milestone => {
            newNotifications.push({
              id: `milestone-${milestone.id}`,
              type: 'milestone',
              title: 'Upcoming Milestone',
              message: `"${milestone.title}" for goal "${goal.title}" is due on ${new Date(milestone.targetDate).toLocaleDateString()}`,
              date: new Date(milestone.targetDate),
              read: false,
            });
          });
      });

      // Check for goals without recent reviews
      goals.forEach(goal => {
        const lastReflection = goal.reflections[goal.reflections.length - 1];
        const lastReviewTime = lastReflection ? new Date(lastReflection.date).getTime() : 0;
        if (!lastReflection || lastReviewTime + 7 * 24 * 60 * 60 * 1000 < now.getTime()) {
          newNotifications.push({
            id: `review-${goal.id}`,
            type: 'review',
            title: 'Review Needed',
            message: `It's time for a weekly review of your goal "${goal.title}"`,
            date: now,
            read: false,
          });
        }
      });

      // Check goals near target date
      goals.forEach(goal => {
        if (goal.targetDate && new Date(goal.targetDate) <= weekFromNow) {
          newNotifications.push({
            id: `goal-${goal.id}`,
            type: 'goal',
            title: 'Goal Deadline Approaching',
            message: `Your goal "${goal.title}" is due on ${new Date(goal.targetDate).toLocaleDateString()}`,
            date: new Date(goal.targetDate),
            read: false,
          });
        }
      });

      setNotifications(newNotifications.sort((a, b) => b.date.getTime() - a.date.getTime()));
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};