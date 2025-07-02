import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { TimelineEvent, TimelineDisplayMode, TopicId } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
  selectedEventId: string | null;
  selectedEvent: TimelineEvent | null;
  onEventSelect: (event: TimelineEvent) => void;
  displayMode: TimelineDisplayMode;
  onExploreRelatedTimeline?: (topicId: TopicId) => void;
}

interface TimelineEntry {
  label: string;
  sortKey: number;
  events: TimelineEvent[];
}

// Parse date string into Date object
function parseEventDate(dateString: string): Date {
  // Handle BCE dates and various formats
  if (dateString.includes('BCE')) {
    const yearMatch = dateString.match(/(\d+)\s*BCE/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return new Date(-year + 1, 0, 1); // BCE years are negative
    }
  }
  
  // Handle CE dates and modern formats
  if (dateString.includes('CE')) {
    const yearMatch = dateString.match(/(\d+)\s*CE/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return new Date(year, 0, 1);
    }
  }
  
  // Try to parse as regular date
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Fallback: extract year and create basic date
  const yearMatch = dateString.match(/(\d{1,4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    return new Date(year, 0, 1);
  }
  
  // Ultimate fallback
  return new Date(0);
}

const formatYear = (year: number): string => {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date: Date): string => {
  const year = date.getFullYear();
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  if (year < 0) {
    // Handle BCE dates
    const bceYear = Math.abs(year);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${bceYear} BCE`;
  }
  
  return date.toLocaleDateString('en-US', options);
};

const Timeline: React.FC<TimelineProps> = ({ 
  events, 
  selectedEventId, 
  selectedEvent, 
  onEventSelect,
  displayMode,
  onExploreRelatedTimeline
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousSelectedEventRef = useRef<TimelineEvent | null>(null);
  
  // Process events to add dateObject for accurate parsing
  const processedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      dateObject: parseEventDate(event.date)
    }));
  }, [events]);

  // Group events based on display mode
  const groupedTimelineItems = useMemo(() => {
    const sortedEvents = [...processedEvents].sort((a, b) => a.year - b.year);
    
    if (displayMode === 'years') {
      // Group by year
      const yearGroups = new Map<number, TimelineEvent[]>();
      
      sortedEvents.forEach(event => {
        const year = event.year;
        if (!yearGroups.has(year)) {
          yearGroups.set(year, []);
        }
        yearGroups.get(year)!.push(event);
      });
      
      // Create timeline entries for years
      const entries: TimelineEntry[] = [];
      const years = Array.from(yearGroups.keys()).sort((a, b) => a - b);
      
      // Fill in missing years between events
      if (years.length > 0) {
        const minYear = years[0];
        const maxYear = years[years.length - 1];
        
        for (let year = minYear; year <= maxYear; year++) {
          entries.push({
            label: formatYear(year),
            sortKey: year,
            events: yearGroups.get(year) || []
          });
        }
      }
      
      return entries;
    } else {
      // Group by day - show all days between earliest and latest events
      if (sortedEvents.length === 0) {
        return [];
      }

      // Create a map to store events by date key
      const dayGroups = new Map<string, TimelineEvent[]>();
      
      sortedEvents.forEach(event => {
        const dayKey = formatDateKey(event.dateObject!);
        if (!dayGroups.has(dayKey)) {
          dayGroups.set(dayKey, []);
        }
        dayGroups.get(dayKey)!.push(event);
      });

      // Find min and max dates
      const minDate = new Date(Math.min(...sortedEvents.map(e => e.dateObject!.getTime())));
      const maxDate = new Date(Math.max(...sortedEvents.map(e => e.dateObject!.getTime())));

      // Create entries for all days between min and max
      const allDayEntries: TimelineEntry[] = [];
      const currentDate = new Date(minDate);

      while (currentDate <= maxDate) {
        const dayKey = formatDateKey(currentDate);
        const eventsForDay = dayGroups.get(dayKey) || [];
        
        allDayEntries.push({
          label: formatDateLabel(currentDate),
          sortKey: currentDate.getTime(),
          events: eventsForDay
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return allDayEntries;
    }
  }, [processedEvents, displayMode]);

  // Enhanced easing function for very smooth animation
  const easeInOutCubic = useCallback((t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }, []);

  // Custom scroll animation function with enhanced smoothness
  const scrollToElement = useCallback((element: HTMLElement, duration: number) => {
    const container = timelineRef.current;
    if (!container) return;

    const startScrollTop = container.scrollTop;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate target scroll position to center the element
    const targetScrollTop = startScrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
    const scrollDistance = targetScrollTop - startScrollTop;
    
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      const currentScrollTop = startScrollTop + (scrollDistance * easedProgress);
      container.scrollTop = currentScrollTop;
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }, [easeInOutCubic]);

  // Auto-scroll to selected event with increased duration
  useEffect(() => {
    if (selectedEvent && timelineRef.current) {
      const eventElement = eventRefs.current.get(selectedEvent.id);
      if (eventElement) {
        // Calculate time difference for scroll duration
        let timeDifference = 0;
        if (previousSelectedEventRef.current) {
          if (displayMode === 'years') {
            timeDifference = Math.abs(selectedEvent.year - previousSelectedEventRef.current.year);
          } else {
            const currentTime = selectedEvent.dateObject?.getTime() || 0;
            const previousTime = previousSelectedEventRef.current.dateObject?.getTime() || 0;
            timeDifference = Math.abs(currentTime - previousTime) / (1000 * 60 * 60 * 24); // Convert to days
          }
        }
        
        // Increased base duration to 2000ms for smoother animation
        const baseDuration = 2000;
        // Increased factor for time difference
        const timeDifferenceFactor = displayMode === 'years' ? 25 : 5;
        // Increased max additional duration to 3500ms
        const maxAdditionalDuration = 3500;
        
        const additionalDuration = Math.min(timeDifference * timeDifferenceFactor, maxAdditionalDuration);
        const scrollDuration = baseDuration + additionalDuration;
        
        // Use custom scroll animation
        scrollToElement(eventElement, scrollDuration);
        
        // Update previous selected event reference
        previousSelectedEventRef.current = selectedEvent;
      }
    }
  }, [selectedEvent, scrollToElement, displayMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!timelineRef.current?.contains(document.activeElement)) return;

      const allEvents = processedEvents.sort((a, b) => a.year - b.year);
      const currentIndex = selectedEvent ? allEvents.findIndex(e => e.id === selectedEvent.id) : -1;

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          if (currentIndex > 0) {
            const prevEvent = allEvents[currentIndex - 1];
            onEventSelect(prevEvent);
          }
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          if (currentIndex < allEvents.length - 1) {
            const nextEvent = allEvents[currentIndex + 1];
            onEventSelect(nextEvent);
          }
          break;
        case 'Home':
          event.preventDefault();
          if (allEvents.length > 0) {
            onEventSelect(allEvents[0]);
          }
          break;
        case 'End':
          event.preventDefault();
          if (allEvents.length > 0) {
            onEventSelect(allEvents[allEvents.length - 1]);
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (selectedEvent?.relatedTopicId && onExploreRelatedTimeline) {
            onExploreRelatedTimeline(selectedEvent.relatedTopicId);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedEvent, processedEvents, onEventSelect, onExploreRelatedTimeline]);

  const setEventRef = (eventId: string, element: HTMLButtonElement | null) => {
    if (element) {
      eventRefs.current.set(eventId, element);
    } else {
      eventRefs.current.delete(eventId);
    }
  };

  const handleEventClick = useCallback((event: TimelineEvent) => {
    if (event.relatedTopicId && onExploreRelatedTimeline) {
      onExploreRelatedTimeline(event.relatedTopicId);
    } else {
      onEventSelect(event);
    }
  }, [onEventSelect, onExploreRelatedTimeline]);

  return (
    <div 
      ref={timelineRef} 
      className="w-full lg:flex-1 h-1/2 lg:h-full overflow-y-auto no-scrollbar py-8"
      role="region"
      aria-label="Historical timeline"
      tabIndex={0}
    >
      <div className="relative">
        {/* Timeline line */}
        <div 
          className="absolute left-16 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-400 to-purple-500"
          aria-hidden="true"
        />
        
        {groupedTimelineItems.map((entry, index) => (
          <div key={`${entry.label}-${index}`} className="relative pb-4 last:pb-0">
            {/* Time label on the left */}
            <div className="absolute left-0 top-0 w-16 text-right pr-2 pt-1">
              <span className="text-xs font-medium text-blue-400">
                {entry.label}
              </span>
            </div>
            
            {/* Timeline dot - different style for empty days */}
            <div 
              className={`absolute z-10 w-2 h-2 rounded-full left-[60px] top-2 ${
                entry.events.length > 0 
                  ? 'bg-blue-500 shadow-lg shadow-blue-500/50' 
                  : 'bg-gray-600'
              }`}
              aria-hidden="true"
            />
            
            {/* Events for this time period */}
            <div className="ml-[76px] w-[calc(100%-76px)]">
              {entry.events.length > 0 ? (
                <div className="space-y-2" role="list" aria-label={`Events for ${entry.label}`}>
                  {entry.events.map((event) => (
                    <button
                      key={event.id}
                      ref={(el) => setEventRef(event.id, el)}
                      onClick={() => handleEventClick(event)}
                      className={`group relative w-full text-left p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50 hover:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        selectedEventId === event.id
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-800/10 border-gray-700/50 hover:bg-gray-800/20'
                      } ${
                        event.relatedTopicId ? 'timeline-event-linked' : ''
                      }`}
                      role="listitem"
                      aria-selected={selectedEventId === event.id}
                      aria-describedby={`event-${event.id}-description`}
                      aria-label={`${event.title}, ${event.date}${event.relatedTopicId ? ', has related timeline' : ''}`}
                    >
                      <h3 className="text-white font-semibold mb-2 leading-tight">
                        {event.title}
                        {event.relatedTopicId && (
                          <span 
                            className="ml-2 text-xs text-purple-400 opacity-75 group-hover:opacity-100 transition-opacity duration-200"
                            aria-label="Has related timeline"
                          >
                            →
                          </span>
                        )}
                      </h3>
                      
                      {displayMode === 'days' && (
                        <p className="text-blue-400 text-xs mb-2">
                          {event.date}
                        </p>
                      )}
                      
                      <p 
                        id={`event-${event.id}-description`}
                        className="text-gray-400 text-sm line-clamp-2"
                      >
                        {event.description}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                // Placeholder for time periods without events - more visible in days mode
                <div className={`${
                  displayMode === 'days' 
                    ? 'h-8 flex items-center text-gray-600 text-xs italic' 
                    : 'h-4'
                }`} aria-hidden="true">
                  {displayMode === 'days' && 'No events'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;