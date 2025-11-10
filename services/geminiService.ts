
// prettier-ignore
import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality, Type, Blob } from "@google/genai";
import { API_KEY, GEMINI_MODEL_NAME } from '../constants';
import { WritingFeedback, SpeakingFeedback, EvaluationType } from '../types';

if (!API_KEY) {
  throw new Error('API_KEY is not defined. Please set the API_KEY environment variable.');
}

// Instantiate GoogleGenAI here, but note that for Veo models requiring API key selection,
// a new instance should be created before each call. For text models like this,
// a single instance is generally fine.
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Define response schemas for JSON output
const writingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    introMessage: { type: Type.STRING },
    correctedSentence: { type: Type.STRING },
    explanation: { type: Type.STRING },
    scores: {
      type: Type.OBJECT,
      properties: {
        grammar: { type: Type.NUMBER },
        vocabulary: { type: Type.NUMBER },
        sentenceStructure: { type: Type.NUMBER },
        overallWritingQuality: { type: Type.NUMBER },
      },
      required: ['grammar', 'vocabulary', 'sentenceStructure', 'overallWritingQuality'],
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['introMessage', 'correctedSentence', 'explanation', 'scores', 'suggestions'],
  propertyOrdering: ['introMessage', 'correctedSentence', 'explanation', 'scores', 'suggestions'],
};

const speakingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    introMessage: { type: Type.STRING },
    feedback: { type: Type.STRING },
    scores: {
      type: Type.OBJECT,
      properties: {
        pronunciation: { type: Type.NUMBER },
        fluency: { type: Type.NUMBER },
        confidence: { type: Type.NUMBER },
        overallSpeakingQuality: { type: Type.NUMBER },
      },
      required: ['pronunciation', 'fluency', 'confidence', 'overallSpeakingQuality'],
    },
    pronunciationTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['introMessage', 'feedback', 'scores', 'pronunciationTips'],
  propertyOrdering: ['introMessage', 'feedback', 'scores', 'pronunciationTips'],
};

// --- Audio Utility Functions ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))), // `encode` not strictly needed as `btoa` works with string chars directly
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Audio Utility Functions ---

export const getEvaluation = async (
  type: EvaluationType,
  inputText: string
): Promise<WritingFeedback | SpeakingFeedback> => {
  const systemInstruction = `You are Vinschool English Coach AI, a friendly, encouraging English teacher for Vietnamese elementary students. If the student's input is in Vietnamese, you must first translate it to English internally, then provide feedback on the *translated English* as if the student originally wrote/spoke it. All your feedback, corrections, scores, and suggestions must be in clear, simple English. Your response must be a JSON object that adheres strictly to the provided schema and format, with no additional text or markdown outside the JSON object itself. Make sure all values are correctly typed as per the schema.`;

  let prompt: string;
  let responseSchema: any;

  if (type === 'writing') {
    prompt = `
Evaluate the following student's writing.
1. Check grammar, spelling, and sentence structure.
2. Identify common mistakes and explain corrections in a simple and friendly way.
3. Give a score from 0-10 for each category: Grammar, Vocabulary, Sentence Structure, Overall Writing Quality. For Overall, provide a decimal like 8.7/10.
4. Provide 2-3 short suggestions for improvement.
5. Always provide the corrected sentence clearly.
6. Use emojis occasionally (😊✨📘).
7. Keep answers concise.

Student's writing:
"${inputText}"
`;
    responseSchema = writingResponseSchema;
  } else { // type === 'speaking'
    prompt = `
Evaluate the following speech transcript, imagining the student spoke this.
1. Analyze pronunciation, fluency, and coherence.
2. Give feedback on pronunciation clarity, rhythm, and natural expression.
3. Rate the speaking performance from 0-10 in: Pronunciation, Fluency, Confidence, Overall Speaking Quality. For Overall, provide a decimal like 8.7/10.
4. Suggest 1-2 pronunciation tips.
5. Use emojis occasionally (😊✨📘).
6. Keep answers concise.

Student's speech transcript:
"${inputText}"
`;
    responseSchema = speakingResponseSchema;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const responseText = response.text.trim();
    console.log("Raw API Response Text (JSON):", responseText); // Log raw response for debugging

    try {
      const parsedFeedback = JSON.parse(responseText);
      if (type === 'writing') {
        return parsedFeedback as WritingFeedback;
      } else {
        return parsedFeedback as SpeakingFeedback;
      }
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      console.error('Response text that caused parsing error:', responseText);
      throw new Error('Failed to parse AI response. The response format was unexpected.');
    }

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    // Add more specific error messages if the error object provides them
    if (error.message && error.message.includes("400 BAD_REQUEST")) {
        throw new Error("Gemini API received a bad request. Please check your prompt or API key.");
    }
    throw new Error(`Failed to get evaluation from AI: ${error.message || 'Unknown error'}`);
  }
};


interface LiveSessionCallbacks {
  onTranscriptionUpdate: (inputTranscript: string, outputTranscript: string) => void;
  onTurnComplete: (fullInputTranscript: string) => void;
  onAIStartSpeaking: () => void;
  onAIStopSpeaking: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export const startLiveSpeakingSession = async (
  callbacks: LiveSessionCallbacks
): Promise<{ close: () => void }> => {
  let nextStartTime = 0;
  let inputAudioContext: AudioContext;
  let outputAudioContext: AudioContext;
  let inputNode: GainNode | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;
  let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  const sources = new Set<AudioBufferSourceNode>();
  let stream: MediaStream | null = null;

  let currentInputTranscription = '';
  let currentOutputTranscription = '';

  try {
    // Request microphone access
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Fix: Use standard AudioContext
    inputAudioContext = new AudioContext({ sampleRate: 16000 });
    // Fix: Use standard AudioContext
    outputAudioContext = new AudioContext({ sampleRate: 24000 });
    
    // Create a gain node for output control (optional, but good practice)
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.debug('Live session opened');
          // Stream audio from the microphone to the model.
          mediaStreamSource = inputAudioContext.createMediaStreamSource(stream!);
          scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          mediaStreamSource.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          // console.debug('Live message:', message);

          // Handle input transcription
          if (message.serverContent?.inputTranscription) {
            currentInputTranscription += message.serverContent.inputTranscription.text;
            callbacks.onTranscriptionUpdate(currentInputTranscription, currentOutputTranscription);
          }

          // Handle model's output audio and transcription
          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64EncodedAudioString) {
            callbacks.onAIStartSpeaking();
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              outputAudioContext,
              24000,
              1,
            );
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.addEventListener('ended', () => {
              sources.delete(source);
              if (sources.size === 0) { // Check if all current audio chunks have finished playing
                callbacks.onAIStopSpeaking();
              }
            });

            source.start(nextStartTime);
            nextStartTime = nextStartTime + audioBuffer.duration;
            sources.add(source);
          }
          if (message.serverContent?.outputTranscription) {
            currentOutputTranscription += message.serverContent.outputTranscription.text;
            callbacks.onTranscriptionUpdate(currentInputTranscription, currentOutputTranscription);
          }
          
          // Handle turn complete
          if (message.serverContent?.turnComplete) {
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
          }
          
          // Handle interruption
          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            for (const source of sources.values()) {
              source.stop();
              sources.delete(source);
            }
            nextStartTime = 0;
            callbacks.onAIStopSpeaking();
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('Live API Error:', e);
          callbacks.onError(`Live session error: ${e.message || 'Unknown error'}`);
          callbacks.onClose(); // Close the session on error
        },
        onclose: (e: CloseEvent) => {
          console.debug('Live session closed:', e);
          callbacks.onClose();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are Vinschool English Coach AI, a friendly, encouraging English teacher for Vietnamese elementary students. Your goal is to have a natural conversation, guiding them to improve their English speaking. Keep responses simple and encouraging. If the student speaks Vietnamese, respond in English as if they spoke English, perhaps gently guiding them to try speaking English.',
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });

    const session = await sessionPromise;

    return {
      close: () => {
        session.close();
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (inputAudioContext) {
          inputAudioContext.close();
        }
        if (outputAudioContext) {
          outputAudioContext.close();
        }
        if (scriptProcessor) {
          scriptProcessor.disconnect();
          scriptProcessor.onaudioprocess = null;
        }
        if (mediaStreamSource) {
          mediaStreamSource.disconnect();
        }
        for (const source of sources.values()) {
          source.stop();
          sources.delete(source);
        }
        console.log('Live session resources cleaned up.');
      },
    };
  } catch (error: any) {
    console.error('Failed to start live speaking session:', error);
    callbacks.onError(`Failed to start speaking session: ${error.message || 'Microphone access denied or unknown error.'}`);
    callbacks.onClose();
    throw error;
  }
};
