import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Topic, TopicId } from '../types';

interface TopicSelectorProps {
  topics: Topic[];
  selectedTopicId: TopicId;
  onTopicChange: (topicId: TopicId) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedTopicId,
  onTopicChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedTopic = topics.find(topic => topic.id === selectedTopicId);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dropdownRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const options = dropdownRef.current.querySelectorAll('[role="option"]');
            const currentIndex = Array.from(options).findIndex(option => 
              option === document.activeElement
            );
            const nextIndex = Math.min(currentIndex + 1, options.length - 1);
            (options[nextIndex] as HTMLElement)?.focus();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            const options = dropdownRef.current.querySelectorAll('[role="option"]');
            const currentIndex = Array.from(options).findIndex(option => 
              option === document.activeElement
            );
            const prevIndex = Math.max(currentIndex - 1, 0);
            (options[prevIndex] as HTMLElement)?.focus();
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (document.activeElement?.getAttribute('role') === 'option') {
            const topicId = document.activeElement.getAttribute('data-topic-id') as TopicId;
            if (topicId) {
              onTopicChange(topicId);
              setIsOpen(false);
              buttonRef.current?.focus();
            }
          } else if (document.activeElement === buttonRef.current) {
            setIsOpen(!isOpen);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onTopicChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTopicSelect = (topicId: TopicId) => {
    onTopicChange(topicId);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800/10 backdrop-blur-sm border border-gray-700/30 rounded-xl px-6 py-3 cursor-pointer hover:border-blue-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full text-left"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select timeline topic"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Explore Timeline</p>
            <p className="text-white font-medium">{selectedTopic?.name}</p>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>
      
      <div 
        className={`absolute top-full left-0 right-0 mt-2 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl py-2 z-50 transition-all duration-200 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        role="listbox"
        aria-label="Timeline topics"
      >
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicSelect(topic.id as TopicId)}
            className={`w-full text-left px-6 py-3 hover:bg-gray-700/30 transition-colors duration-200 focus:outline-none focus:bg-gray-700/30 ${
              topic.id === selectedTopicId 
                ? 'text-blue-400 bg-blue-500/10' 
                : 'text-gray-300'
            }`}
            role="option"
            aria-selected={topic.id === selectedTopicId}
            data-topic-id={topic.id}
            tabIndex={isOpen ? 0 : -1}
          >
            <p className="font-medium">{topic.name}</p>
            <p className="text-sm text-gray-500 mt-1">{topic.events.length} events</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;