import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { History, ChevronLeft, Settings, LogIn } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AnimatedBackground from './components/AnimatedBackground';
import TopicSelector from './components/TopicSelector';
import TopicSelectionPage from './components/TopicSelectionPage';
import AdminPage from './components/AdminPage';
import TopicFormPage from './components/TopicFormPage';
import AuthPage from './components/AuthPage';
import Timeline from './components/Timeline';
import EventCard from './components/EventCard';
import EmptyState from './components/EmptyState';
import Modal from './components/Modal';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchTopics, createTopic, updateTopic, deleteTopic } from './services/supabaseData';
import { TimelineEvent, TopicId, Topic, PageType, TimeDirection, TimelineDisplayMode } from './types';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('topicSelection');
  const [timelineTopics, setTimelineTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedTopicIdForDisplay, setSelectedTopicIdForDisplay] = useState<TopicId | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<TopicId>('seven-wonders');
  const [timelineStack, setTimelineStack] = useState<TopicId[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  const [timeDirection, setTimeDirection] = useState<TimeDirection>('none');
  const [timelineDisplayMode, setTimelineDisplayMode] = useState<TimelineDisplayMode>('years');

  const { user, userProfile } = useAuth();

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

  // Auto-redirect to admin page when user logs in and is an admin
  useEffect(() => {
    if (user && userProfile) {
      const isAdmin = userProfile.role === 'super_admin';
      
      // If user is an admin and currently on auth page or topic selection, redirect to admin
      if (isAdmin && (currentPage === 'authPage' || currentPage === 'topicSelection')) {
        setCurrentPage('adminPage');
      }
    }
  }, [user, userProfile, currentPage]);

  // Load topics from Supabase on component mount
  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      setError(null);
      
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
      }
      
      setLoading(false);
    };

    loadTopics();
  }, []);

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
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (user && userProfile?.role === 'super_admin') {
              setCurrentPage('adminPage');
            } else {
              setCurrentPage('authPage');
            }
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
          console.log('Keyboard shortcuts: Ctrl+H (Home), Ctrl+A (Admin), Esc (Back), Arrow keys (Navigate)');
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentPage, showEventModal, user, userProfile]);

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

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const refreshTopics = useCallback(async () => {
    const { data, error } = await fetchTopics();
    if (error) {
      console.error('Failed to refresh topics:', error);
      setError('Failed to refresh timeline topics.');
    } else if (data) {
      setTimelineTopics(data);
    }
  }, []);

  const handleAddTopic = useCallback(async (newTopic: Topic, returnToPage: PageType) => {
    const { data, error } = await createTopic(newTopic);
    
    if (error) {
      console.error('Failed to create topic:', error);
      setError('Failed to create timeline topic. Please try again.');
      return;
    }
    
    if (data) {
      await refreshTopics();
      setCurrentPage(returnToPage);
      setError(null);
    }
  }, [refreshTopics]);

  const handleEditTopic = useCallback((topic: Topic) => {
    setEditingTopic(topic);
    setCurrentPage('editTopic');
  }, []);

  const handleUpdateTopic = useCallback(async (updatedTopic: Topic, returnToPage: PageType) => {
    const { data, error } = await updateTopic(updatedTopic);
    
    if (error) {
      console.error('Failed to update topic:', error);
      setError('Failed to update timeline topic. Please try again.');
      return;
    }
    
    if (data) {
      await refreshTopics();
      setEditingTopic(null);
      setCurrentPage(returnToPage);
      setError(null);
    }
  }, [refreshTopics]);

  const handleDeleteTopic = useCallback(async (topicId: string) => {
    const { error } = await deleteTopic(topicId);
    
    if (error) {
      console.error('Failed to delete topic:', error);
      setError('Failed to delete timeline topic. Please try again.');
      return;
    }
    
    await refreshTopics();
    setError(null);
  }, [refreshTopics]);

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

  const handleShowAdminPage = useCallback(() => {
    if (user && userProfile?.role === 'super_admin') {
      setCurrentPage('adminPage');
    } else {
      setCurrentPage('authPage');
    }
  }, [user, userProfile]);

  const handleShowAuthPage = useCallback(() => {
    setCurrentPage('authPage');
  }, []);

  const handleBackFromAdminPage = useCallback(() => {
    setCurrentPage('topicSelection');
  }, []);

  const handleBackFromAuthPage = useCallback(() => {
    setCurrentPage('topicSelection');
  }, []);

  const handleShowAddTopic = useCallback(() => {
    setCurrentPage('addTopic');
  }, []);

  const handleBackFromForm = useCallback((returnToPage: PageType) => {
    setCurrentPage(returnToPage);
    setEditingTopic(null);
  }, []);

  const hasNext = currentEventIndex < sortedEvents.length - 1;
  const hasPrevious = currentEventIndex > 0;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Loading Timeline Explorer</h2>
          <p className="text-gray-400">Fetching historical data...</p>
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
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show auth page
  if (currentPage === 'authPage') {
    return <AuthPage onBackToTopicSelection={handleBackFromAuthPage} />;
  }

  // Show add topic page
  if (currentPage === 'addTopic') {
    return (
      <ProtectedRoute onBackToTopicSelection={handleBackFromAdminPage}>
        <TopicFormPage
          onSubmit={handleAddTopic}
          onCancel={handleBackFromForm}
          generateId={generateId}
          returnToPage="adminPage"
        />
      </ProtectedRoute>
    );
  }

  // Show edit topic page
  if (currentPage === 'editTopic') {
    return (
      <ProtectedRoute onBackToTopicSelection={handleBackFromAdminPage}>
        <TopicFormPage
          initialTopic={editingTopic}
          onSubmit={handleUpdateTopic}
          onCancel={handleBackFromForm}
          generateId={generateId}
          returnToPage="adminPage"
        />
      </ProtectedRoute>
    );
  }

  // Show admin page
  if (currentPage === 'adminPage') {
    return (
      <ProtectedRoute onBackToTopicSelection={handleBackFromAdminPage}>
        <AdminPage
          topics={timelineTopics}
          onTopicSelectForView={handleTopicSelection}
          onAddTopic={handleShowAddTopic}
          onEditTopic={handleEditTopic}
          onBackToTopicSelection={handleBackFromAdminPage}
        />
      </ProtectedRoute>
    );
  }

  // Show topic selection page
  if (currentPage === 'topicSelection') {
    return (
      <TopicSelectionPage
        topics={timelineTopics}
        onTopicSelect={handleTopicSelection}
        onShowAuthPage={handleShowAuthPage}
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
              {/* Auth/Admin button */}
              <button
                onClick={handleShowAdminPage}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-400 hover:text-purple-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={user && userProfile?.role === 'super_admin' ? 'Access admin panel' : 'Sign in to admin panel'}
              >
                {user && userProfile?.role === 'super_admin' ? (
                  <>
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-medium hidden sm:inline">Admin</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-medium hidden sm:inline">Sign In</span>
                  </>
                )}
              </button>
              
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;