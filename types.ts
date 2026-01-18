
export enum SignalAction {
  CALL = 'CALL 🟢',
  PUT = 'PUT 🔴'
}

export interface Signal {
  id: string;
  asset: string;
  timeframe: string;
  action: SignalAction;
  entryPrice: string;
  expiry: string;
  confidence: number;
  timestamp: number;
  rationale: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
}
