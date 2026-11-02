import React, { useState } from 'react';
import { FinancialCalculationResult, InvestmentProject } from '../types/finance';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';

interface IndicatorsPanelProps {
  project: InvestmentProject;
  calc: FinancialCalculationResult;
}

export const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ project, calc }) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState<string | null>(null);
  const [showAmortizationTable, setShowAmortizationTable] = useState(true);

  const curr = project.currency;
  const pLabel = project.periodType === 'monthly' ? 'meses' : project.periodType === 'quarterly' ? 'trimestres' : project.periodType === 'semiannual' ? 'semestres' : 'años';

  const toggleFormula = (key: string) => {
    setShowFormulaDetails(showFormulaDetails === key ? null : key);
  };

  return (
    <div className="space-y-6">
      {/* Rate and Period Summary Notice */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              Motor de Cálculo Financiero Activo
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {project.name}
          </h2>
          <p className="text-xs text-slate-400 line-clamp-1">
            {project.description || 'Evaluación cuantitativa de flujos de fondos netos e indicadores de rentabilidad.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">Tasa Descuento TEA</span>
            <span className="font-bold text-emerald-300 text-sm">
              {(calc.effectiveAnnualRate * 100).toFixed(2)}% E.A.
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Tasa Periódica ({project.periodType})</span>
            <span className="font-bold text-emerald-300 text-sm">
              {(calc.periodicRate * 100).toFixed(4)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Inversión Inicial (I₀)</span>
            <span className="font-bold text-white text-sm">
              {curr} {calc.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: VPN / VAN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            calc.npv > 0 ? 'bg-emerald-600' : calc.npv === 0 ? 'bg-amber-500' : 'bg-rose-600'
          }`} />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Valor Presente Neto (VPN)
              </span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {curr} {calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={() => toggleFormula('vpn')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Ver fórmula y procedimiento"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Criterio Financiero:</span>
            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
              calc.npv > 0
                ? 'bg-emerald-100 text-emerald-800'
                : calc.npv === 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {calc.npv > 0 ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Crea Valor
                </>
              ) : calc.npv === 0 ? (
                'Indiferente'
              ) : (
                <>
                  <XCircle className="w-3 h-3" /> Destruye Valor
                </>
              )}
            </span>
          </div>

          {showFormulaDetails === 'vpn' && (
            <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-2 animate-fadeIn">
              <p className="font-bold font-mono text-[11px]">
                VPN = -I₀ + ∑ [ FC_t / (1 + k)^t ]
              </p>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                k = {(calc.periodicRate * 100).toFixed(4)}% periódico. Si VPN &gt; 0, el proyecto remunera la tasa de oportunidad y genera una ganancia económica neta acumulada.
              </p>
            </div>
          )}
        </div>

        {/* KPI 2: TIR */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            calc.irr !== null && calc.irr > calc.periodicRate
              ? 'bg-emerald-600'
              : calc.irr !== null
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`} />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Tasa Interna de Retorno (TIR)
              </span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {calc.irr !== null ? `${(calc.irr * 100).toFixed(2)}%` : 'No aplicable'}
              </div>
            </div>
            <button
              onClick={() => toggleFormula('tir')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Ver detalles de TIR"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">TIR Anualizada:</span>
            <span className="font-mono font-semibold text-slate-800">
              {calc.irrAnnualized !== null ? `${(calc.irrAnnualized * 100).toFixed(2)}% E.A.` : 'N/A'}
            </span>
          </div>

          {calc.signChangesCount > 1 && (
            <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 flex-shrink-0" />
              <span>{calc.signChangesCount} cambios de signo (Descartes). Múltiples TIR posibles. Usar TIRM.</span>
            </div>
          )}

          {showFormulaDetails === 'tir' && (
            <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1.5 animate-fadeIn">
              <p className="font-bold font-mono text-[11px]">VPN(r) = 0</p>
              <p className="text-[11px] leading-relaxed">
                Resuelto mediante método numérico híbrido Newton-Raphson con bisección. Compara directamente contra la tasa periódica de descuento: { (calc.periodicRate * 100).toFixed(2) }%.
              </p>
            </div>
          )}
        </div>

        {/* KPI 3: PRI Descontado y Simple */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            calc.discountedPaybackPeriod !== null && calc.discountedPaybackPeriod <= project.horizon
              ? 'bg-emerald-600'
              : 'bg-amber-500'
          }`} />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Período Recuperación (PRI)
              </span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {calc.discountedPaybackPeriod !== null
                  ? `${calc.discountedPaybackPeriod.toFixed(2)} ${pLabel}`
                  : 'No recupera'}
              </div>
            </div>
            <button
              onClick={() => toggleFormula('pri')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Ver detalles de Payback"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">PRI Simple (sin desc.):</span>
            <span className="font-mono font-semibold text-slate-800">
              {calc.paybackPeriod !== null ? `${calc.paybackPeriod.toFixed(2)} ${pLabel}` : 'No recupera'}
            </span>
          </div>

          {showFormulaDetails === 'pri' && (
            <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1.5 animate-fadeIn">
              <p className="font-bold text-[11px]">PRI Simple vs Descontado:</p>
              <p className="text-[11px] leading-relaxed">
                El PRI Descontado incorpora el costo del dinero en el tiempo. Es siempre mayor o igual al PRI Simple. Se calculó por interpolación lineal continua del flujo en el período de cruce a saldo positivo.
              </p>
            </div>
          )}
        </div>

        {/* KPI 4: Relación Beneficio / Costo (B/C) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            calc.benefitCostRatio >= 1.0 ? 'bg-emerald-600' : 'bg-rose-600'
          }`} />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                Relación Beneficio / Costo
              </span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {calc.benefitCostRatio.toFixed(3)}
              </div>
            </div>
            <button
              onClick={() => toggleFormula('bc')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Ver detalles de B/C"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Índice Rentabilidad:</span>
            <span className={`font-mono font-semibold ${calc.profitabilityIndex >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {(calc.profitabilityIndex * 100).toFixed(1)}% (VPN/I₀)
            </span>
          </div>

          {showFormulaDetails === 'bc' && (
            <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1.5 animate-fadeIn">
              <p className="font-bold font-mono text-[11px]">B/C = VP(Beneficios) / VP(Costos)</p>
              <p className="text-[11px] leading-relaxed">
                Un ratio de {calc.benefitCostRatio.toFixed(3)} significa que por cada {curr} 1,00 invertido en valor presente, el proyecto genera {curr} {calc.benefitCostRatio.toFixed(3)} en ingresos actualizados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Indicators Row: TIRM & Punto de Equilibrio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TIRM Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-700" />
              <h4 className="text-sm font-bold text-slate-900">TIR Modificada (TIRM)</h4>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Solución a reinversión realista
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">TIRM Periódica:</span>
              <div className="text-xl font-bold font-mono text-emerald-700">
                {calc.mirr !== null ? `${(calc.mirr * 100).toFixed(2)}%` : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500">TIRM Anualizada:</span>
              <div className="text-xl font-bold font-mono text-slate-800">
                {calc.mirrAnnualized !== null ? `${(calc.mirrAnnualized * 100).toFixed(2)}% E.A.` : 'N/A'}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
            La TIRM asume que los flujos positivos intermedios se reinvierten a la tasa de costo de capital ({(calc.effectiveAnnualRate * 100).toFixed(2)}%), corrigiendo el sesgo de la TIR clásica que supone reinversión a la misma tasa de retorno elevada.
          </p>
        </div>

        {/* Punto de Equilibrio Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <h4 className="text-sm font-bold text-slate-900">Punto de Equilibrio Operativo</h4>
            </div>
            {calc.breakEven ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                Datos Configurados
              </span>
            ) : (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                No configurado
              </span>
            )}
          </div>

          {calc.breakEven ? (
            <div className="py-2 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500">Unidades Críticas (Qe):</span>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {calc.breakEven.units.toLocaleString('es-ES', { maximumFractionDigits: 0 })} uds
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Ventas Críticas (Ve):</span>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {curr} {calc.breakEven.sales.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Margen de Seguridad:</span>
                <span className={`font-mono font-bold ${calc.breakEven.safetyMargin > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {(calc.breakEven.safetyMargin * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 italic">
              Configura el precio unitario, costo variable y costos fijos en el formulario del proyecto para calcular el umbral de rentabilidad operativa.
            </p>
          )}

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
            Fórmula: Qe = Costos Fijos / (Precio - Costo Variable Unitario). Determina el volumen de ventas mínimo para no generar pérdidas operativas.
          </p>
        </div>
      </div>

      {/* Step-by-Step Discount Amortization Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowAmortizationTable(!showAmortizationTable)}
          className="w-full p-4 flex items-center justify-between text-left bg-slate-50/80 hover:bg-slate-100/80 transition-colors border-b border-slate-200/80"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Desglose Matemático Período a Período (Flujos Actualizados)
            </h4>
            <span className="text-xs text-slate-500 hidden sm:inline">
              ({calc.periodSteps.length} registros calculados)
            </span>
          </div>
          {showAmortizationTable ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showAmortizationTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Período (t)</th>
                  <th className="py-3 px-4 text-right">Flujo Nominal ({curr})</th>
                  <th className="py-3 px-4 text-center font-mono">Factor Descuento (1+k)⁻ᵗ</th>
                  <th className="py-3 px-4 text-right">Flujo Descontado ({curr})</th>
                  <th className="py-3 px-4 text-right">Acumulado Nominal</th>
                  <th className="py-3 px-4 text-right">Acumulado Descontado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {calc.periodSteps.map((step) => {
                  const isInitial = step.period === 0;
                  const isRecoveredNom = step.cumulativeNominal >= 0;
                  const isRecoveredDesc = step.cumulativeDiscounted >= 0;

                  return (
                    <tr
                      key={step.period}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isInitial ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                        {isInitial ? '0 (Inversión Inicial)' : `${step.period} (${project.periodType === 'monthly' ? 'Mes' : 'Año'} ${step.period})`}
                      </td>
                      <td className={`py-2.5 px-4 text-right ${step.nominalFlow < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {step.nominalFlow.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500">
                        {step.discountFactor.toFixed(6)}
                      </td>
                      <td className={`py-2.5 px-4 text-right ${step.discountedFlow < 0 ? 'text-rose-600' : 'text-emerald-700 font-semibold'}`}>
                        {step.discountedFlow.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 px-4 text-right ${isRecoveredNom ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                        {step.cumulativeNominal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 px-4 text-right ${isRecoveredDesc ? 'text-emerald-800 font-bold bg-emerald-50/40' : 'text-slate-500'}`}>
                        {step.cumulativeDiscounted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                <tr>
                  <td className="py-3 px-4 font-sans text-slate-900">TOTAL / VPN FINAL</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {calc.periodSteps.reduce((acc, s) => acc + s.nominalFlow, 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">—</td>
                  <td className={`py-3 px-4 text-right font-mono text-sm ${calc.npv > 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {curr} {calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">—</td>
                  <td className={`py-3 px-4 text-right font-mono text-sm ${calc.npv > 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {curr} {calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
