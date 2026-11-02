import React from 'react';
import { InvestmentProject, FinancialCalculationResult, AIDiagnostic } from '../types/finance';
import { Printer, Download, FileSpreadsheet, ShieldCheck, CheckCircle, Calendar, Building, DollarSign } from 'lucide-react';
import { exportCalculationToCSV, exportProjectToJSON } from '../utils/fileImportExport';

interface ExecutiveReportProps {
  project: InvestmentProject;
  calc: FinancialCalculationResult;
  diagnostic: AIDiagnostic | null;
}

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ project, calc, diagnostic }) => {
  const curr = project.currency;
  const pLabel = project.periodType === 'monthly' ? 'meses' : project.periodType === 'quarterly' ? 'trimestres' : 'años';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden in Print) */}
      <div className="print:hidden bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Informe Financiero Ejecutivo Descargable e Imprimible
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dossier formal estructurado para comités de inversión, juntas directivas o entidades financieras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportCalculationToCSV(project, calc)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => exportProjectToJSON(project)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE DOSSIER SHEET */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/90 shadow-sm print:shadow-none print:border-none print:p-0 space-y-8 font-sans text-slate-800">
        {/* Document Header */}
        <div className="border-b-2 border-emerald-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-700 inline-block"></span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-800 font-mono">
                FINANCIA IA • EVALUACIÓN DE INVERSIONES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Informe de Evaluación Financiera
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Proyecto: {project.name}
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1">
            <p className="font-mono">Fecha: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="font-mono">Sector: {project.sector || 'Corporativo'}</p>
            <p className="font-mono">Moneda: {curr}</p>
          </div>
        </div>

        {/* Executive Summary & Verdict Banner */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              1. Dictamen y Resumen Ejecutivo
            </h3>
            {diagnostic && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                diagnostic.verdict === 'APROBADO'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : diagnostic.verdict === 'CONDICIONADO'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                VEREDICTO: {diagnostic.verdict} (Score: {diagnostic.financialScore}/100)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {diagnostic?.executiveSummary ||
              `El proyecto "${project.name}" fue evaluado con una inversión inicial de ${curr} ${calc.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })} y una tasa de descuento anual del ${(calc.effectiveAnnualRate * 100).toFixed(2)}%. Genera un Valor Presente Neto (VPN) de ${curr} ${calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })} y una TIR de ${calc.irr !== null ? (calc.irr * 100).toFixed(2) + '%' : 'N/A'}.`}
          </p>
        </div>

        {/* Master Indicators Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            2. Indicadores Financieros Cuantitativos
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Indicador</th>
                  <th className="py-2.5 px-4">Valor Calculado</th>
                  <th className="py-2.5 px-4">Referencia / TMAR</th>
                  <th className="py-2.5 px-4">Interpretación Financiera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Valor Presente Neto (VPN / VAN)</td>
                  <td className={`py-2.5 px-4 font-bold text-sm ${calc.npv > 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {curr} {calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">&gt; 0</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    {calc.npv > 0 ? 'Genera valor económico agregado.' : 'No cubre el costo de capital exigido.'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Tasa Interna de Retorno (TIR)</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {calc.irr !== null ? `${(calc.irr * 100).toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">{(calc.periodicRate * 100).toFixed(2)}% (k periódica)</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    {calc.irr !== null && calc.irr > calc.periodicRate ? 'Rentabilidad superior a la tasa de corte.' : 'Rentabilidad insuficiente o indeterminada.'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">TIR Modificada (TIRM)</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {calc.mirr !== null ? `${(calc.mirr * 100).toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">{(calc.periodicRate * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    Reinversión de flujos a la tasa de costo de capital.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">PRI Descontado (Payback)</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {calc.discountedPaybackPeriod !== null ? `${calc.discountedPaybackPeriod.toFixed(2)} ${pLabel}` : 'No recupera'}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">&le; {project.horizon} {pLabel}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    {calc.discountedPaybackPeriod !== null ? 'Recupera el capital ajustado por valor presente.' : 'Riesgo alto de iliquidez en el horizonte.'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Relación Beneficio / Costo (B/C)</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {calc.benefitCostRatio.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">&gt; 1,00</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    Retorno actualizado por cada unidad monetaria de costo.
                  </td>
                </tr>
                {calc.breakEven && (
                  <tr>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Punto de Equilibrio Operativo</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {calc.breakEven.units.toFixed(0)} uds ({curr} {calc.breakEven.sales.toLocaleString('es-ES', { maximumFractionDigits: 0 })})
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Margen Seg.: {(calc.breakEven.safetyMargin * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      Ventas requeridas para absorber costos fijos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash Flow Schedule */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            3. Cronograma de Flujos de Fondos y Amortización
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Período</th>
                  <th className="py-2 px-3 text-right">Flujo Nominal ({curr})</th>
                  <th className="py-2 px-3 text-center">Factor (1+k)⁻ᵗ</th>
                  <th className="py-2 px-3 text-right">Flujo Descontado ({curr})</th>
                  <th className="py-2 px-3 text-right">Saldo Acumulado Descontado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {calc.periodSteps.map((step) => (
                  <tr key={step.period} className={step.period === 0 ? 'bg-amber-50/40 font-bold' : ''}>
                    <td className="py-2 px-3 font-sans">
                      {step.period === 0 ? 't=0 (Desembolso Inicial)' : `${project.periodType === 'monthly' ? 'Mes' : 'Año'} ${step.period}`}
                    </td>
                    <td className={`py-2 px-3 text-right ${step.nominalFlow < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {step.nominalFlow.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500">
                      {step.discountFactor.toFixed(6)}
                    </td>
                    <td className={`py-2 px-3 text-right ${step.discountedFlow < 0 ? 'text-rose-600' : 'text-emerald-800 font-bold'}`}>
                      {step.discountedFlow.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${step.cumulativeDiscounted >= 0 ? 'text-emerald-800' : 'text-slate-500'}`}>
                      {step.cumulativeDiscounted.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conclusions and Recommendations */}
        {diagnostic && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              4. Conclusiones y Recomendaciones Estratégicas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Fortalezas Identificadas:</span>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {diagnostic.strengths.slice(0, 3).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Riesgos y Mitigantes:</span>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {diagnostic.weaknesses.slice(0, 3).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Signatures Section for Executive Sign-off */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-3 gap-8 text-center text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              Evaluador de Inversiones
            </div>
            <p className="text-[10px] text-slate-400">Analista Financiero Senior</p>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              Dirección Financiera (CFO)
            </div>
            <p className="text-[10px] text-slate-400">Aprobación de Supuestos</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              Comité de Inversiones
            </div>
            <p className="text-[10px] text-slate-400">Visto Bueno de Asignación</p>
          </div>
        </div>
      </div>
    </div>
  );
};
