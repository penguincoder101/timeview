import React, { useEffect, useRef } from 'react';
import { History, Clock, ChevronRight, Mountain, Crown } from 'lucide-react';
import { Topic, TopicId } from '../types';

interface TopicSelectionPageProps {
  topics: Topic[];
  onTopicSelect: (topicId: TopicId) => void;
}

const TopicSelectionPage: React.FC<TopicSelectionPageProps> = ({ 
  topics, 
  onTopicSelect
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for topic grid
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gridRef.current?.contains(document.activeElement)) return;

      const focusableElements = gridRef.current.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
      const gridColumns = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = Math.min(currentIndex + gridColumns, focusableElements.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = Math.max(currentIndex - gridColumns, 0);
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
      }

      if (nextIndex !== currentIndex) {
        focusableElements[nextIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getTopicImage = (topicId: string) => {
    switch (topicId) {
      case 'seven-wonders':
        return 'https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800';
      case 'wwii':
        return 'https://images.pexels.com/photos/63324/pexels-photo-63324.jpeg?auto=compress&cs=tinysrgb&w=800';
      case 'ancient-civilizations':
        return 'https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=800';
      case 'ancient-rwanda':
        return 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800';
      case 'rwandan-kingdoms':
        return 'https://images.pexels.com/photos/1840624/pexels-photo-1840624.jpeg?auto=compress&cs=tinysrgb&w=800';
      default:
        return 'https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800';
    }
  };

  const getTopicDescription = (topicId: string) => {
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

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/30" />
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
              aria-hidden="true"
            />
          ))}
        </div>
        
        {/* Floating glowing orbs */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-cyan-400/5 to-blue-500/5 blur-xl animate-float"
              style={{
                width: `${100 + Math.random() * 200}px`,
                height: `${100 + Math.random() * 200}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 20}s`
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl" aria-hidden="true">
                  <History className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Timeline Explorer
                  </h1>
                  <p className="text-gray-400">Journey through history's most fascinating moments</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Choose a timeline below to explore pivotal events, discover hidden stories, and witness the moments that shaped our world.
            </p>
          </div>
        </section>

        {/* Topic Selection */}
        <main className="flex-1 px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div 
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="grid"
              aria-label="Historical timeline topics"
            >
              {topics.map((topic, index) => {
                const imageUrl = getTopicImage(topic.id);
                const description = getTopicDescription(topic.id);
                
                return (
                  <button
                    key={topic.id}
                    onClick={() => onTopicSelect(topic.id as TopicId)}
                    className="group relative bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    role="gridcell"
                    aria-label={`Explore ${topic.name} timeline with ${topic.events.length} events`}
                    tabIndex={index === 0 ? 0 : -1}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                    
                    {/* Card Content */}
                    <div className="relative z-10 p-6">
                      {/* Title */}
                      <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-100 transition-colors duration-300">
                        {topic.name}
                      </h2>
                      
                      {/* Image - NOW WITH LAZY LOADING */}
                      <div className="mb-4">
                        <img
                          src={imageUrl}
                          alt={`Representative image for ${topic.name}`}
                          loading="lazy"
                          className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800';
                          }}
                        />
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors duration-300">
                        {description}
                      </p>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>{topic.events.length} events</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                          <span className="text-sm font-medium">Explore</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Footer text */}
            <div className="text-center mt-16">
              <p className="text-gray-500 text-sm">
                Select a timeline to begin your historical journey
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TopicSelectionPage;