export type PeriodType = 'annual' | 'semiannual' | 'quarterly' | 'monthly';
export type RateType = 'effective' | 'nominal';
export type FlowMode = 'direct' | 'detailed';

export interface CashFlowItem {
  period: number;
  netFlow: number;
  revenue?: number;
  variableCosts?: number;
  fixedExpenses?: number;
  depreciation?: number;
  taxRate?: number; // e.g. 0.30 for 30%
  workingCapitalChange?: number;
  salvageValue?: number; // valor residual / rescate
  notes?: string;
}

export interface BreakEvenConfig {
  sellingPricePerUnit: number;
  variableCostPerUnit: number;
  fixedCosts: number;
  expectedUnitsSold?: number;
}

export interface InvestmentProject {
  id: string;
  name: string;
  description: string;
  sector?: string;
  currency: string;
  initialInvestment: number;
  horizon: number;
  periodType: PeriodType;
  rateType: RateType;
  nominalCompounding?: PeriodType;
  discountRate: number; // Porcentaje, ej: 12%
  flowMode: FlowMode;
  cashFlows: CashFlowItem[];
  breakEvenConfig?: BreakEvenConfig;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodCalculationStep {
  period: number;
  nominalFlow: number;
  discountFactor: number;
  discountedFlow: number;
  cumulativeNominal: number;
  cumulativeDiscounted: number;
}

export interface BreakEvenResult {
  units: number;
  sales: number;
  contributionMarginUnit: number;
  contributionMarginRatio: number;
  safetyMargin: number;
  fixedCosts: number;
  sellingPrice: number;
  variableCost: number;
}

export interface FinancialCalculationResult {
  initialInvestment: number;
  periodicRate: number; // k por período en decimal
  effectiveAnnualRate: number; // TEA en decimal
  nominalAnnualRate: number; // TNA en decimal
  cashFlows: number[]; // [ -I0, FC1, FC2, ... ]
  discountedFlows: number[];
  cumulativeFlows: number[];
  cumulativeDiscountedFlows: number[];
  npv: number; // VAN / VPN
  npvStatus: 'ACCEPT' | 'REJECT' | 'INDIFFERENT';
  irr: number | null; // TIR periódica
  irrAnnualized: number | null; // TIR Anualizada
  irrStatus: 'CONVERGED' | 'NO_REAL_ROOT' | 'MULTIPLE_ROOTS_POSSIBLE' | 'ALL_POSITIVE_OR_NEGATIVE';
  signChangesCount: number;
  mirr: number | null; // TIRM periódica
  mirrAnnualized: number | null;
  paybackPeriod: number | null; // PRI simple en períodos
  discountedPaybackPeriod: number | null; // PRI descontado en períodos
  benefitCostRatio: number; // B/C
  profitabilityIndex: number; // (NPV / I0)
  breakEven?: BreakEvenResult;
  periodSteps: PeriodCalculationStep[];
  npvProfile: Array<{ rate: number; npv: number }>;
}

export interface AIDiagnostic {
  verdict: 'APROBADO' | 'CONDICIONADO' | 'RECHAZADO';
  financialScore: number; // 0 a 100
  executiveSummary: string;
  indicatorsAnalysis: {
    npvInterpretation: string;
    irrInterpretation: string;
    paybackInterpretation: string;
    benefitCostInterpretation: string;
  };
  strengths: string[];
  weaknesses: string[];
  riskEvaluation: {
    liquidityRisk: 'Bajo' | 'Medio' | 'Alto';
    rateSensitivityRisk: 'Bajo' | 'Medio' | 'Alto';
    marketRisk: 'Bajo' | 'Medio' | 'Alto';
    riskSummary: string;
  };
  scenariosCommentary: string;
  strategicRecommendations: string[];
  source: 'gemini-3.8-flash' | 'fallback-engine';
}

export interface ScenarioResult {
  pessimistic: {
    npv: number;
    irr: number | null;
    payback: number | null;
    bc: number;
    assumptions: string;
  };
  base: {
    npv: number;
    irr: number | null;
    payback: number | null;
    bc: number;
    assumptions: string;
  };
  optimistic: {
    npv: number;
    irr: number | null;
    payback: number | null;
    bc: number;
    assumptions: string;
  };
}

export interface ComparisonReport {
  bestOption: string;
  ranking: string[];
  comparativeAnalysis: string;
  capitalRationingAdvice: string;
  fischerRateNote: string;
}
