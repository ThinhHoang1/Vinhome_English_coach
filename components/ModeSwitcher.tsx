
// prettier-ignore
import React from 'react';
import { EvaluationType } from '../types';

interface ModeSwitcherProps {
  activeMode: EvaluationType;
  onModeChange: (mode: EvaluationType) => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ activeMode, onModeChange }) => {
  return (
    <div className="flex justify-center mb-8 sticky top-0 bg-white pt-4 pb-2 z-10 shadow-sm rounded-b-lg -mx-6 md:-mx-8 px-6 md:px-8">
      <button
        onClick={() => onModeChange('writing')}
        className={`px-6 py-3 mr-4 rounded-full font-semibold transition-all duration-300
          ${activeMode === 'writing'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
          }`}
      >
        📝 Writing Coach
      </button>
      <button
        onClick={() => onModeChange('speaking')}
        className={`px-6 py-3 rounded-full font-semibold transition-all duration-300
          ${activeMode === 'speaking'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
          }`}
      >
        🗣️ Speaking Coach
      </button>
    </div>
  );
};

export default ModeSwitcher;
