
// prettier-ignore
import React from 'react';
import { WritingFeedback, SpeakingFeedback, EvaluationType } from '../types';

interface FeedbackDisplayProps {
  type: EvaluationType;
  feedback: WritingFeedback | SpeakingFeedback;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ type, feedback }) => {
  const renderScores = (scores: { [key: string]: number }) => (
    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
          <p className="text-xl font-bold text-indigo-600">{value}/10</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200 animate-fade-in">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4 flex items-center">
        <span className="mr-2">✨</span> Your AI Coach's Feedback!
      </h2>

      {(feedback as any).introMessage && (
        <p className="text-lg text-gray-800 mb-4">{ (feedback as any).introMessage }</p>
      )}

      {type === 'writing' && (feedback as WritingFeedback).correctedSentence && (
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-700">Corrected Sentence:</p>
          <p className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 font-medium italic">
            "{ (feedback as WritingFeedback).correctedSentence }"
          </p>
        </div>
      )}

      {type === 'writing' && (feedback as WritingFeedback).explanation && (
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-700">Explanation:</p>
          <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            { (feedback as WritingFeedback).explanation }
          </p>
        </div>
      )}

      {type === 'speaking' && (feedback as SpeakingFeedback).feedback && (
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-700">Overall Feedback:</p>
          <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            { (feedback as SpeakingFeedback).feedback }
          </p>
        </div>
      )}

      <h3 className="text-2xl font-bold text-indigo-600 mt-6 mb-3">Scores:</h3>
      {type === 'writing' ? renderScores((feedback as WritingFeedback).scores) : renderScores((feedback as SpeakingFeedback).scores)}

      {(type === 'writing' && (feedback as WritingFeedback).suggestions.length > 0) && (
        <div className="mt-6">
          <h3 className="text-2xl font-bold text-indigo-600 mb-3">Suggestions for Improvement:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {(feedback as WritingFeedback).suggestions.map((suggestion, index) => (
              <li key={index} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(type === 'speaking' && (feedback as SpeakingFeedback).pronunciationTips.length > 0) && (
        <div className="mt-6">
          <h3 className="text-2xl font-bold text-indigo-600 mb-3">Pronunciation Tips:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {(feedback as SpeakingFeedback).pronunciationTips.map((tip, index) => (
              <li key={index} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
