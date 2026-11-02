import {
  InvestmentProject,
  FinancialCalculationResult,
  PeriodCalculationStep,
  BreakEvenResult,
  AIDiagnostic,
  PeriodType,
} from '../types/finance';

/**
 * Returns the number of periods per year for a given frequency.
 */
export function getPeriodsPerYear(periodType: PeriodType): number {
  switch (periodType) {
    case 'annual':
      return 1;
    case 'semiannual':
      return 2;
    case 'quarterly':
      return 4;
    case 'monthly':
      return 12;
    default:
      return 1;
  }
}

/**
 * Converts discount rate percentage into periodic discount rate, effective annual rate, and nominal annual rate.
 */
export function calculateRates(
  discountRatePercent: number,
  rateType: 'effective' | 'nominal',
  periodType: PeriodType,
  nominalCompounding: PeriodType = periodType
): { periodicRate: number; effectiveAnnualRate: number; nominalAnnualRate: number } {
  const rDecimal = discountRatePercent / 100;
  const m = getPeriodsPerYear(periodType);
  const c = getPeriodsPerYear(nominalCompounding);

  let periodicRate: number;
  let effectiveAnnualRate: number;
  let nominalAnnualRate: number;

  if (rateType === 'effective') {
    // Input is Effective Annual Rate (TEA / EAR)
    effectiveAnnualRate = rDecimal;
    // Periodic rate: (1 + TEA)^(1/m) - 1
    periodicRate = Math.pow(1 + effectiveAnnualRate, 1 / m) - 1;
    // Nominal rate with project periodicity:
    nominalAnnualRate = periodicRate * m;
  } else {
    // Input is Nominal Annual Rate (TNA / NAR)
    nominalAnnualRate = rDecimal;
    // Compounding per year is c times:
    const compoundingRate = nominalAnnualRate / c;
    // Effective Annual Rate: (1 + r/c)^c - 1
    effectiveAnnualRate = Math.pow(1 + compoundingRate, c) - 1;
    // Periodic rate for project: (1 + EAR)^(1/m) - 1
    periodicRate = Math.pow(1 + effectiveAnnualRate, 1 / m) - 1;
  }

  return { periodicRate, effectiveAnnualRate, nominalAnnualRate };
}

/**
 * Counts Descartes' rule sign changes in a sequence of cash flows.
 */
export function countSignChanges(flows: number[]): number {
  let changes = 0;
  let prevSign = 0;

  for (const val of flows) {
    if (Math.abs(val) > 1e-9) {
      const currentSign = val > 0 ? 1 : -1;
      if (prevSign !== 0 && currentSign !== prevSign) {
        changes++;
      }
      prevSign = currentSign;
    }
  }
  return changes;
}

/**
 * Evaluates NPV for a given discount rate.
 */
export function evaluateNPV(cashFlows: number[], rate: number): number {
  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + rate, t);
  }
  return npv;
}

/**
 * Evaluates the first derivative of NPV with respect to discount rate.
 */
function evaluateNPVDerivative(cashFlows: number[], rate: number): number {
  let dnpv = 0;
  for (let t = 1; t < cashFlows.length; t++) {
    dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
  }
  return dnpv;
}

/**
 * Robust numerical IRR calculator using hybrid Newton-Raphson + Bisection fallback.
 */
export function calculateIRR(
  cashFlows: number[]
): {
  irr: number | null;
  status: 'CONVERGED' | 'NO_REAL_ROOT' | 'MULTIPLE_ROOTS_POSSIBLE' | 'ALL_POSITIVE_OR_NEGATIVE';
  signChanges: number;
} {
  const signChanges = countSignChanges(cashFlows);

  if (signChanges === 0) {
    return { irr: null, status: 'ALL_POSITIVE_OR_NEGATIVE', signChanges };
  }

  const maxIterations = 200;
  const tolerance = 1e-7;

  // Try multiple starting points in case of local traps
  const initialGuesses = [0.1, 0.05, 0.2, 0.35, -0.1, 0.5];

  for (const guess of initialGuesses) {
    let rate = guess;
    let converged = false;

    for (let iter = 0; iter < maxIterations; iter++) {
      if (rate <= -0.999) {
        rate = -0.99;
      }

      const npvVal = evaluateNPV(cashFlows, rate);
      if (Math.abs(npvVal) < tolerance) {
        converged = true;
        break;
      }

      const dnpv = evaluateNPVDerivative(cashFlows, rate);
      if (Math.abs(dnpv) < 1e-12) {
        break; // Newton fails, try next guess
      }

      const nextRate = rate - npvVal / dnpv;
      if (Math.abs(nextRate - rate) < tolerance) {
        rate = nextRate;
        converged = true;
        break;
      }

      // Keep within realistic financial limits
      if (nextRate < -0.99 || nextRate > 20.0) {
        break;
      }

      rate = nextRate;
    }

    if (converged && rate > -0.99 && rate < 20.0) {
      return {
        irr: rate,
        status: signChanges > 1 ? 'MULTIPLE_ROOTS_POSSIBLE' : 'CONVERGED',
        signChanges,
      };
    }
  }

  // Bisection method as fallback
  let low = -0.95;
  let high = 5.0;
  let npvLow = evaluateNPV(cashFlows, low);
  let npvHigh = evaluateNPV(cashFlows, high);

  if (npvLow * npvHigh <= 0) {
    for (let i = 0; i < 150; i++) {
      const mid = (low + high) / 2;
      const npvMid = evaluateNPV(cashFlows, mid);

      if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
        return {
          irr: mid,
          status: signChanges > 1 ? 'MULTIPLE_ROOTS_POSSIBLE' : 'CONVERGED',
          signChanges,
        };
      }

      if (npvLow * npvMid < 0) {
        high = mid;
        npvHigh = npvMid;
      } else {
        low = mid;
        npvLow = npvMid;
      }
    }
  }

  return { irr: null, status: 'NO_REAL_ROOT', signChanges };
}

/**
 * Calculates Modified Internal Rate of Return (MIRR / TIRM).
 */
export function calculateMIRR(
  cashFlows: number[],
  financeRate: number,
  reinvestmentRate: number
): number | null {
  const n = cashFlows.length - 1;
  if (n <= 0) return null;

  let pvOutflows = 0;
  let fvInflows = 0;

  for (let t = 0; t <= n; t++) {
    const cf = cashFlows[t];
    if (cf < 0) {
      pvOutflows += Math.abs(cf) / Math.pow(1 + financeRate, t);
    } else if (cf > 0) {
      fvInflows += cf * Math.pow(1 + reinvestmentRate, n - t);
    }
  }

  if (pvOutflows <= 0 || fvInflows <= 0) {
    return null;
  }

  return Math.pow(fvInflows / pvOutflows, 1 / n) - 1;
}

/**
 * Calculates Simple and Discounted Payback Periods (PRI) using linear interpolation.
 */
export function calculatePaybackPeriods(
  cashFlows: number[],
  periodicRate: number
): { simplePayback: number | null; discountedPayback: number | null } {
  let simpleCumulative = 0;
  let discountedCumulative = 0;
  let simplePayback: number | null = null;
  let discountedPayback: number | null = null;

  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t];
    const discountedCf = cf / Math.pow(1 + periodicRate, t);

    const prevSimple = simpleCumulative;
    const prevDiscounted = discountedCumulative;

    simpleCumulative += cf;
    discountedCumulative += discountedCf;

    if (t > 0) {
      // Check simple payback crossing
      if (simplePayback === null && prevSimple < 0 && simpleCumulative >= 0 && cf > 0) {
        const unrecovered = -prevSimple;
        simplePayback = (t - 1) + unrecovered / cf;
      }

      // Check discounted payback crossing
      if (discountedPayback === null && prevDiscounted < 0 && discountedCumulative >= 0 && discountedCf > 0) {
        const unrecovered = -prevDiscounted;
        discountedPayback = (t - 1) + unrecovered / discountedCf;
      }
    }
  }

  return {
    simplePayback,
    discountedPayback,
  };
}

/**
 * Calculates Benefit-Cost ratio (B/C).
 */
export function calculateBenefitCostRatio(cashFlows: number[], periodicRate: number): number {
  let pvBenefits = 0;
  let pvCosts = 0;

  // t=0 is typically initial investment (cost)
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t];
    const pv = cf / Math.pow(1 + periodicRate, t);

    if (t === 0) {
      pvCosts += Math.abs(cf);
    } else {
      if (pv > 0) {
        pvBenefits += pv;
      } else if (pv < 0) {
        pvCosts += Math.abs(pv);
      }
    }
  }

  if (pvCosts === 0) return 0;
  return pvBenefits / pvCosts;
}

/**
 * Calculates Break-even point in units and sales.
 */
export function calculateBreakEven(
  sellingPrice: number,
  variableCost: number,
  fixedCosts: number,
  expectedUnits?: number
): BreakEvenResult | undefined {
  if (sellingPrice <= 0 || fixedCosts < 0 || variableCost < 0) {
    return undefined;
  }

  const contributionMarginUnit = sellingPrice - variableCost;
  if (contributionMarginUnit <= 0) {
    return undefined; // Selling price cannot cover variable cost
  }

  const units = fixedCosts / contributionMarginUnit;
  const sales = units * sellingPrice;
  const contributionMarginRatio = contributionMarginUnit / sellingPrice;

  let safetyMargin = 0;
  if (expectedUnits && expectedUnits > 0) {
    safetyMargin = (expectedUnits - units) / expectedUnits;
  }

  return {
    units,
    sales,
    contributionMarginUnit,
    contributionMarginRatio,
    safetyMargin,
    fixedCosts,
    sellingPrice,
    variableCost,
  };
}

/**
 * Main calculation engine function for an InvestmentProject.
 */
export function evaluateProject(project: InvestmentProject): FinancialCalculationResult {
  const { periodicRate, effectiveAnnualRate, nominalAnnualRate } = calculateRates(
    project.discountRate,
    project.rateType,
    project.periodType,
    project.nominalCompounding
  );

  const m = getPeriodsPerYear(project.periodType);

  // Build clean array of cash flows starting at t=0 (-I0)
  const cashFlows: number[] = [-Math.abs(project.initialInvestment)];
  const periodSteps: PeriodCalculationStep[] = [
    {
      period: 0,
      nominalFlow: -Math.abs(project.initialInvestment),
      discountFactor: 1.0,
      discountedFlow: -Math.abs(project.initialInvestment),
      cumulativeNominal: -Math.abs(project.initialInvestment),
      cumulativeDiscounted: -Math.abs(project.initialInvestment),
    },
  ];

  let cumulativeNominal = -Math.abs(project.initialInvestment);
  let cumulativeDiscounted = -Math.abs(project.initialInvestment);

  const sortedFlows = [...project.cashFlows].sort((a, b) => a.period - b.period);

  for (const item of sortedFlows) {
    let flowValue = 0;
    if (project.flowMode === 'detailed') {
      const revenue = item.revenue ?? 0;
      const varCosts = item.variableCosts ?? 0;
      const fixedExp = item.fixedExpenses ?? 0;
      const depr = item.depreciation ?? 0;
      const taxRate = item.taxRate ?? 0.30;
      const wkCap = item.workingCapitalChange ?? 0;
      const salvage = item.salvageValue ?? 0;

      // EBIT = Revenue - VarCosts - FixedExp - Depr
      const ebit = revenue - varCosts - fixedExp - depr;
      const tax = ebit > 0 ? ebit * taxRate : 0;
      const nopat = ebit - tax;
      // Operating Cash Flow = NOPAT + Depr - WorkingCapitalChange + Salvage
      flowValue = nopat + depr - wkCap + salvage;
    } else {
      flowValue = item.netFlow;
    }

    cashFlows.push(flowValue);

    const discountFactor = 1 / Math.pow(1 + periodicRate, item.period);
    const discountedFlow = flowValue * discountFactor;

    cumulativeNominal += flowValue;
    cumulativeDiscounted += discountedFlow;

    periodSteps.push({
      period: item.period,
      nominalFlow: flowValue,
      discountFactor,
      discountedFlow,
      cumulativeNominal,
      cumulativeDiscounted,
    });
  }

  // NPV
  const npv = evaluateNPV(cashFlows, periodicRate);
  let npvStatus: 'ACCEPT' | 'REJECT' | 'INDIFFERENT' = 'INDIFFERENT';
  if (npv > 0.01) npvStatus = 'ACCEPT';
  else if (npv < -0.01) npvStatus = 'REJECT';

  // IRR
  const { irr, status: irrStatus, signChanges } = calculateIRR(cashFlows);
  const irrAnnualized = irr !== null ? Math.pow(1 + irr, m) - 1 : null;

  // MIRR
  const mirr = calculateMIRR(cashFlows, periodicRate, periodicRate);
  const mirrAnnualized = mirr !== null ? Math.pow(1 + mirr, m) - 1 : null;

  // Payback
  const { simplePayback, discountedPayback } = calculatePaybackPeriods(cashFlows, periodicRate);

  // Benefit / Cost
  const benefitCostRatio = calculateBenefitCostRatio(cashFlows, periodicRate);
  const profitabilityIndex = project.initialInvestment > 0 ? npv / project.initialInvestment : 0;

  // Break-even (if configured)
  let breakEven: BreakEvenResult | undefined;
  if (project.breakEvenConfig) {
    breakEven = calculateBreakEven(
      project.breakEvenConfig.sellingPricePerUnit,
      project.breakEvenConfig.variableCostPerUnit,
      project.breakEvenConfig.fixedCosts,
      project.breakEvenConfig.expectedUnitsSold
    );
  }

  // NPV Profile for Sensitivity Curve (rates from 0% to 50% in steps of 2%)
  const npvProfile: Array<{ rate: number; npv: number }> = [];
  for (let rPercent = 0; rPercent <= 50; rPercent += 2) {
    const rDec = rPercent / 100;
    // convert annual rate to project periodic rate
    const pRate = Math.pow(1 + rDec, 1 / m) - 1;
    npvProfile.push({
      rate: rPercent,
      npv: evaluateNPV(cashFlows, pRate),
    });
  }

  // Arrays of discounted and cumulative flows
  const discountedFlows = periodSteps.map((s) => s.discountedFlow);
  const cumulativeFlows = periodSteps.map((s) => s.cumulativeNominal);
  const cumulativeDiscountedFlows = periodSteps.map((s) => s.cumulativeDiscounted);

  return {
    initialInvestment: project.initialInvestment,
    periodicRate,
    effectiveAnnualRate,
    nominalAnnualRate,
    cashFlows,
    discountedFlows,
    cumulativeFlows,
    cumulativeDiscountedFlows,
    npv,
    npvStatus,
    irr,
    irrAnnualized,
    irrStatus,
    signChangesCount: signChanges,
    mirr,
    mirrAnnualized,
    paybackPeriod: simplePayback,
    discountedPaybackPeriod: discountedPayback,
    benefitCostRatio,
    profitabilityIndex,
    breakEven,
    periodSteps,
    npvProfile,
  };
}

/**
 * Calculates Fisher Indifference Rate between two projects.
 * That is, the discount rate at which NPV(A) = NPV(B), i.e., NPV(A - B) = 0.
 */
export function calculateFisherRate(projectA: InvestmentProject, projectB: InvestmentProject): number | null {
  const calcA = evaluateProject(projectA);
  const calcB = evaluateProject(projectB);

  const maxLen = Math.max(calcA.cashFlows.length, calcB.cashFlows.length);
  const diffFlows: number[] = [];

  for (let t = 0; t < maxLen; t++) {
    const flowA = t < calcA.cashFlows.length ? calcA.cashFlows[t] : 0;
    const flowB = t < calcB.cashFlows.length ? calcB.cashFlows[t] : 0;
    diffFlows.push(flowA - flowB);
  }

  const { irr } = calculateIRR(diffFlows);
  return irr;
}

/**
 * Fallback deterministic Expert Rule-Engine for instant financial diagnosis
 * when Gemini API is offline or unconfigured.
 */
export function generateDeterministicDiagnostic(
  project: InvestmentProject,
  calc: FinancialCalculationResult
): AIDiagnostic {
  let score = 50;

  // NPV scoring
  if (calc.npv > 0) score += 25;
  else if (calc.npv < 0) score -= 25;

  // IRR scoring vs periodic rate
  if (calc.irr !== null) {
    const spread = (calc.irr - calc.periodicRate) * 100;
    if (spread > 10) score += 15;
    else if (spread > 3) score += 10;
    else if (spread > 0) score += 5;
    else score -= 15;
  }

  // Payback scoring
  const horizon = project.horizon;
  if (calc.discountedPaybackPeriod !== null) {
    const pbRatio = calc.discountedPaybackPeriod / horizon;
    if (pbRatio <= 0.5) score += 10;
    else if (pbRatio <= 0.75) score += 5;
  } else {
    score -= 15;
  }

  // B/C scoring
  if (calc.benefitCostRatio > 1.3) score += 10;
  else if (calc.benefitCostRatio > 1.05) score += 5;
  else if (calc.benefitCostRatio < 1.0) score -= 10;

  // Clamp score
  const finalScore = Math.max(5, Math.min(98, Math.round(score)));

  let verdict: 'APROBADO' | 'CONDICIONADO' | 'RECHAZADO' = 'CONDICIONADO';
  if (finalScore >= 70 && calc.npv > 0 && (calc.irr === null || calc.irr > calc.periodicRate)) {
    verdict = 'APROBADO';
  } else if (finalScore < 45 || calc.npv < 0) {
    verdict = 'RECHAZADO';
  }

  const curr = project.currency;
  const pType = project.periodType === 'monthly' ? 'meses' : project.periodType === 'quarterly' ? 'trimestres' : 'años';

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (calc.npv > 0) {
    strengths.push(`Generación neta de valor: El proyecto crea una riqueza neta adicional de ${curr} ${calc.npv.toLocaleString('es-ES', { maximumFractionDigits: 2 })} por encima del costo de capital.`);
  } else {
    weaknesses.push(`Destrucción de valor: El VPN negativo de ${curr} ${calc.npv.toLocaleString('es-ES', { maximumFractionDigits: 2 })} indica que no se remunera el costo de oportunidad del capital invertido.`);
  }

  if (calc.irr !== null && calc.irr > calc.periodicRate) {
    strengths.push(`Rentabilidad periódica atractiva: La TIR (${(calc.irr * 100).toFixed(2)}%) supera la tasa de descuento (${(calc.periodicRate * 100).toFixed(2)}%), ofreciendo un colchón de seguridad.`);
  } else if (calc.irr !== null) {
    weaknesses.push(`Rentabilidad deficitaria: La TIR (${(calc.irr * 100).toFixed(2)}%) es inferior a la tasa de corte exigida (${(calc.periodicRate * 100).toFixed(2)}%).`);
  }

  if (calc.discountedPaybackPeriod !== null) {
    strengths.push(`Recuperación dentro del horizonte: El capital descontado se amortiza en el período ${calc.discountedPaybackPeriod.toFixed(2)} ${pType}, mitigando la exposición al riesgo a largo plazo.`);
  } else {
    weaknesses.push(`Falta de amortización: En el horizonte de ${horizon} ${pType}, los flujos descontados no alcanzan a recuperar la inversión inicial.`);
  }

  if (calc.benefitCostRatio > 1) {
    strengths.push(`Índice Beneficio/Costo favorable: Por cada ${curr} 1,00 invertido en valor presente, el proyecto genera ${curr} ${calc.benefitCostRatio.toFixed(2)} en beneficios actualizados.`);
  }

  return {
    verdict,
    financialScore: finalScore,
    executiveSummary: `El proyecto "${project.name}" presenta un dictamen de ${verdict}. Evaluado con una tasa de descuento anual de ${(calc.effectiveAnnualRate * 100).toFixed(2)}%, genera un VPN de ${curr} ${calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}${calc.irr !== null ? ` con una TIR estimada de ${(calc.irr * 100).toFixed(2)}%` : ''}. ${verdict === 'APROBADO' ? 'El proyecto es financieramente solvente y aconsejable para asignación de capital.' : verdict === 'CONDICIONADO' ? 'El proyecto requiere ajustes en estructura de costos o incremento de ingresos para afianzar su margen de seguridad.' : 'Bajo las condiciones actuales, el proyecto destruye valor económico y no se recomienda su ejecución.'}`,
    indicatorsAnalysis: {
      npvInterpretation: calc.npv > 0
        ? `El VPN es positivo (+${curr} ${calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}), lo que demuestra que los flujos futuros actualizados son superiores al desembolso inicial de ${curr} ${calc.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}.`
        : `El VPN es negativo (${curr} ${calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}), lo que implica que invertir en activos libres de riesgo a la tasa de descuento ofrecida otorgaría un mayor rendimiento neto.`,
      irrInterpretation: calc.irr !== null
        ? `La TIR calculada es de ${(calc.irr * 100).toFixed(2)}% periódica (${(calc.irrAnnualized ? (calc.irrAnnualized * 100).toFixed(2) : (calc.irr * 100).toFixed(2))}% anual). Frente a una tasa de corte del ${(calc.periodicRate * 100).toFixed(2)}%, el margen de maniobra es de ${((calc.irr - calc.periodicRate) * 100).toFixed(2)} puntos porcentuales.`
        : 'Los flujos presentan múltiples cambios de signo o carecen de cambio, lo que imposibilita una TIR única según el teorema de Descartes. Se recomienda guiar la decisión mediante el VPN y la TIRM.',
      paybackInterpretation: calc.discountedPaybackPeriod !== null
        ? `El período de recuperación simple es de ${calc.paybackPeriod ? calc.paybackPeriod.toFixed(2) : 'N/A'} períodos, mientras que considerando el valor del dinero en el tiempo (PRI Descontado), la recuperación ocurre a los ${calc.discountedPaybackPeriod.toFixed(2)} períodos.`
        : 'La inversión inicial no se recupera bajo el criterio descontado dentro del horizonte evaluado, implicando un alto riesgo de iliquidez.',
      benefitCostInterpretation: `La relación B/C se ubica en ${calc.benefitCostRatio.toFixed(3)}. ${calc.benefitCostRatio > 1 ? 'Cada unidad monetaria invertida genera un retorno de valor actual superior a 1.' : 'La inversión no genera suficiente valor para compensar costos y egresos actualizados.'}`,
    },
    strengths,
    weaknesses,
    riskEvaluation: {
      liquidityRisk: calc.discountedPaybackPeriod && calc.discountedPaybackPeriod < horizon * 0.6 ? 'Bajo' : 'Medio',
      rateSensitivityRisk: calc.irr && calc.irr - calc.periodicRate > 0.08 ? 'Bajo' : calc.irr && calc.irr > calc.periodicRate ? 'Medio' : 'Alto',
      marketRisk: 'Medio',
      riskSummary: `Sensibilidad media ante fluctuaciones en la tasa de corte. La liquidez depende de la efectividad en la cobranza de los flujos de los primeros ${Math.ceil(horizon / 2)} períodos.`,
    },
    scenariosCommentary: 'Ante una contracción del 10% en flujos netos, el proyecto experimentaría una disminución proporcional en su VPN; se recomienda evaluar coberturas de precios y reducción de costos fijos.',
    strategicRecommendations: [
      calc.npv > 0 ? 'Proceder con la estructuración formal del financiamiento bancario o de capital propio.' : 'Revisar la inversión inicial buscando optimizaciones Capex (arrendamiento financiero o fases escalonadas).',
      'Monitorear la tasa de descuento periódica frente a la inflación y el costo promedio ponderado de capital (WACC).',
      'Implementar un control riguroso del punto de equilibrio mensual para asegurar el volumen crítico de ventas.',
    ],
    source: 'fallback-engine',
  };
}
