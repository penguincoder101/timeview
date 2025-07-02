import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { History, ChevronLeft, Plus, Trash2, Save, Calendar, Tag, Link, FileText, Image, ArrowLeft, ArrowRight, Eye, Clock, GripVertical, Edit3, Globe, Lock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AnimatedBackground from './AnimatedBackground';
import { Topic, NewTopicForm, NewEventForm, PageType, TimelineDisplayMode } from '../types';

interface TopicFormPageProps {
  initialTopic?: Topic | null;
  onSubmit: (topic: Topic, returnToPage: PageType) => void;
  onCancel: (returnToPage: PageType) => void;
  generateId: () => string;
  returnToPage: PageType;
  organizationId?: string;
}

interface SortableEventItemProps {
  event: NewEventForm;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const SortableEventItem: React.FC<SortableEventItemProps> = ({
  event,
  index,
  isSelected,
  onClick,
  onEdit
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id || `event-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatYear = (year: string): string => {
    const yearNum = Number(year);
    if (isNaN(yearNum)) return year;
    if (yearNum < 0) {
      return `${Math.abs(yearNum)} BCE`;
    }
    return `${yearNum} CE`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
        isSelected
          ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20'
          : 'bg-gray-800/10 border-gray-700/50 hover:bg-gray-800/20 hover:border-gray-600/50'
      } ${isDragging ? 'z-50' : ''}`}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute right-2 top-2 p-1 bg-gray-800/80 hover:bg-gray-700/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Edit event"
      >
        <Edit3 className="w-3 h-3" />
      </button>

      <div className="flex items-start gap-4 ml-6">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title || 'Event image'}
            loading="lazy"
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-1 truncate">
            {event.title || `Event ${index + 1}`}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Calendar className="w-3 h-3" />
            <span>{event.date || 'No date'}</span>
            {event.year && (
              <>
                <span>•</span>
                <span>{formatYear(event.year)}</span>
              </>
            )}
          </div>
          <div 
            className="text-sm text-gray-400 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: event.description || 'No description' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

const TopicFormPage: React.FC<TopicFormPageProps> = ({ 
  initialTopic, 
  onSubmit, 
  onCancel, 
  generateId,
  returnToPage,
  organizationId
}) => {
  const [topicForm, setTopicForm] = useState<NewTopicForm>({
    name: '',
    defaultDisplayMode: 'years',
    isPublic: false,
    organizationId: organizationId,
    events: [{
      title: '',
      date: '',
      year: '',
      description: '',
      shortDescription: '',
      imageUrl: '',
      detailsUrl: '',
      tags: ''
    }]
  });

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize form with existing topic data if editing
  useEffect(() => {
    if (initialTopic) {
      setTopicForm({
        id: initialTopic.id,
        name: initialTopic.name,
        defaultDisplayMode: initialTopic.defaultDisplayMode || 'years',
        isPublic: initialTopic.isPublic || false,
        organizationId: initialTopic.organizationId || organizationId,
        events: initialTopic.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          year: event.year.toString(),
          description: event.description,
          shortDescription: event.shortDescription || '',
          imageUrl: event.imageUrl,
          detailsUrl: event.detailsUrl || '',
          tags: event.tags ? event.tags.join(', ') : ''
        }))
      });
    } else if (organizationId) {
      // Set organization ID for new topics
      setTopicForm(prev => ({ ...prev, organizationId }));
    }
  }, [initialTopic, organizationId]);

  // Ensure all events have IDs for drag and drop
  const eventsWithIds = useMemo(() => {
    return topicForm.events.map((event, index) => ({
      ...event,
      id: event.id || `temp-${index}-${Date.now()}`
    }));
  }, [topicForm.events]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const isEditing = !!initialTopic;
  const currentEvent = eventsWithIds[currentEventIndex];
  const hasMultipleEvents = eventsWithIds.length > 1;
  const isLastEvent = currentEventIndex === eventsWithIds.length - 1;
  const isFirstEvent = currentEventIndex === 0;

  // ReactQuill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  const handleTopicNameChange = useCallback((value: string) => {
    setTopicForm(prev => ({ ...prev, name: value }));
    if (errors.topicName) {
      setErrors(prev => ({ ...prev, topicName: '' }));
    }
  }, [errors.topicName]);

  const handleDisplayModeChange = useCallback((mode: TimelineDisplayMode) => {
    setTopicForm(prev => ({ ...prev, defaultDisplayMode: mode }));
  }, []);

  const handlePublicChange = useCallback((isPublic: boolean) => {
    setTopicForm(prev => ({ ...prev, isPublic }));
  }, []);

  const handleEventChange = useCallback((field: keyof NewEventForm, value: string) => {
    setTopicForm(prev => ({
      ...prev,
      events: prev.events.map((event, i) => 
        i === currentEventIndex ? { ...event, [field]: value } : event
      )
    }));

    // Clear related errors
    const errorKey = `event-${currentEventIndex}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  }, [currentEventIndex, errors]);

  const navigateToEvent = useCallback((index: number) => {
    if (index >= 0 && index < eventsWithIds.length && index !== currentEventIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentEventIndex(index);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentEventIndex, eventsWithIds.length]);

  const addNewEvent = useCallback(() => {
    const newEvent: NewEventForm = {
      id: generateId(),
      title: '',
      date: '',
      year: '',
      description: '',
      shortDescription: '',
      imageUrl: '',
      detailsUrl: '',
      tags: ''
    };

    setTopicForm(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    // Navigate to the new event
    const newIndex = topicForm.events.length;
    navigateToEvent(newIndex);
  }, [topicForm.events.length, navigateToEvent, generateId]);

  const removeCurrentEvent = useCallback(() => {
    if (eventsWithIds.length > 1) {
      setTopicForm(prev => ({
        ...prev,
        events: prev.events.filter((_, i) => i !== currentEventIndex)
      }));

      // Adjust current index if necessary
      if (currentEventIndex >= eventsWithIds.length - 1) {
        setCurrentEventIndex(Math.max(0, currentEventIndex - 1));
      }
    }
  }, [currentEventIndex, eventsWithIds.length]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = eventsWithIds.findIndex(event => event.id === active.id);
      const newIndex = eventsWithIds.findIndex(event => event.id === over.id);

      const newEvents = arrayMove(eventsWithIds, oldIndex, newIndex);
      
      setTopicForm(prev => ({
        ...prev,
        events: newEvents
      }));

      // Update current event index if the currently selected event was moved
      if (oldIndex === currentEventIndex) {
        setCurrentEventIndex(newIndex);
      } else if (oldIndex < currentEventIndex && newIndex >= currentEventIndex) {
        setCurrentEventIndex(currentEventIndex - 1);
      } else if (oldIndex > currentEventIndex && newIndex <= currentEventIndex) {
        setCurrentEventIndex(currentEventIndex + 1);
      }
    }
  }, [eventsWithIds, currentEventIndex]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate topic name
    if (!topicForm.name.trim()) {
      newErrors.topicName = 'Topic name is required';
    }

    // Validate all events
    eventsWithIds.forEach((event, index) => {
      if (!event.title.trim()) {
        newErrors[`event-${index}-title`] = 'Event title is required';
      }
      if (!event.date.trim()) {
        newErrors[`event-${index}-date`] = 'Event date is required';
      }
      if (!event.year.trim()) {
        newErrors[`event-${index}-year`] = 'Event year is required';
      } else if (isNaN(Number(event.year))) {
        newErrors[`event-${index}-year`] = 'Year must be a valid number';
      }
      if (!event.description.trim()) {
        newErrors[`event-${index}-description`] = 'Event description is required';
      }
      if (!event.imageUrl.trim()) {
        newErrors[`event-${index}-imageUrl`] = 'Event image URL is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [topicForm, eventsWithIds]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create the topic object
    const topic: Topic = {
      id: topicForm.id || generateId(),
      name: topicForm.name.trim(),
      defaultDisplayMode: topicForm.defaultDisplayMode,
      isPublic: topicForm.isPublic,
      organizationId: topicForm.organizationId,
      events: eventsWithIds.map(event => ({
        id: event.id || generateId(),
        title: event.title.trim(),
        date: event.date.trim(),
        year: Number(event.year),
        description: event.description.trim(),
        shortDescription: event.shortDescription.trim() || undefined,
        imageUrl: event.imageUrl.trim(),
        detailsUrl: event.detailsUrl.trim() || undefined,
        tags: event.tags.trim() ? event.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      }))
    };

    onSubmit(topic, returnToPage);
  }, [topicForm, eventsWithIds, validateForm, generateId, onSubmit, returnToPage]);

  const handleCancel = useCallback(() => {
    onCancel(returnToPage);
  }, [onCancel, returnToPage]);

  const formatYear = (year: string): string => {
    const yearNum = Number(year);
    if (isNaN(yearNum)) return year;
    if (yearNum < 0) {
      return `${Math.abs(yearNum)} BCE`;
    }
    return `${yearNum} CE`;
  };

  const activeEvent = activeId ? eventsWithIds.find(event => event.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-30 border-b border-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-blue-400" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {isEditing ? 'Edit Timeline' : 'Create New Timeline'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {isEditing ? 'Modify your historical timeline' : 'Build your historical timeline'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Left Column - Topic Overview & Preview */}
          <div className="space-y-6 overflow-y-auto">
            {/* Topic Details */}
            <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Timeline Overview
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="topicName" className="block text-sm font-medium text-gray-300 mb-2">
                    Timeline Name *
                  </label>
                  <input
                    type="text"
                    id="topicName"
                    value={topicForm.name}
                    onChange={(e) => handleTopicNameChange(e.target.value)}
                    placeholder="e.g., Renaissance Art, Space Exploration, Ancient Rome"
                    className={`w-full px-4 py-3 bg-gray-800/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      errors.topicName ? 'border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                    }`}
                  />
                  {errors.topicName && (
                    <p className="mt-2 text-sm text-red-400">{errors.topicName}</p>
                  )}
                </div>

                {/* Default Display Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Default Timeline Display Mode
                  </label>
                  <div className="flex items-center gap-2 bg-gray-800/30 border border-gray-600/50 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleDisplayModeChange('years')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        topicForm.defaultDisplayMode === 'years'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisplayModeChange('days')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        topicForm.defaultDisplayMode === 'days'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                      }`}
                    >
                      Days
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Choose how events will be displayed by default when users view this timeline
                  </p>
                </div>

                {/* Public Access Toggle - only show if not in organization */}
                {!organizationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      {topicForm.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      Public Access
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={topicForm.isPublic}
                          onChange={(e) => handlePublicChange(e.target.checked)}
                          className="w-5 h-5 text-blue-600 bg-gray-800/30 border-gray-600/50 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">
                          Make this timeline publicly accessible
                        </span>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {topicForm.isPublic 
                        ? 'Anyone can view this timeline without logging in'
                        : 'Only authenticated users with proper permissions can view this timeline'
                      }
                    </p>
                  </div>
                )}

                {/* Organization indicator */}
                {organizationId && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">Organization Timeline</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      This timeline will be created within your organization and will be accessible to organization members based on their permissions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Events Preview with Drag and Drop */}
            <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  Events Preview
                </h3>
                <span className="text-sm text-gray-400">
                  {eventsWithIds.length} event{eventsWithIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={eventsWithIds.map(e => e.id!)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {eventsWithIds.map((event, index) => (
                      <SortableEventItem
                        key={event.id}
                        event={event}
                        index={index}
                        isSelected={index === currentEventIndex}
                        onClick={() => navigateToEvent(index)}
                        onEdit={() => navigateToEvent(index)}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeEvent ? (
                    <div className="p-4 rounded-xl border bg-gray-800/90 border-blue-500/50 shadow-2xl backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                        {activeEvent.imageUrl && (
                          <img
                            src={activeEvent.imageUrl}
                            alt={activeEvent.title || 'Event image'}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1 truncate">
                            {activeEvent.title || 'Untitled Event'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Calendar className="w-3 h-3" />
                            <span>{activeEvent.date || 'No date'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          {/* Right Column - Event Form */}
          <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Event {currentEventIndex + 1}
              </h2>
              
              {/* Event Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateToEvent(currentEventIndex - 1)}
                  disabled={isFirstEvent}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isFirstEvent
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-400 px-2">
                  {currentEventIndex + 1} of {eventsWithIds.length}
                </span>
                
                <button
                  type="button"
                  onClick={() => navigateToEvent(currentEventIndex + 1)}
                  disabled={isLastEvent}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isLastEvent
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Event Form */}
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'}`}>
              <form className="space-y-6">
                {/* Event Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={currentEvent?.title || ''}
                    onChange={(e) => handleEventChange('title', e.target.value)}
                    placeholder="e.g., The Fall of Constantinople"
                    className={`w-full px-4 py-3 bg-gray-800/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      errors[`event-${currentEventIndex}-title`] ? 'border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                    }`}
                  />
                  {errors[`event-${currentEventIndex}-title`] && (
                    <p className="mt-1 text-sm text-red-400">{errors[`event-${currentEventIndex}-title`]}</p>
                  )}
                </div>

                {/* Date and Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="text"
                      value={currentEvent?.date || ''}
                      onChange={(e) => handleEventChange('date', e.target.value)}
                      placeholder="e.g., May 29, 1453"
                      className={`w-full px-4 py-3 bg-gray-800/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        errors[`event-${currentEventIndex}-date`] ? 'border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                      }`}
                    />
                    {errors[`event-${currentEventIndex}-date`] && (
                      <p className="mt-1 text-sm text-red-400">{errors[`event-${currentEventIndex}-date`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Year * (use negative for BCE)
                    </label>
                    <input
                      type="text"
                      value={currentEvent?.year || ''}
                      onChange={(e) => handleEventChange('year', e.target.value)}
                      placeholder="e.g., 1453 or -500"
                      className={`w-full px-4 py-3 bg-gray-800/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        errors[`event-${currentEventIndex}-year`] ? 'border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                      }`}
                    />
                    {errors[`event-${currentEventIndex}-year`] && (
                      <p className="mt-1 text-sm text-red-400">{errors[`event-${currentEventIndex}-year`]}</p>
                    )}
                  </div>
                </div>

                {/* Short Description with WYSIWYG */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Short Description
                  </label>
                  <div className="bg-gray-800/30 border border-gray-600/50 rounded-xl overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={currentEvent?.shortDescription || ''}
                      onChange={(value) => handleEventChange('shortDescription', value)}
                      placeholder="Brief one-line summary (optional)"
                      modules={quillModules}
                      formats={quillFormats}
                      className="text-white"
                    />
                  </div>
                </div>

                {/* Full Description with WYSIWYG */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Description *
                  </label>
                  <div className={`bg-gray-800/30 border rounded-xl overflow-hidden ${
                    errors[`event-${currentEventIndex}-description`] ? 'border-red-500' : 'border-gray-600/50'
                  }`}>
                    <ReactQuill
                      theme="snow"
                      value={currentEvent?.description || ''}
                      onChange={(value) => handleEventChange('description', value)}
                      placeholder="Detailed description of the historical event..."
                      modules={quillModules}
                      formats={quillFormats}
                      className="text-white"
                      style={{ minHeight: '120px' }}
                    />
                  </div>
                  {errors[`event-${currentEventIndex}-description`] && (
                    <p className="mt-1 text-sm text-red-400">{errors[`event-${currentEventIndex}-description`]}</p>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={currentEvent?.imageUrl || ''}
                    onChange={(e) => handleEventChange('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-4 py-3 bg-gray-800/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      errors[`event-${currentEventIndex}-imageUrl`] ? 'border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                    }`}
                  />
                  {errors[`event-${currentEventIndex}-imageUrl`] && (
                    <p className="mt-1 text-sm text-red-400">{errors[`event-${currentEventIndex}-imageUrl`]}</p>
                  )}
                </div>

                {/* Details URL and Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Details URL (optional)
                    </label>
                    <input
                      type="url"
                      value={currentEvent?.detailsUrl || ''}
                      onChange={(e) => handleEventChange('detailsUrl', e.target.value)}
                      placeholder="https://wikipedia.org/..."
                      className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags (optional)
                    </label>
                    <input
                      type="text"
                      value={currentEvent?.tags || ''}
                      onChange={(e) => handleEventChange('tags', e.target.value)}
                      placeholder="war, politics, culture"
                      className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Event Actions */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-700/30">
              <button
                type="button"
                onClick={addNewEvent}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-700/90 rounded-lg text-white transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Another Event
              </button>
              
              {hasMultipleEvents && (
                <button
                  type="button"
                  onClick={removeCurrentEvent}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700/90 rounded-lg text-white transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove This Event
                </button>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {isEditing ? 'Update Timeline' : 'Create Timeline'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TopicFormPage;