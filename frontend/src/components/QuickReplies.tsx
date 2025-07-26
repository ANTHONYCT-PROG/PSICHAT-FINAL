import React from 'react';

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ suggestions, onSelect, visible }) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-2 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-full text-sm transition-colors border border-gray-200 hover:border-emerald-300"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies; 