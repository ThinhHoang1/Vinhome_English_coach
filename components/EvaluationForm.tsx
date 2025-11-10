// prettier-ignore
import React, { useState, useCallback } from 'react';
import { EvaluationType } from '../types';

interface EvaluationFormProps {
  mode: EvaluationType;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ mode, onSubmit, isLoading }) => {
  const [inputText, setInputText] = useState<string>('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSubmit(inputText);
    }
  }, [inputText, onSubmit]);

  const placeholderText = mode === 'writing'
    ? "Enter your English writing here (e.g., 'Yesterday I go to the park and play with my friend.'). The AI will check grammar, spelling, and sentence structure."
    : "Paste your speech transcript here (e.g., 'Hello, my name is Alex. I am eight years old.'). The AI will evaluate pronunciation, fluency, and coherence.";

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-blue-50 rounded-lg shadow-inner">
      <label htmlFor="inputText" className="block text-lg font-medium text-gray-800 mb-3">
        {mode === 'writing' ? 'Your English Writing' : 'Your Speech Transcript'}
      </label>
      <textarea
        id="inputText"
        className="w-full p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-y min-h-[150px] bg-white text-gray-800"
        placeholder={placeholderText}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={6}
        required
        disabled={isLoading}
      ></textarea>
      <button
        type="submit"
        className="mt-6 w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-full shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sticky bottom-4 md:bottom-0"
        disabled={isLoading || !inputText.trim()}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Getting Feedback...
          </>
        ) : (
          `${mode === 'writing' ? 'Get Writing Feedback!' : 'Get Speaking Feedback!'}`
        )}
      </button>
    </form>
  );
};

export default EvaluationForm;