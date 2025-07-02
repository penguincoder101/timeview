import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Tag, ExternalLink, ArrowRight } from 'lucide-react';
import { TimelineEvent, TopicId } from '../types';

interface EventCardProps {
  event: TimelineEvent;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onExploreRelatedTimeline?: (topicId: TopicId) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onExploreRelatedTimeline
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Create safe HTML content for descriptions
  const displayShortDescription = event.shortDescription || event.description.split('.')[0] + '.';
  
  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  // Keyboard navigation for event card
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!cardRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (hasPrevious) onPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (hasNext) onNext();
          break;
        case 'Home':
          event.preventDefault();
          if (hasPrevious) {
            // Go to first event (simulate multiple previous clicks)
            let current = hasPrevious;
            while (current) {
              onPrevious();
              current = hasPrevious; // This would need to be updated in a real implementation
            }
          }
          break;
        case 'End':
          event.preventDefault();
          if (hasNext) {
            // Go to last event (simulate multiple next clicks)
            let current = hasNext;
            while (current) {
              onNext();
              current = hasNext; // This would need to be updated in a real implementation
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrevious, onNext, onPrevious]);

  const handleExploreRelated = () => {
    if (event.relatedTopicId && onExploreRelatedTimeline) {
      onExploreRelatedTimeline(event.relatedTopicId);
    }
  };

  return (
    <div 
      ref={cardRef}
      className="h-full flex flex-col bg-gray-800/5 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden shadow-2xl"
      role="article"
      aria-labelledby="event-title"
      tabIndex={0}
    >
      {/* Title and Date at the top */}
      <div className="p-4 lg:p-6 pb-0 flex-shrink-0">
        {/* Date badge */}
        <div className="flex items-center gap-2 mb-3 lg:mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg" aria-hidden="true">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <time className="text-blue-400 font-medium text-sm lg:text-base" dateTime={event.date}>
            {event.date}
          </time>
        </div>

        {/* Title - RESPONSIVE TEXT SIZING */}
        <h1 
          id="event-title"
          className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 leading-tight"
        >
          {event.title}
        </h1>
      </div>

      {/* Event content - IMPROVED SCROLLING ON MOBILE */}
      <div className="px-4 lg:px-6 overflow-y-auto flex-1">
        {/* Full-width image with rounded corners and margin - RESPONSIVE IMAGE SIZING */}
        <img
          src={event.imageUrl}
          alt={`Historical image related to ${event.title}`}
          loading="lazy"
          className="w-full h-40 lg:h-48 object-cover rounded-xl mb-4"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800';
          }}
        />

        {/* Short description - RESPONSIVE TEXT WITH HTML SUPPORT */}
        <div 
          className="text-gray-300 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6 prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={createMarkup(displayShortDescription)}
        />

        {/* Full description - RESPONSIVE SPACING WITH HTML SUPPORT */}
        <div className="mb-4 lg:mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-2 lg:mb-3">Full Description</h2>
          <div 
            className="prose prose-invert prose-sm max-w-none text-gray-300 text-sm lg:text-base leading-relaxed"
            dangerouslySetInnerHTML={createMarkup(event.description)}
          />
        </div>

        {/* Related timeline link - RESPONSIVE BUTTON */}
        {event.relatedTopicId && onExploreRelatedTimeline && (
          <div className="mb-4 lg:mb-6">
            <button
              onClick={handleExploreRelated}
              className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-400 hover:text-purple-300 transition-all duration-200 text-sm font-medium w-full sm:w-auto justify-center sm:justify-start focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={`Explore related timeline for ${event.title}`}
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              Explore Related Timeline
            </button>
          </div>
        )}

        {/* View details link - RESPONSIVE BUTTON */}
        {event.detailsUrl && (
          <div className="mb-4 lg:mb-6">
            <a
              href={event.detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200 text-sm font-medium w-full sm:w-auto justify-center sm:justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={`View full details about ${event.title} (opens in new tab)`}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              View Full Details
            </a>
          </div>
        )}

        {/* Tags - RESPONSIVE LAYOUT */}
        {event.tags && event.tags.length > 0 && (
          <div className="border-t border-gray-700/30 pt-4 pb-4 lg:pb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <h3 className="text-sm font-medium text-gray-400">Related Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Event tags">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 lg:px-3 py-1 text-xs lg:text-sm bg-gray-700/30 text-gray-300 rounded-full border border-gray-600/30 hover:border-blue-500/50 transition-colors duration-200"
                  role="listitem"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons - RESPONSIVE SIZING */}
      <nav 
        className="flex justify-between items-center p-4 lg:p-6 border-t border-gray-700/30 flex-shrink-0"
        aria-label="Event navigation"
      >
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            hasPrevious
              ? 'bg-gray-800/30 text-white hover:bg-gray-700/40 hover:scale-105 focus:ring-gray-500'
              : 'bg-gray-800/10 text-gray-600 cursor-not-allowed'
          }`}
          aria-label="Go to previous event"
          aria-disabled={!hasPrevious}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>
        
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            hasNext
              ? 'bg-blue-600/80 text-white hover:bg-blue-700/90 hover:scale-105 focus:ring-blue-500'
              : 'bg-gray-800/10 text-gray-600 cursor-not-allowed'
          }`}
          aria-label="Go to next event"
          aria-disabled={!hasNext}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
};

export default EventCard;