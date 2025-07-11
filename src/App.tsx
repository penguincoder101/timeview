import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { History, ChevronLeft } from 'lucide-react';
import AnimatedBackground from './components/AnimatedBackground';
import TopicSelector from './components/TopicSelector';
import TopicSelectionPage from './components/TopicSelectionPage';
import Timeline from './components/Timeline';
import EventCard from './components/EventCard';
import EmptyState from './components/EmptyState';
import Modal from './components/Modal';
import { fetchTopics } from './services/supabaseData';
import { TimelineEvent, TopicId, Topic, PageType, TimeDirection, TimelineDisplayMode } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('topicSelection');
  const [timelineTopics, setTimelineTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicIdForDisplay, setSelectedTopicIdForDisplay] = useState<TopicId | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<TopicId>('seven-wonders');
  const [timelineStack, setTimelineStack] = useState<TopicId[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  const [timeDirection, setTimeDirection] = useState<TimeDirection>('none');
  const [timelineDisplayMode, setTimelineDisplayMode] = useState<TimelineDisplayMode>('years');

  const currentTopic = useMemo(() => 
    timelineTopics.find(topic => topic.id === currentTopicId),
    [currentTopicId, timelineTopics]
  );

  const sortedEvents = useMemo(() => 
    currentTopic ? [...currentTopic.events].sort((a, b) => a.year - b.year) : [],
    [currentTopic]
  );

  const currentEventIndex = useMemo(() => 
    selectedEvent ? sortedEvents.findIndex(event => event.id === selectedEvent.id) : -1,
    [selectedEvent, sortedEvents]
  );

  // Load topics from Supabase
  useEffect(() => {
    const loadTopics = async () => {
      if (topicsLoaded) return;
      
      setTopicsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await fetchTopics();
        
        if (error) {
          console.error('Failed to load topics:', error);
          setError('Failed to load timeline topics. Please try again.');
        } else if (data) {
          setTimelineTopics(data);
          // Set default topic if available
          if (data.length > 0) {
            const defaultTopic = data.find(t => t.id === 'seven-wonders') || data[0];
            setCurrentTopicId(defaultTopic.id as TopicId);
          }
          setTopicsLoaded(true);
        }
      } catch (err) {
        console.error('Unexpected error loading topics:', err);
        setError('An unexpected error occurred while loading topics.');
      } finally {
        setTopicsLoading(false);
      }
    };

    loadTopics();
  }, [topicsLoaded]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Only handle global shortcuts when not in form inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'h':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setCurrentPage('topicSelection');
          }
          break;
        case 'Escape':
          if (currentPage === 'timelineView') {
            handleBackToTopics();
          } else if (showEventModal) {
            setShowEventModal(false);
          }
          break;
        case '?':
          // Show keyboard shortcuts help (could be implemented later)
          event.preventDefault();
          console.log('Keyboard shortcuts: Ctrl+H (Home), Esc (Back), Arrow keys (Navigate)');
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentPage, showEventModal]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newIsLargeScreen = window.innerWidth >= 768;
      setIsLargeScreen(newIsLargeScreen);
      
      // If switching to large screen and modal is open, close it
      if (newIsLargeScreen && showEventModal) {
        setShowEventModal(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showEventModal]);

  // Auto-select first event when topic changes or loads
  useEffect(() => {
    if (currentTopic && currentTopic.events.length > 0) {
      // Check if selectedEvent is null or doesn't belong to current topic
      const eventBelongsToCurrentTopic = selectedEvent && 
        currentTopic.events.some(event => event.id === selectedEvent.id);
      
      if (!selectedEvent || !eventBelongsToCurrentTopic) {
        // Select the first event chronologically
        const firstEvent = sortedEvents[0];
        setSelectedEvent(firstEvent);
      }
    } else {
      // No events in current topic, clear selection
      setSelectedEvent(null);
    }
  }, [currentTopic, selectedEvent, sortedEvents]);

  // Reset time direction after animation completes
  useEffect(() => {
    if (timeDirection !== 'none') {
      const timer = setTimeout(() => {
        setTimeDirection('none');
      }, 800); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [timeDirection]);

  const handleTopicSelection = useCallback((topicId: TopicId) => {
    setSelectedTopicIdForDisplay(topicId);
    setCurrentTopicId(topicId);
    setTimelineStack([topicId]);
    
    // Set display mode based on topic's default setting
    const selectedTopic = timelineTopics.find(topic => topic.id === topicId);
    if (selectedTopic) {
      setTimelineDisplayMode(selectedTopic.defaultDisplayMode || 'years');
    }
    
    setCurrentPage('timelineView');
    setShowEventModal(false);
    // Don't set selectedEvent to null - let useEffect handle it
  }, [timelineTopics]);

  const handleTopicChange = useCallback((topicId: TopicId) => {
    setCurrentTopicId(topicId);
    setTimelineStack([topicId]);
    
    // Set display mode based on topic's default setting
    const selectedTopic = timelineTopics.find(topic => topic.id === topicId);
    if (selectedTopic) {
      setTimelineDisplayMode(selectedTopic.defaultDisplayMode || 'years');
    }
    
    setShowEventModal(false);
    // Don't set selectedEvent to null - let useEffect handle it
  }, [timelineTopics]);

  const handleExploreRelatedTimeline = useCallback((topicId: TopicId) => {
    setTimelineStack(prev => [...prev, topicId]);
    setCurrentTopicId(topicId);
    
    // Set display mode based on topic's default setting
    const selectedTopic = timelineTopics.find(topic => topic.id === topicId);
    if (selectedTopic) {
      setTimelineDisplayMode(selectedTopic.defaultDisplayMode || 'years');
    }
    
    setCurrentPage('timelineView');
    setShowEventModal(false);
    // Don't set selectedEvent to null - let useEffect handle it
  }, [timelineTopics]);

  const handleEventSelect = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
    // Show modal on small screens
    if (!isLargeScreen) {
      setShowEventModal(true);
    }
  }, [isLargeScreen]);

  const handleCloseEventModal = useCallback(() => {
    setShowEventModal(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentEventIndex < sortedEvents.length - 1) {
      const nextEvent = sortedEvents[currentEventIndex + 1];
      const currentYear = selectedEvent?.year || 0;
      const nextYear = nextEvent.year;
      
      // Determine time direction based on year comparison
      if (nextYear > currentYear) {
        setTimeDirection('forward');
      } else {
        setTimeDirection('backward');
      }
      
      setSelectedEvent(nextEvent);
    }
  }, [currentEventIndex, sortedEvents, selectedEvent]);

  const handlePrevious = useCallback(() => {
    if (currentEventIndex > 0) {
      const previousEvent = sortedEvents[currentEventIndex - 1];
      const currentYear = selectedEvent?.year || 0;
      const previousYear = previousEvent.year;
      
      // Determine time direction based on year comparison
      if (previousYear < currentYear) {
        setTimeDirection('backward');
      } else {
        setTimeDirection('forward');
      }
      
      setSelectedEvent(previousEvent);
    }
  }, [currentEventIndex, sortedEvents, selectedEvent]);

  const handleBackToTopics = useCallback(() => {
    if (timelineStack.length > 1) {
      // Pop the current timeline and go back to the previous one
      const newStack = timelineStack.slice(0, -1);
      setTimelineStack(newStack);
      setCurrentTopicId(newStack[newStack.length - 1]);
      
      // Set display mode based on topic's default setting
      const selectedTopic = timelineTopics.find(topic => topic.id === newStack[newStack.length - 1]);
      if (selectedTopic) {
        setTimelineDisplayMode(selectedTopic.defaultDisplayMode || 'years');
      }
    } else {
      // Go back to topic selection
      setCurrentPage('topicSelection');
      setSelectedTopicIdForDisplay(null);
      setTimelineStack([]);
      setSelectedEvent(null);
      setShowEventModal(false);
    }
  }, [timelineStack, timelineTopics]);

  const hasNext = currentEventIndex < sortedEvents.length - 1;
  const hasPrevious = currentEventIndex > 0;

  // Show loading state
  if (topicsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Loading Timeline Explorer</h2>
          <p className="text-gray-400">Loading historical data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Error Loading Data</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setTopicsLoaded(false);
              // This will trigger the useEffect to reload topics
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show topic selection page
  if (currentPage === 'topicSelection') {
    return (
      <TopicSelectionPage
        topics={timelineTopics}
        onTopicSelect={handleTopicSelection}
      />
    );
  }

  // Show timeline view
  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground timeDirection={timeDirection} />
      
      {/* Header */}
      <header className="relative z-30 border-b border-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={handleBackToTopics}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
              aria-label={timelineStack.length > 1 ? 'Go back to previous timeline' : 'Go back to topic selection'}
            >
              {/* Large screen: Full branding */}
              <div className="hidden md:flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl" aria-hidden="true">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Timeline Explorer
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {timelineStack.length > 1 ? 'Back to previous timeline' : 'Journey through history'}
                  </p>
                </div>
              </div>
              
              {/* Small screen: Simple back button */}
              <div className="flex md:hidden items-center gap-2">
                <ChevronLeft className="w-5 h-5 text-blue-400" aria-hidden="true" />
                <span className="text-white font-medium">Back</span>
              </div>
            </button>
            
            <div className="flex items-center gap-4">
              {/* Topic Selector - Hidden on small screens */}
              <div className="hidden md:block w-full sm:w-auto mt-2 sm:mt-0">
                <TopicSelector
                  topics={timelineTopics}
                  selectedTopicId={currentTopicId}
                  onTopicChange={handleTopicChange}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - RESPONSIVE LAYOUT IMPROVEMENTS */}
      <main 
        className="relative z-10 h-[calc(100vh-80px)] max-w-7xl mx-auto px-4 sm:px-6"
        role="main"
        aria-label="Timeline content"
      >
        <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 py-4 lg:py-6">
          {/* Timeline - RESPONSIVE WIDTH ADJUSTMENTS */}
          {currentTopic && (
            <Timeline
              events={currentTopic.events}
              selectedEventId={selectedEvent?.id || null}
              selectedEvent={selectedEvent}
              onEventSelect={handleEventSelect}
              displayMode={timelineDisplayMode}
              onExploreRelatedTimeline={handleExploreRelatedTimeline}
            />
          )}

          {/* Event Card - IMPROVED RESPONSIVE BEHAVIOR */}
          <div className="w-full lg:w-96 lg:flex-shrink-0 h-1/2 lg:h-full">
            {isLargeScreen ? (
              selectedEvent ? (
                <EventCard
                  event={selectedEvent}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  onExploreRelatedTimeline={handleExploreRelatedTimeline}
                />
              ) : (
                <EmptyState />
              )
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>

      {/* Modal for small screens - IMPROVED MODAL BEHAVIOR */}
      {selectedEvent && !isLargeScreen && (
        <Modal isOpen={showEventModal} onClose={handleCloseEventModal}>
          <EventCard
            event={selectedEvent}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onExploreRelatedTimeline={handleExploreRelatedTimeline}
          />
        </Modal>
      )}
    </div>
  );
}

export default App;