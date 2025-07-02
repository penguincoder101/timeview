import React from 'react';
import { History, ChevronLeft, Clock, Globe, Sword, Building, Edit, Plus, Settings, Mountain, Crown } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import { Topic, TopicId } from '../types';

interface AdminPageProps {
  topics: Topic[];
  onTopicSelectForView: (topicId: TopicId) => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onBackToTopicSelection: () => void;
}

// Helper functions for consistent styling
export const getTopicIcon = (topicId: string) => {
  switch (topicId) {
    case 'seven-wonders':
      return Building;
    case 'wwii':
      return Sword;
    case 'ancient-civilizations':
      return Globe;
    case 'ancient-rwanda':
      return Mountain;
    case 'rwandan-kingdoms':
      return Crown;
    default:
      return Clock;
  }
};

export const getTopicGradient = (topicId: string) => {
  switch (topicId) {
    case 'seven-wonders':
      return 'from-amber-500 to-orange-600';
    case 'wwii':
      return 'from-red-500 to-red-700';
    case 'ancient-civilizations':
      return 'from-emerald-500 to-teal-600';
    case 'ancient-rwanda':
      return 'from-green-500 to-emerald-600';
    case 'rwandan-kingdoms':
      return 'from-yellow-500 to-amber-600';
    default:
      return 'from-blue-500 to-purple-600';
  }
};

export const getTopicDescription = (topicId: string) => {
  switch (topicId) {
    case 'seven-wonders':
      return 'Explore the magnificent architectural marvels of the ancient world, from the Great Pyramid of Giza to the Lighthouse of Alexandria.';
    case 'wwii':
      return 'Journey through the pivotal moments of World War II, from the invasion of Poland to Victory in Europe Day.';
    case 'ancient-civilizations':
      return 'Discover the rise of humanity\'s greatest civilizations, from Mesopotamia to the Roman Empire.';
    case 'ancient-rwanda':
      return 'Explore the rich ancient history of Rwanda, from early settlements to the rise of the Kingdom of Rwanda.';
    case 'rwandan-kingdoms':
      return 'Discover the detailed history of Rwandan kingdoms, from legendary origins through colonial encounters to the monarchy\'s end.';
    default:
      return 'Explore historical events and their significance.';
  }
};

const AdminPage: React.FC<AdminPageProps> = ({
  topics,
  onTopicSelectForView,
  onAddTopic,
  onEditTopic,
  onBackToTopicSelection
}) => {
  const handleEditClick = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    onEditTopic(topic);
  };

  const handleViewClick = (topicId: TopicId) => {
    onTopicSelectForView(topicId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-30 border-b border-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToTopicSelection}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-blue-400" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Manage your timeline topics
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Page title and description */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                Timeline Management
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Create, edit, and manage your historical timeline topics. Add new events, modify existing content, or create entirely new timelines.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center mb-12">
              <button
                onClick={onAddTopic}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create New Timeline
              </button>
            </div>

            {/* Topics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-8">
              {topics.map((topic) => {
                const IconComponent = getTopicIcon(topic.id);
                const gradient = getTopicGradient(topic.id);
                const description = getTopicDescription(topic.id);
                
                return (
                  <div
                    key={topic.id}
                    className="group relative bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
                  >
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />
                    
                    {/* Action buttons */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleViewClick(topic.id as TopicId)}
                        className="p-2 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg text-white transition-all duration-200"
                        title="View Timeline"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleEditClick(e, topic)}
                        className="p-2 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white transition-all duration-200"
                        title="Edit Timeline"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="text-left relative z-10">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors duration-300">
                        {topic.name}
                      </h3>
                      
                      <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors duration-300">
                        {description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{topic.events.length} events</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewClick(topic.id as TopicId)}
                            className="px-3 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => handleEditClick(e, topic)}
                            className="px-3 py-1 text-xs bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 hover:border-gray-500/50 rounded-lg text-gray-400 hover:text-gray-300 transition-all duration-200"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover effect border */}
                    <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-br group-hover:${gradient.replace('from-', 'border-').replace('to-', 'border-')} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                  </div>
                );
              })}
            </div>
            
            {/* Footer text */}
            <div className="text-center mt-16">
              <p className="text-gray-500 text-sm">
                Manage your timeline topics - create new ones, edit existing content, or view them in action
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;