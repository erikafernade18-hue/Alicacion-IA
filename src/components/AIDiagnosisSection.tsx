import React, { useState } from 'react';
import { InvestmentProject, FinancialCalculationResult, AIDiagnostic } from '../types/finance';
import { evaluateNPV, calculateIRR, calculatePaybackPeriods } from '../utils/financialEngine';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Activity,
  Layers,
  Send,
  CheckCircle,
  Clock,
  Scale,
  RefreshCw,
  Lightbulb,
  Sliders,
  DollarSign,
  MessageSquare,
  Bot,
  User,
} from 'lucide-react';

interface AIDiagnosisSectionProps {
  project: InvestmentProject;
  calc: FinancialCalculationResult;
  diagnostic: AIDiagnostic | null;
  loading: boolean;
  onRunDiagnostic: () => void;
}

export const AIDiagnosisSection: React.FC<AIDiagnosisSectionProps> = ({
  project,
  calc,
  diagnostic,
  loading,
  onRunDiagnostic,
}) => {
  // Scenario simulation state
  const [pessimisticPct, setPessimisticPct] = useState<number>(-15);
  const [optimisticPct, setOptimisticPct] = useState<number>(15);

  // Chat consultation state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hola, soy tu asesor de inversiones de FINANCIA IA. He analizado el proyecto "${project.name}". El proyecto presenta un VPN de ${project.currency} ${calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })} y una TIR de ${calc.irr !== null ? (calc.irr * 100).toFixed(2) + '%' : 'N/A'}. ¿Qué aspecto financiero te gustaría profundizar o simular?`,
    },
  ]);
  const [userPrompt, setUserPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const curr = project.currency;

  // Real-time Scenario calculations
  const calculateScenario = (percentChange: number) => {
    const factor = 1 + percentChange / 100;
    const modifiedFlows = calc.cashFlows.map((flow, idx) => {
      if (idx === 0) return flow; // I0 unchanged
      return flow * factor;
    });

    const scenNpv = evaluateNPV(modifiedFlows, calc.periodicRate);
    const { irr: scenIrr } = calculateIRR(modifiedFlows);
    const { discountedPayback: scenPb } = calculatePaybackPeriods(modifiedFlows, calc.periodicRate);

    return {
      npv: scenNpv,
      irr: scenIrr,
      payback: scenPb,
    };
  };

  const pessimisticScenario = calculateScenario(pessimisticPct);
  const baseScenario = {
    npv: calc.npv,
    irr: calc.irr,
    payback: calc.discountedPaybackPeriod,
  };
  const optimisticScenario = calculateScenario(optimisticPct);

  // Handle chat submit
  const handleSendChat = async (questionText?: string) => {
    const query = questionText || userPrompt;
    if (!query.trim() || chatLoading) return;

    const newHistory = [...chatMessages, { role: 'user' as const, text: query }];
    setChatMessages(newHistory);
    setUserPrompt('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          projectData: project,
          calculations: calc,
          conversationHistory: chatMessages.slice(-6),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor.');
      }

      const data = await response.json();
      setChatMessages([
        ...newHistory,
        { role: 'assistant', text: data.reply || 'Sin respuesta.' },
      ]);
    } catch (err: any) {
      // Local fallback financial response
      let localReply = '';
      if (query.toLowerCase().includes('tasa') || query.toLowerCase().includes('descuento')) {
        localReply = `Actualmente tu tasa periódica de descuento es de ${(calc.periodicRate * 100).toFixed(2)}% (${(calc.effectiveAnnualRate * 100).toFixed(2)}% anual). ${calc.irr !== null && calc.irr > calc.periodicRate ? `Dado que la TIR es ${(calc.irr * 100).toFixed(2)}%, tienes un margen de seguridad de ${((calc.irr - calc.periodicRate) * 100).toFixed(2)} puntos porcentuales antes de que el VPN caiga a cero.` : 'La TIR actual es inferior o muy cercana a la tasa de descuento, por lo que cualquier aumento adicional de tasa erosionaría la viabilidad.'}`;
      } else if (query.toLowerCase().includes('deuda') || query.toLowerCase().includes('financiar')) {
        localReply = `Financiar parte de la inversión inicial de ${curr} ${calc.initialInvestment.toLocaleString()} con deuda puede mejorar la rentabilidad sobre fondos propios (ROE) debido al escudo fiscal de los intereses, siempre que el costo de la deuda después de impuestos sea inferior a la TIR del proyecto.`;
      } else {
        localReply = `Para el proyecto "${project.name}", con un VPN de ${curr} ${calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })} y B/C de ${calc.benefitCostRatio.toFixed(3)}, la prioridad estratégica debe ser resguardar los flujos netos proyectados y controlar la inversión inicial para asegurar la amortización en el horizonte previsto.`;
      }

      setChatMessages([
        ...newHistory,
        { role: 'assistant', text: localReply },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sampleQuestions = [
    '¿Qué pasa si la tasa de descuento sube 2 puntos?',
    '¿Es conveniente financiar el 50% con crédito bancario?',
    '¿Cuál es la principal debilidad y riesgo de este proyecto?',
    '¿Cómo podemos optimizar el período de recuperación (PRI)?',
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-semibold border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              IA Financiera Predictiva
            </span>
            {diagnostic && (
              <span className="text-[11px] text-slate-400 font-mono">
                {diagnostic.source === 'gemini-3.8-flash' ? 'Grounded en Gemini 3.8 Flash' : 'Motor Financiero Experto'}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Auditoría y Diagnóstico Financiero Estratégico
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nuestra IA analiza los indicadores matemáticos calculados (VPN, TIR, PRI, B/C y equilibrio) para generar un veredicto formal de inversión, evaluación de riesgos y plan de contingencia.
          </p>
        </div>

        <button
          onClick={onRunDiagnostic}
          disabled={loading}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analizando Proyecto...' : diagnostic ? 'Regenerar Diagnóstico' : 'Generar Diagnóstico IA'}</span>
        </button>
      </div>

      {diagnostic && (
        <>
          {/* Executive Verdict and Score Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Verdict Card */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Veredicto del Comité de Inversión
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                    diagnostic.verdict === 'APROBADO'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : diagnostic.verdict === 'CONDICIONADO'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {diagnostic.verdict === 'APROBADO' && <ShieldCheck className="w-4 h-4" />}
                    {diagnostic.verdict === 'CONDICIONADO' && <AlertTriangle className="w-4 h-4" />}
                    {diagnostic.verdict === 'RECHAZADO' && <XCircle className="w-4 h-4" />}
                    {diagnostic.verdict}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-base font-bold text-slate-900">
                    Dictamen Ejecutivo
                  </h4>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {diagnostic.executiveSummary}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
                <span>Inversión: {curr} {calc.initialInvestment.toLocaleString()}</span>
                <span>VPN: {curr} {calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                <span>TIR: {calc.irr !== null ? (calc.irr * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
            </div>

            {/* Score Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Índice de Salud Financiera
              </span>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
                  <div
                    className={`absolute inset-0 rounded-full border-8 transition-all ${
                      diagnostic.financialScore >= 70
                        ? 'border-emerald-600'
                        : diagnostic.financialScore >= 45
                        ? 'border-amber-500'
                        : 'border-rose-600'
                    }`}
                    style={{
                      clipPath: `polygon(50% 50%, 0 0, 0 100%, ${diagnostic.financialScore > 50 ? '100% 100%, 100% 0,' : ''} 50% 0)`,
                    }}
                  />
                  <div className="text-center z-10">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {diagnostic.financialScore}
                    </span>
                    <span className="text-[11px] block text-slate-400 font-semibold">/ 100</span>
                  </div>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-700">
                {diagnostic.financialScore >= 75
                  ? 'Proyecto Muy Sólido y Rentable'
                  : diagnostic.financialScore >= 50
                  ? 'Viabilidad Moderada / Con Riesgos'
                  : 'Alto Riesgo o Pérdida de Valor'}
              </p>
            </div>
          </div>

          {/* Indicator Interpretations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Interpretación Cualitativa de Indicadores Clave
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Valor Presente Neto (VPN / VAN)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {diagnostic.indicatorsAnalysis.npvInterpretation}
                </p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Tasa Interna de Retorno (TIR vs WACC)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {diagnostic.indicatorsAnalysis.irrInterpretation}
                </p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Período de Recuperación (PRI Simple y Descontado)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {diagnostic.indicatorsAnalysis.paybackInterpretation}
                </p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  Relación Beneficio / Costo (B/C)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {diagnostic.indicatorsAnalysis.benefitCostInterpretation}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Fortalezas Financieras del Proyecto
              </h4>
              <ul className="space-y-2.5">
                {diagnostic.strengths.map((str, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses / Risks */}
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Debilidades y Puntos Críticos de Alerta
              </h4>
              <ul className="space-y-2.5">
                {diagnostic.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Evaluation Meters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Matriz de Riesgos Financieros
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500">Riesgo de Liquidez / Flujo</span>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold font-mono ${
                    diagnostic.riskEvaluation.liquidityRisk === 'Bajo' ? 'text-emerald-700' : diagnostic.riskEvaluation.liquidityRisk === 'Medio' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {diagnostic.riskEvaluation.liquidityRisk}
                  </span>
                  <div className="flex gap-1">
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.liquidityRisk === 'Bajo' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.liquidityRisk === 'Medio' ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.liquidityRisk === 'Alto' ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500">Sensibilidad de Tasa (WACC)</span>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold font-mono ${
                    diagnostic.riskEvaluation.rateSensitivityRisk === 'Bajo' ? 'text-emerald-700' : diagnostic.riskEvaluation.rateSensitivityRisk === 'Medio' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {diagnostic.riskEvaluation.rateSensitivityRisk}
                  </span>
                  <div className="flex gap-1">
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.rateSensitivityRisk === 'Bajo' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.rateSensitivityRisk === 'Medio' ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.rateSensitivityRisk === 'Alto' ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500">Riesgo de Mercado y Ventas</span>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold font-mono ${
                    diagnostic.riskEvaluation.marketRisk === 'Bajo' ? 'text-emerald-700' : diagnostic.riskEvaluation.marketRisk === 'Medio' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {diagnostic.riskEvaluation.marketRisk}
                  </span>
                  <div className="flex gap-1">
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.marketRisk === 'Bajo' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.marketRisk === 'Medio' ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <span className={`w-3 h-3 rounded ${diagnostic.riskEvaluation.marketRisk === 'Alto' ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {diagnostic.riskEvaluation.riskSummary}
            </p>
          </div>

          {/* Strategic Recommendations Checklist */}
          <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-sm border border-emerald-900/60 space-y-4">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Recomendaciones Estratégicas y Plan de Acción
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {diagnostic.strategicRecommendations.map((rec, i) => (
                <div key={i} className="p-4 bg-emerald-900/40 rounded-xl border border-emerald-800/60 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-emerald-200 font-bold font-mono text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Real-time Scenario Sensitivity Simulator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Simulación de Escenarios Financieros (Sensibilidad Editable)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Evalúa la resiliencia del proyecto recalculando matemáticamente el VPN, TIR y PRI ante choques positivos y negativos.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-rose-600 font-bold">Pesimista:</span>
              <input
                type="number"
                value={pessimisticPct}
                onChange={(e) => setPessimisticPct(parseFloat(e.target.value) || -15)}
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-bold"
              />
              <span>%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700 font-bold">Optimista:</span>
              <input
                type="number"
                value={optimisticPct}
                onChange={(e) => setOptimisticPct(parseFloat(e.target.value) || 15)}
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-bold"
              />
              <span>%</span>
            </div>
          </div>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pessimistic */}
          <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                Escenario Pesimista ({pessimisticPct}%)
              </span>
              <span className="text-[11px] text-rose-600 font-mono font-medium">Contracción</span>
            </div>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">VPN:</span>
                <span className={`font-bold ${pessimisticScenario.npv > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {curr} {pessimisticScenario.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">TIR:</span>
                <span className="font-semibold text-slate-800">
                  {pessimisticScenario.irr !== null ? `${(pessimisticScenario.irr * 100).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PRI Descontado:</span>
                <span className="font-semibold text-slate-800">
                  {pessimisticScenario.payback !== null ? `${pessimisticScenario.payback.toFixed(2)} períodos` : 'No recupera'}
                </span>
              </div>
            </div>
          </div>

          {/* Base */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Escenario Base (0%)
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-medium">Premisas Actuales</span>
            </div>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">VPN:</span>
                <span className={`font-bold ${baseScenario.npv > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {curr} {baseScenario.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">TIR:</span>
                <span className="font-semibold text-slate-800">
                  {baseScenario.irr !== null ? `${(baseScenario.irr * 100).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PRI Descontado:</span>
                <span className="font-semibold text-slate-800">
                  {baseScenario.payback !== null ? `${baseScenario.payback.toFixed(2)} períodos` : 'No recupera'}
                </span>
              </div>
            </div>
          </div>

          {/* Optimistic */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Escenario Optimista (+{optimisticPct}%)
              </span>
              <span className="text-[11px] text-emerald-600 font-mono font-medium">Expansión</span>
            </div>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">VPN:</span>
                <span className={`font-bold ${optimisticScenario.npv > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {curr} {optimisticScenario.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">TIR:</span>
                <span className="font-semibold text-slate-800">
                  {optimisticScenario.irr !== null ? `${(optimisticScenario.irr * 100).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PRI Descontado:</span>
                <span className="font-semibold text-slate-800">
                  {optimisticScenario.payback !== null ? `${optimisticScenario.payback.toFixed(2)} períodos` : 'No recupera'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive AI Financial Advisor Chat */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Consultoría Financiera Directa con FINANCIA IA
              </h4>
              <p className="text-[11px] text-slate-500">
                Haz preguntas específicas sobre la estructura de capital, costo de oportunidad o sensibilidad de tu proyecto.
              </p>
            </div>
          </div>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(q)}
              className="text-[11px] bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors text-left"
            >
              💡 {q}
            </button>
          ))}
        </div>

        {/* Chat message history */}
        <div className="max-h-80 overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] text-xs rounded-2xl p-3 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-800 text-white rounded-br-none shadow-xs font-medium'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center flex-shrink-0 text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
              <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Analizando y calculando respuesta financiera...</span>
            </div>
          )}
        </div>

        {/* Input input bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendChat();
            }}
            placeholder="Escribe tu consulta financiera (ej: ¿Cómo influye una tasa de descuento del 16%?)..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
          <button
            onClick={() => handleSendChat()}
            disabled={!userPrompt.trim() || chatLoading}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consultar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
