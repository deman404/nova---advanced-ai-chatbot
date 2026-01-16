
export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date | string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date | string;
}

export interface AnalyticsData {
  totalMessages: number;
  sentimentDistribution: { name: string; value: number }[];
  messageVolume: { time: string; count: number }[];
  avgResponseTime: number;
}

export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface AppSettings {
  darkMode: boolean;
  streaming: boolean;
  modelName: string;
  language: string;
}
