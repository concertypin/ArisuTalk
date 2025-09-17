export interface Character {
  id: number;
  name: string;
  description: string;
  prompt: string;
  avatar: string | null;
  stickers?: { id: string; name: string; type: string; dataUrl: string; originalSize: number; size: number }[];
  memories?: string[];
  media?: { id: string; mimeType: string; dataUrl: string }[];
  isRandom?: boolean;
  responseTime: string;
  thinkingTime: string;
  reactivity: string;
  tone: string;
  proactiveEnabled: boolean;
  messageCountSinceLastSummary: number;
  currentState?: {
    affection: number;
    intimacy: number;
    trust: number;
    romantic_interest: number;
  };
  naiSettings?: any;
  hypnosis?: any;
  snsPosts?: any[];
}
