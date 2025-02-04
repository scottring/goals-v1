import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, X, Lightbulb } from 'lucide-react';
import type { Goal } from '../../types';
import { generateSuggestion, getAIResponse } from '../../lib/openai';
import { cn } from '../../lib/utils';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIGoalCreationProps {
  onClose: () => void;
  onCreateGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
}

export const AIGoalCreation: React.FC<AIGoalCreationProps> = ({ onClose, onCreateGoal }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you create a meaningful goal. Let's start with the basics. What area of your life would you like to focus on? (e.g., work, health, financial, family, personal growth, community, or home)",
    },
  ]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [goalData, setGoalData] = useState<Partial<Goal>>({
    status: 'active',
    milestones: [],
    metrics: [],
    weeklyActions: [],
    dailyHabits: [],
    routines: [],
    resources: [],
    obstacles: [],
    successCriteria: [],
    reflections: [],
  });

  const questions = [
    "What area of your life would you like to focus on? (work, health, financial, family, personal growth, community, or home)",
    "Great! Now, what specific goal would you like to achieve in this area? Be as specific as possible.",
    "Why is this goal important to you? This will help create a meaningful description.",
    "When would you like to achieve this goal by? (e.g., 3 months, 6 months, 1 year)",
    "Let's break this down into milestones. What are 2-3 key checkpoints on the way to your goal?",
    "How will you measure progress? Let's create some metrics. (e.g., frequency, quantity, yes/no achievements)",
    "What weekly actions will help you make progress? List 2-3 specific actions.",
    "What daily habits would support this goal? List 1-2 key habits to develop.",
    "Let's create a routine to support this goal. What steps would be involved?",
    "What resources will you need to achieve this goal?",
    "What potential obstacles might you face?",
    "Finally, how will you know you've succeeded? List 2-3 specific success criteria."
  ];

  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const previousResponses = messages
        .filter(m => m.role === 'assistant')
        .map((m, i) => ({
          question: questions[i],
          answer: m.content
        }));

      const newSuggestions = await generateSuggestion(
        currentStep,
        questions[currentStep - 1],
        previousResponses
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const transitionToNextStep = () => {
    setTransitioning(true);
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = 0;
      }
      setTransitioning(false);
    }, 500);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSuggestions([]);

    // Get AI response
    const aiResponse = await getAIResponse(
      input,
      questions[currentStep - 1],
      messages
    );

    // Process user input based on current step
    switch (currentStep) {
      case 1: // Domain selection
        const domain = input.toLowerCase();
        if (['work', 'health', 'financial', 'family', 'personal', 'community', 'home'].includes(domain)) {
          setGoalData(prev => ({ ...prev, domain: domain as Goal['domain'] }));
          transitionToNextStep();
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: aiResponse,
          }]);
          setCurrentStep(2);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Please choose one of the following domains: work, health, financial, family, personal, community, or home.",
          }]);
        }
        break;

      case 2: // Goal title
        setGoalData(prev => ({ ...prev, title: input }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(3);
        break;

      case 3: // Description
        setGoalData(prev => ({ ...prev, description: input }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(4);
        break;

      case 4: // Target date
        try {
          const targetDate = new Date();
          const input_lower = input.toLowerCase();
          if (input_lower.includes('month')) {
            const months = parseInt(input_lower.match(/\d+/)?.[0] || '3');
            targetDate.setMonth(targetDate.getMonth() + months);
          } else if (input_lower.includes('year')) {
            const years = parseInt(input_lower.match(/\d+/)?.[0] || '1');
            targetDate.setFullYear(targetDate.getFullYear() + years);
          } else {
            targetDate.setMonth(targetDate.getMonth() + 3); // Default to 3 months
          }
          setGoalData(prev => ({ ...prev, targetDate }));
          transitionToNextStep();
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: aiResponse,
          }]);
          setCurrentStep(5);
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I couldn't understand that timeframe. Please specify in months or years (e.g., '3 months' or '1 year').",
          }]);
        }
        break;

      case 5: // Milestones
        const milestones = input.split(',').map(milestone => ({
          id: crypto.randomUUID(),
          title: milestone.trim(),
          description: '',
          targetDate: new Date(goalData.targetDate!.getTime() * 0.5),
          completed: false,
          frequency: 'once' as const
        }));
        setGoalData(prev => ({ ...prev, milestones }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(6);
        break;

      case 6: // Metrics
        const metrics = input.split(',').map(metric => {
          const [name, targetStr] = metric.split(':').map(s => s.trim());
          const target = parseInt(targetStr) || 100;
          return {
            id: crypto.randomUUID(),
            name,
            type: 'number' as const,
            target,
            current: 0,
            unit: '',
            frequency: 'daily' as const,
            history: []
          };
        });
        setGoalData(prev => ({ ...prev, metrics }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(7);
        break;

      case 7: // Weekly actions
        const weeklyActions = input.split(',').map(action => action.trim());
        setGoalData(prev => ({ ...prev, weeklyActions }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(8);
        break;

      case 8: // Daily habits
        const dailyHabits = input.split(',').map(habit => habit.trim());
        setGoalData(prev => ({ ...prev, dailyHabits }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(9);
        break;

      case 9: // Routines
        const routineSteps = input.split(',').map(step => step.trim());
        const routine = {
          id: crypto.randomUUID(),
          name: `${goalData.title} Routine`,
          description: 'Daily routine to support goal progress',
          frequency: 'daily' as const,
          steps: routineSteps,
          lastCompleted: null,
          nextDue: null
        };
        setGoalData(prev => ({ ...prev, routines: [routine] }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(10);
        break;

      case 10: // Resources
        const resources = input.split(',').map(resource => resource.trim());
        setGoalData(prev => ({ ...prev, resources }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(11);
        break;

      case 11: // Obstacles
        const obstacles = input.split(',').map(obstacle => obstacle.trim());
        setGoalData(prev => ({ ...prev, obstacles }));
        transitionToNextStep();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
        }]);
        setCurrentStep(12);
        break;

      case 12: // Success criteria
        const successCriteria = input.split(',').map(criteria => criteria.trim());
        setGoalData(prev => ({ ...prev, successCriteria }));
        
        // Final step - create the goal
        const finalGoal = goalData as Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
        onCreateGoal(finalGoal);
        onClose();
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Create Your Goal</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <div 
          ref={containerRef}
          className={cn(
            "flex-1 overflow-x-hidden transition-all duration-500 ease-in-out",
            transitioning && "opacity-0 transform translate-x-full"
          )}
        >
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-8">
            <div className="text-center space-y-4 max-w-2xl">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">
                {questions[currentStep - 1]}
              </h3>
              
              {messages.slice(-2).map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "transition-all duration-500 ease-in-out",
                    message.role === 'user' ? 'text-blue-600' : 'text-gray-600',
                    "text-xl"
                  )}
                >
                  {message.content}
                </div>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div className="w-full max-w-2xl space-y-3">
                <p className="text-lg text-gray-500 text-center">Suggestions:</p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="w-full p-4 text-left bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="w-full max-w-2xl space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={handleGetSuggestions}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-lg"
                >
                  <Lightbulb className="h-5 w-5" />
                  {loading ? 'Thinking...' : 'Get Ideas'}
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your response..."
                  className="flex-1 px-6 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-lg"
                >
                  <Send className="h-5 w-5" />
                  Next
                </button>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Step {currentStep} of {questions.length}</span>
                <span>{Math.round((currentStep / questions.length) * 100)}% Complete</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${(currentStep / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};