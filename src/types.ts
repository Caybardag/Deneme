export type CategoryId = 
  | 'crisis_decision' 
  | 'career_strategy' 
  | 'personal_psychology' 
  | 'finance_business' 
  | 'negotiation_conflict'
  | 'general';

export type UrgencyLevel = 'urgent' | 'medium' | 'strategic';

export interface ActionStep {
  id: string;
  step: string;
  tacticalAdvice: string;
  timeEstimate: string;
  priority: 'Kritik' | 'Yüksek' | 'Normal';
  completed?: boolean;
  notes?: string;
  dependencies?: string[];
  riskFactor?: number;
}

export interface RoadmapPhase {
  title: string;
  steps: ActionStep[];
}

export interface StrategicOption {
  name: string;
  rationale: string;
  pros: string[];
  cons: string[];
  riskLevel: 'Düşük' | 'Orta' | 'Yüksek';
  recommended: boolean;
  expectedValueScore?: number;
  successRate?: number;
  breakEvenTimeline?: string;
}

export interface FailSafeProtocol {
  triggerCondition: string;
  immediateAction: string;
  severity?: 'Kritik' | 'Yüksek' | 'Orta';
  activated?: boolean;
}

export interface DecisionNode {
  id: string;
  title: string;
  action: string;
  branchCondition: string;
  probability: number;
  payoff: number;
  children?: DecisionNode[];
}

export interface OperationalArtifact {
  id: string;
  title: string;
  type: 'legal_agreement' | 'formal_notice' | 'financial_compromise' | 'boundary_protocol';
  summary: string;
  rawDocument: string;
}

export interface ResolutionData {
  id?: string;
  createdAt?: string;
  title: string;
  executiveSummary: string;
  rootCauses: string[];
  options: StrategicOption[];
  actionRoadmap: {
    phase1: RoadmapPhase;
    phase2: RoadmapPhase;
    phase3: RoadmapPhase;
  };
  failSafeProtocols: FailSafeProtocol[];
  decisionRule: string;
  originalProblem?: string;
  category?: CategoryId;
  urgency?: UrgencyLevel;
  decisionTree?: DecisionNode[];
  artifacts?: OperationalArtifact[];
  baselineMetrics?: {
    overallSuccessProb: number;
    riskIndex: number;
    clarityScore: number;
  };
}

export interface SensitivityState {
  riskTolerance: number;
  timePressure: number;
  conflictTolerance: number;
  capitalBuffer: number;
}

export interface WarRoomTurn {
  id: string;
  userStatement: string;
  stakeholderResponse: string;
  stakeholderArchetype: string;
  resistancePercent: number;
  psychologicalLeverage: 'Zayıf' | 'Dengeli' | 'Hakim';
  tacticalCounterMove: string;
}

// Practical Human Utility Types
export interface MessageCraftResult {
  headline: string;
  whatsappMessage: string;
  emailVersion: string;
  goldenRules: string[];
  ifTheyResist: string;
}

export interface DilemmaResult {
  winner: 'A' | 'B';
  verdictSummary: string;
  regretProbabilityA: number;
  regretProbabilityB: number;
  decisiveFactor: string;
  immediateAction: string;
}

export interface QuickRescueResult {
  headline: string;
  fiveMinuteStep: string;
  whatToDropImmediately: string;
  scriptToSend: string;
  mindsetRule: string;
}

export interface VerbalCounterResult {
  exactCounterWords: string;
  vocalTone: string;
  psychologicalEffect: string;
  whatNeverToSay: string;
}
