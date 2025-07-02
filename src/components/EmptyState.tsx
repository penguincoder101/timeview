import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-800/5 backdrop-blur-sm border border-gray-700/30 rounded-2xl">
      <div className="text-center max-w-md p-8">
        <div className="relative mb-6 hidden lg:block">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-blue-400" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3">
          Explore History
        </h3>
        
        <p className="text-gray-400 leading-relaxed mb-6">
          Select an event from the timeline to dive deep into historical moments and discover fascinating details about our past.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span>Click any timeline event to begin</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;