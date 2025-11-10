// prettier-ignore
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { startLiveSpeakingSession, getEvaluation } from '../services/geminiService';
import { SpeakingFeedback } from '../types';

interface SpeakingInterfaceProps {
  onSubmitTranscriptForEvaluation: (transcript: string) => Promise<SpeakingFeedback | null>;
  isLoadingGlobal: boolean;
  errorGlobal: string | null;
  onClearFeedback: () => void;
  onSetLoading: (isLoading: boolean) => void;
  onSetError: (error: string | null) => void;
}

const SpeakingInterface: React.FC<SpeakingInterfaceProps> = ({
  onSubmitTranscriptForEvaluation,
  isLoadingGlobal,
  errorGlobal,
  onClearFeedback,
  onSetLoading,
  onSetError,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentInputDisplayTranscript, setCurrentInputDisplayTranscript] = useState<string>('');
  const [currentOutputDisplayTranscript, setCurrentOutputDisplayTranscript] = useState<string>('');
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  const [isAIAudioPlaying, setIsAIAudioPlaying] = useState<boolean>(false);

  const liveSessionRef = useRef<{ close: () => void } | null>(null);
  const inputTranscriptRef = useRef<string>('');
  const outputTranscriptRef = useRef<string>('');
  const conversationHistoryRef = useRef<string[]>([]); // To store full turns for context if needed

  const startSpeaking = useCallback(async () => {
    onClearFeedback();
    onSetError(null);
    onSetLoading(true);
    setCurrentInputDisplayTranscript('');
    setCurrentOutputDisplayTranscript('');
    conversationHistoryRef.current = [];

    try {
      const sessionHandle = await startLiveSpeakingSession({
        onTranscriptionUpdate: (input, output) => {
          inputTranscriptRef.current = input;
          outputTranscriptRef.current = output;
          setCurrentInputDisplayTranscript(input);
          setCurrentOutputDisplayTranscript(output);
          if (input.length > 0 || output.length > 0) {
            setIsAIThinking(true); // AI is processing or speaking
          } else {
            setIsAIThinking(false); // No activity
          }
        },
        onTurnComplete: async (fullInputTranscript) => {
          console.log("Turn complete. Evaluating:", fullInputTranscript);
          conversationHistoryRef.current.push(`You: ${fullInputTranscript}`);
          if (outputTranscriptRef.current) {
            conversationHistoryRef.current.push(`Coach: ${outputTranscriptRef.current}`);
          }
          
          // Clear current turn's display but retain for conversation history
          inputTranscriptRef.current = '';
          outputTranscriptRef.current = '';
          setCurrentInputDisplayTranscript('');
          setCurrentOutputDisplayTranscript('');

          // Trigger detailed evaluation for the completed student turn
          onSetLoading(true);
          try {
            await onSubmitTranscriptForEvaluation(fullInputTranscript);
          } catch (evalError: any) {
            onSetError(evalError.message || 'Failed to get detailed feedback for the turn.');
          } finally {
            onSetLoading(false);
          }
        },
        onAIStartSpeaking: () => {
          setIsAIAudioPlaying(true);
          setIsAIThinking(false); // AI is now speaking, not just thinking
        },
        onAIStopSpeaking: () => {
          setIsAIAudioPlaying(false);
          // If no input transcription is happening, AI is done with its turn
          if (inputTranscriptRef.current === '') {
            setIsAIThinking(false);
          }
        },
        onError: (message) => {
          onSetError(message);
          setIsRecording(false);
          onSetLoading(false);
        },
        onClose: () => {
          setIsRecording(false);
          onSetLoading(false);
          liveSessionRef.current = null;
          inputTranscriptRef.current = '';
          outputTranscriptRef.current = '';
          setCurrentInputDisplayTranscript('');
          setCurrentOutputDisplayTranscript('');
          setIsAIThinking(false);
          setIsAIAudioPlaying(false);
        },
      });
      liveSessionRef.current = sessionHandle;
      setIsRecording(true);
      onSetLoading(false);
    } catch (error: any) {
      console.error("Error starting live session:", error);
      onSetError(error.message || 'Could not start speaking session. Please check microphone permissions.');
      onSetLoading(false);
      setIsRecording(false);
    }
  }, [onClearFeedback, onSetError, onSetLoading, onSubmitTranscriptForEvaluation]);

  const stopSpeaking = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    setIsRecording(false);
    onSetLoading(false);
    setIsAIThinking(false);
    setIsAIAudioPlaying(false);
  }, [onSetLoading]);

  // Clean up session on component unmount
  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
      }
    };
  }, []);

  const getStatusMessage = () => {
    if (errorGlobal) return `Error: ${errorGlobal}`;
    if (isLoadingGlobal) return 'Connecting...';
    if (isRecording) {
      if (isAIAudioPlaying) return 'Coach is speaking... 🗣️';
      if (isAIThinking) return 'Coach is thinking... 🤔';
      return 'Listening to you... 🎤';
    }
    return 'Ready to start speaking! Click the button below. ✨';
  };

  return (
    <div className="mb-8 p-4 bg-purple-50 rounded-lg shadow-inner text-center">
      <p className="block text-lg font-medium text-gray-800 mb-3">
        Let's practice your English speaking!
      </p>

      <div className="flex flex-col gap-4 text-left mb-6">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-200">
          <p className="text-sm font-semibold text-gray-600">You:</p>
          <p className="text-gray-800 italic min-h-[40px]">
            {currentInputDisplayTranscript || (isRecording && !isAIThinking && !isAIAudioPlaying ? "..." : "")}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-200">
          <p className="text-sm font-semibold text-gray-600">Coach:</p>
          <p className="text-blue-700 italic min-h-[40px]">
            {currentOutputDisplayTranscript || (isAIThinking || isAIAudioPlaying ? "..." : "")}
          </p>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 min-h-[24px]">
        {getStatusMessage()}
      </p>

      {!isRecording ? (
        <button
          onClick={startSpeaking}
          className="w-full py-3 px-6 bg-green-600 text-white font-bold rounded-full shadow-md hover:bg-green-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoadingGlobal}
        >
          {isLoadingGlobal ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 00-3-3H7zm2 8a1 1 0 11-2 0 1 1 0 012 0zm7-8a1 1 0 011 1v3a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd"></path><path d="M16 13a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a1 1 0 011-1h10a1 1 0 011 1v3zM10 18a6 6 0 006-6v-1a1 1 0 012 0v1a8 8 0 01-16 0v-1a1 1 0 012 0v1a6 6 0 006 6z"></path></svg>
              Start Speaking
            </>
          )}
        </button>
      ) : (
        <button
          onClick={stopSpeaking}
          className="w-full py-3 px-6 bg-red-600 text-white font-bold rounded-full shadow-md hover:bg-red-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoadingGlobal}
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
          Stop Speaking
        </button>
      )}
    </div>
  );
};

export default SpeakingInterface;