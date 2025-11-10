
// prettier-ignore
export type EvaluationType = 'writing' | 'speaking';

export interface WritingFeedback {
  introMessage: string;
  correctedSentence: string;
  explanation: string;
  scores: {
    grammar: number;
    vocabulary: number;
    sentenceStructure: number;
    overallWritingQuality: number;
  };
  suggestions: string[];
}

export interface SpeakingFeedback {
  introMessage: string;
  feedback: string;
  scores: {
    pronunciation: number;
    fluency: number;
    confidence: number;
    overallSpeakingQuality: number;
  };
  pronunciationTips: string[];
}
