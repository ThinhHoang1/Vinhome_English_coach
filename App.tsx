// prettier-ignore
import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import ModeSwitcher from './components/ModeSwitcher';
import EvaluationForm from './components/EvaluationForm';
import FeedbackDisplay from './components/FeedbackDisplay';
import SpeakingInterface from './components/SpeakingInterface'; // New import
import { getEvaluation } from './services/geminiService';
import { WritingFeedback, SpeakingFeedback, EvaluationType } from './types';

function App() {
  const [activeMode, setActiveMode] = useState<EvaluationType>('writing');
  const [writingFeedback, setWritingFeedback] = useState<WritingFeedback | null>(null);
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingFeedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClearFeedback = useCallback(() => {
    setWritingFeedback(null);
    setSpeakingFeedback(null);
  }, []);

  const handleSetLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleSetError = useCallback((err: string | null) => {
    setError(err);
  }, []);

  const handleModeChange = useCallback((mode: EvaluationType) => {
    setActiveMode(mode);
    setError(null); // Clear errors when changing mode
    handleClearFeedback(); // Clear feedback when changing mode
  }, [handleClearFeedback]);

  // For Writing Coach
  const handleWritingSubmit = useCallback(async (inputText: string) => {
    handleSetLoading(true);
    handleSetError(null);
    handleClearFeedback();
    try {
      const feedback = await getEvaluation('writing', inputText) as WritingFeedback;
      setWritingFeedback(feedback);
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      handleSetError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      handleSetLoading(false);
    }
  }, [handleSetLoading, handleSetError, handleClearFeedback]);

  // For Speaking Coach: This will be called by SpeakingInterface after each turn
  const handleSubmitTranscriptForEvaluation = useCallback(async (transcript: string): Promise<SpeakingFeedback | null> => {
    handleSetLoading(true);
    handleSetError(null);
    // Clear previous speaking feedback to show new turn's feedback
    setSpeakingFeedback(null); 
    try {
      const feedback = await getEvaluation('speaking', transcript) as SpeakingFeedback;
      setSpeakingFeedback(feedback);
      return feedback;
    } catch (err: any) {
      console.error("Speaking evaluation failed for turn:", err);
      handleSetError(err.message || 'Failed to get detailed feedback for your turn.');
      return null;
    } finally {
      handleSetLoading(false);
    }
  }, [handleSetLoading, handleSetError]);

  return (
    <div className="container mx-auto p-4 md:p-8 bg-white rounded-xl shadow-lg max-w-4xl">
      <Header />
      <ModeSwitcher activeMode={activeMode} onModeChange={handleModeChange} />

      {activeMode === 'writing' && (
        <EvaluationForm
          mode="writing"
          onSubmit={handleWritingSubmit}
          isLoading={isLoading}
        />
      )}

      {activeMode === 'speaking' && (
        <SpeakingInterface
          onSubmitTranscriptForEvaluation={handleSubmitTranscriptForEvaluation}
          isLoadingGlobal={isLoading}
          errorGlobal={error}
          onClearFeedback={handleClearFeedback}
          onSetLoading={handleSetLoading}
          onSetError={handleSetError}
        />
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md animate-fade-in">
          <p className="font-semibold text-lg mb-2">Oops! Something went wrong.</p>
          <p>{error}</p>
          <p className="mt-2">Please try again. If it's a microphone issue, check your browser permissions.</p>
        </div>
      )}

      {activeMode === 'writing' && writingFeedback && (
        <div className="mt-8">
          <FeedbackDisplay type="writing" feedback={writingFeedback} />
        </div>
      )}

      {activeMode === 'speaking' && speakingFeedback && (
        <div className="mt-8">
          <FeedbackDisplay type="speaking" feedback={speakingFeedback} />
        </div>
      )}
    </div>
  );
}

export default App;