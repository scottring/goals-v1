import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Save, AlertCircle, Upload } from 'lucide-react';
import { processConversation } from '../../lib/openai';
import { cn } from '../../lib/utils';
import type { Goal, Routine } from '../../types';

interface FreeformAIChatProps {
  onClose: () => void;
  onCreateGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const FreeformAIChat: React.FC<FreeformAIChatProps> = ({ onClose, onCreateGoal }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you create a meaningful goal. What's on your mind? What would you like to achieve?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
    reflections: []
  });
  const [showSummary, setShowSummary] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  const [transcript, setTranscript] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const result = await processConversation([...messages, userMessage]);
      
      if (result.extractedData) {
        setGoalData(prev => ({
          ...prev,
          ...result.extractedData,
          // Ensure all arrays exist
          milestones: result.extractedData.milestones || prev.milestones,
          metrics: result.extractedData.metrics || prev.metrics,
          weeklyActions: result.extractedData.weeklyActions || prev.weeklyActions,
          dailyHabits: result.extractedData.dailyHabits || prev.dailyHabits,
          routines: result.extractedData.routines || prev.routines,
          resources: result.extractedData.resources || prev.resources,
          obstacles: result.extractedData.obstacles || prev.obstacles,
          successCriteria: result.extractedData.successCriteria || prev.successCriteria
        }));
      }

      if (result.nextPrompt) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.nextPrompt
        }]);
      }

      if (result.conversationComplete) {
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble processing that. Could you try rephrasing?"
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportTranscript = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    const lines = transcript.split('\n').map(line => line.trim()).filter(line => line);
    const newMessages: Message[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line) {
        newMessages.push({
          role: i % 2 === 0 ? 'assistant' : 'user',
          content: line
        });
      }
    }

    setMessages(newMessages);
    setShowTranscriptInput(false);
    
    try {
      const result = await processConversation(newMessages);
      if (result.extractedData) {
        setGoalData(prev => ({
          ...prev,
          ...result.extractedData
        }));
      }
      setShowSummary(true);
    } catch (error) {
      console.error('Error processing transcript:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveGoal = () => {
    const goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      title: goalData.title || '',
      description: goalData.description || '',
      domain: goalData.domain || 'personal',
      status: 'active',
      targetDate: goalData.targetDate ? new Date(goalData.targetDate) : undefined,
      milestones: (goalData.milestones || []).map(m => ({
        id: crypto.randomUUID(),
        title: m.title,
        description: m.description || '',
        targetDate: new Date(m.targetDate),
        completed: false,
        frequency: m.frequency || 'once'
      })),
      metrics: (goalData.metrics || []).map(m => ({
        id: crypto.randomUUID(),
        name: m.name,
        type: m.type,
        target: m.target,
        current: m.type === 'boolean' ? false : 0,
        unit: m.unit || '',
        frequency: m.frequency || 'daily',
        history: []
      })),
      weeklyActions: goalData.weeklyActions || [],
      dailyHabits: goalData.dailyHabits || [],
      routines: (goalData.routines || []).map(r => ({
        id: crypto.randomUUID(),
        name: r.name,
        description: r.description || '',
        frequency: r.frequency || 'daily',
        steps: r.steps,
        lastCompleted: null,
        nextDue: null
      })),
      resources: goalData.resources || [],
      obstacles: goalData.obstacles || [],
      successCriteria: goalData.successCriteria || [],
      reflections: []
    };

    onCreateGoal(goal);
    onClose();
  };

  const handleClose = () => {
    if (messages.length > 1 && !showSummary) {
      setShowSummary(true);
    } else {
      onClose();
    }
  };

  const isGoalComplete = () => {
    return goalData.title && goalData.description && goalData.domain;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare size={24} />
            <h2 className="text-xl font-semibold">Chat About Your Goals</h2>
          </div>
          <div className="flex items-center gap-2">
            {!showTranscriptInput && !showSummary && (
              <button
                onClick={() => setShowTranscriptInput(true)}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-md hover:bg-white/20"
              >
                <Upload size={16} />
                Import Transcript
              </button>
            )}
            <button onClick={handleClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>

        {showTranscriptInput ? (
          <div className="flex-1 p-6 space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                Paste your conversation transcript below. Each line should alternate between AI and user messages, starting with the AI message.
              </p>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-[calc(100%-160px)] px-4 py-3 border border-gray-300 rounded-lg resize-none"
              placeholder="Paste your conversation transcript here..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleImportTranscript}
                disabled={!transcript.trim() || isProcessing}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Import Transcript'}
              </button>
              <button
                onClick={() => setShowTranscriptInput(false)}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : showSummary ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Goal Summary</h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {editMode ? 'Preview' : 'Edit'}
                </button>
              </div>

              {!isGoalComplete() && !editMode && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-yellow-700">Some required information is missing. Switch to edit mode to complete your goal details.</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={goalData.title || ''}
                        onChange={(e) => setGoalData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={goalData.description || ''}
                        onChange={(e) => setGoalData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                      <select
                        value={goalData.domain || 'personal'}
                        onChange={(e) => setGoalData(prev => ({ ...prev, domain: e.target.value as Goal['domain'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="financial">Financial</option>
                        <option value="health">Health</option>
                        <option value="family">Family</option>
                        <option value="personal">Personal</option>
                        <option value="community">Community</option>
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={goalData.targetDate ? new Date(goalData.targetDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setGoalData(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-700">Title</h4>
                      <p className="text-gray-900">{goalData.title || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Description</h4>
                      <p className="text-gray-900">{goalData.description || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Domain</h4>
                      <p className="text-gray-900 capitalize">{goalData.domain || 'Not set'}</p>
                    </div>
                    {goalData.targetDate && (
                      <div>
                        <h4 className="font-medium text-gray-700">Target Date</h4>
                        <p className="text-gray-900">{new Date(goalData.targetDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {goalData.milestones && goalData.milestones.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Milestones</h4>
                        <ul className="mt-2 space-y-2">
                          {goalData.milestones.map((milestone, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                              <span>{milestone.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goalData.metrics && goalData.metrics.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Metrics</h4>
                        <ul className="mt-2 space-y-2">
                          {goalData.metrics.map((metric, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-600 rounded-full" />
                              <span>{metric.name}: {metric.target} {metric.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goalData.dailyHabits && goalData.dailyHabits.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Daily Habits</h4>
                        <ul className="mt-2 space-y-2">
                          {goalData.dailyHabits.map((habit, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-600 rounded-full" />
                              <span>{habit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goalData.routines && goalData.routines.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Routines</h4>
                        {goalData.routines.map((routine, index) => (
                          <div key={index} className="mt-2">
                            <h5 className="text-sm font-medium">{routine.name}</h5>
                            <ul className="mt-1 space-y-1">
                              {routine.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-center gap-2 text-sm">
                                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                    {goalData.resources && goalData.resources.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Resources Needed</h4>
                        <ul className="mt-2 space-y-2">
                          {goalData.resources.map((resource, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-600 rounded-full" />
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goalData.obstacles && goalData.obstacles.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Potential Obstacles</h4>
                        <ul className="mt-2 space-y-2">
                          {goalData.obstacles.map((obstacle, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-600 rounded-full" />
                              <span>{obstacle}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goalData.successCriteria && goalData.successCriteria.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Success Criteria</h4>
                        <ul className="mt-2 space-y-2">
                          {goalData.successCriteria.map((criteria, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                              <span>{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleSaveGoal}
                  disabled={!isGoalComplete()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Save Goal
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-4 rounded-lg shadow-sm",
                      message.role === 'user' ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t space-y-4 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={16} />
                  {isProcessing ? 'Thinking...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};