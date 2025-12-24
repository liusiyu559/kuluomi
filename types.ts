
export enum VoiceType {
  MALE = 'Puck',
  FEMALE = 'Kore'
}

export enum PortugueseType {
  BRAZIL = 'BR',
  PORTUGAL = 'PT'
}

export interface TranscriptionItem {
  speaker: 'user' | 'ai';
  text: string;
}

export interface VocabularyItem {
  word: string;
  level: string;
  translation: string;
  example: string;
}

export interface ComplexSentence {
  original: string;
  corrected: string;
  analysis: string;
}

export interface ClassicPattern {
  pattern: string;
  explanation: string;
  example: string;
}

export interface IdiomaticExpression {
  expression: string;
  translation: string;
}

export interface ReviewData {
  topic: string;
  idiomaticExpressions: IdiomaticExpression[];
  vocabulary: VocabularyItem[];
  complexSentences: ComplexSentence[];
  classicPatterns: ClassicPattern[];
}

export interface SelfCheckItem {
  query: string;
  answer: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ArchiveRecord {
  id: string;
  date: string;
  duration: string;
  transcription: TranscriptionItem[];
  review: ReviewData | null;
  voice: VoiceType;
  portugueseType: PortugueseType;
  isFavorited?: boolean;
  selfCheckSearches?: SelfCheckItem[];
  selfCheckReflections?: string[];
  assistantChat?: ChatMessage[];
}
