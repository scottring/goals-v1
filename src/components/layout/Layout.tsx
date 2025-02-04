import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { Brain, LogOut } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Brain className="text-blue-600" size={32} />
              <span className="ml-2 text-xl font-semibold">Life Manager</span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
};