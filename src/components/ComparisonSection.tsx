import React, { useState } from 'react';
import { InvestmentProject, FinancialCalculationResult, ComparisonReport } from '../types/finance';
import { evaluateProject, calculateFisherRate } from '../utils/financialEngine';
import {
  Scale,
  Award,
  Sparkles,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface ComparisonSectionProps {
  projects: InvestmentProject[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    projects.slice(0, 3).map((p) => p.id)
  );
  const [aiReport, setAiReport] = useState<ComparisonReport | null>(null);
  const [comparingAI, setComparingAI] = useState(false);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        alert('Debes mantener al menos 2 proyectos para comparar.');
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert('Puedes comparar un máximo de 4 proyectos simultáneamente.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedProjects = projects.filter((p) => selectedIds.includes(p.id));
  const evaluatedList = selectedProjects.map((p) => ({
    project: p,
    calc: evaluateProject(p),
  }));

  // Calculate Fisher Rate between first two selected projects if available
  const fisherRate =
    selectedProjects.length >= 2
      ? calculateFisherRate(selectedProjects[0], selectedProjects[1])
      : null;

  const handleCompareWithAI = async () => {
    if (selectedProjects.length < 2) return;
    setComparingAI(true);

    try {
      const payload = evaluatedList.map((item) => ({
        projectData: item.project,
        calculations: item.calc,
      }));

      const res = await fetch('/api/gemini/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: payload }),
      });

      if (!res.ok) throw new Error('Error al comparar con IA');
      const data = await res.json();
      setAiReport(data.comparison);
    } catch {
      // Deterministic comparison fallback
      const sortedByNpv = [...evaluatedList].sort((a, b) => b.calc.npv - a.calc.npv);
      const best = sortedByNpv[0];

      setAiReport({
        bestOption: best.project.name,
        ranking: sortedByNpv.map((item, idx) => `${idx + 1}°: ${item.project.name} (VPN: ${item.project.currency} ${item.calc.npv.toLocaleString('es-ES', { maximumFractionDigits: 0 })})`),
        comparativeAnalysis: `Bajo el criterio de maximización de valor presente neto (VPN), "${best.project.name}" se posiciona como la opción superior al generar ${best.project.currency} ${best.calc.npv.toLocaleString('es-ES', { maximumFractionDigits: 2 })} de riqueza neta con una TIR del ${(best.calc.irr ? (best.calc.irr * 100).toFixed(2) + '%' : 'N/A')}.`,
        capitalRationingAdvice: 'Si los proyectos son mutuamente excluyentes, debe seleccionarse estrictamente el de mayor VPN. Si existe restricción de capital presupuestario, evaluar la relación Beneficio/Costo (B/C) y el índice de rentabilidad para conformar la cartera óptima.',
        fischerRateNote: fisherRate !== null
          ? `La tasa de corte de Fisher entre "${selectedProjects[0].name}" y "${selectedProjects[1].name}" se sitúa en ${(fisherRate * 100).toFixed(2)}%. A tasas de descuento inferiores a este umbral, el proyecto de mayor escala es preferible.`
          : 'No se detectó cruce de Fisher en el rango evaluado.',
      });
    } finally {
      setComparingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            Matriz Comparativa de Proyectos de Inversión
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compara simultáneamente hasta 4 alternativas de inversión para apoyar la decisión de asignación de capital.
          </p>
        </div>

        <button
          onClick={handleCompareWithAI}
          disabled={comparingAI || selectedProjects.length < 2}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${comparingAI ? 'animate-spin' : ''}`} />
          <span>{comparingAI ? 'Analizando con IA...' : 'Dictamen Comparativo IA'}</span>
        </button>
      </div>

      {/* Project Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-2">Seleccionar para comparar:</span>
        {projects.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Comparative Cards / Table */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[700px]">
          {evaluatedList.map(({ project, calc }, idx) => {
            const isCurrent = project.id === currentProjectId;
            const isBestNpv = evaluatedList.every((item) => calc.npv >= item.calc.npv);

            return (
              <div
                key={project.id}
                className={`bg-white rounded-2xl p-5 border relative flex flex-col justify-between transition-all ${
                  isCurrent ? 'ring-2 ring-emerald-600 shadow-md' : 'border-slate-200/90 shadow-xs'
                }`}
              >
                {isBestNpv && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
                    <Award className="w-3 h-3" /> Mayor VPN
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">Opción #{idx + 1}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Proyecto Activo
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-1 line-clamp-1" title={project.name}>
                    {project.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {project.description || 'Sin descripción'}
                  </p>

                  {/* Metrics list */}
                  <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">Inversión (I₀):</span>
                      <span className="font-bold text-slate-900">
                        {project.currency} {calc.initialInvestment.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">Tasa Descuento:</span>
                      <span className="text-slate-700 font-semibold">
                        {(calc.effectiveAnnualRate * 100).toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans font-semibold">VPN / VAN:</span>
                      <span className={`font-extrabold ${calc.npv > 0 ? 'text-emerald-700 text-sm' : 'text-rose-600 text-sm'}`}>
                        {project.currency} {calc.npv.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">TIR:</span>
                      <span className="font-bold text-slate-900">
                        {calc.irr !== null ? `${(calc.irr * 100).toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">TIRM:</span>
                      <span className="text-slate-700">
                        {calc.mirr !== null ? `${(calc.mirr * 100).toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">PRI Descontado:</span>
                      <span className="text-slate-700">
                        {calc.discountedPaybackPeriod !== null
                          ? `${calc.discountedPaybackPeriod.toFixed(2)} períodos`
                          : 'No recupera'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">Relación B/C:</span>
                      <span className={`font-bold ${calc.benefitCostRatio >= 1 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {calc.benefitCostRatio.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCurrent ? 'Seleccionado Actualmente' : 'Cargar este Proyecto'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fisher Rate Note */}
      {selectedProjects.length >= 2 && fisherRate !== null && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-emerald-900">
              Tasa de Indiferencia de Fisher: {(fisherRate * 100).toFixed(2)}% periódica
            </h5>
            <p className="text-emerald-900/80 leading-relaxed">
              Es la tasa de descuento en la cual el VPN de "{selectedProjects[0].name}" y "{selectedProjects[1].name}" se igualan. Si el costo de capital de tu empresa es inferior a {(fisherRate * 100).toFixed(2)}%, el proyecto de mayor dimensión aportará mayor riqueza neta; si es superior, el proyecto de menor desembolso resultará más ventajoso.
            </p>
          </div>
        </div>
      )}

      {/* AI Comparison Report Panel */}
      {aiReport && (
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-sm border border-emerald-900/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-900/60 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Dictamen y Recomendación de Selección del Asesor IA
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-900/30 rounded-xl border border-emerald-800/40 space-y-2">
              <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                Opción Recomendada
              </span>
              <p className="text-base font-extrabold text-white">
                {aiReport.bestOption}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {aiReport.comparativeAnalysis}
              </p>
            </div>

            <div className="p-4 bg-emerald-900/30 rounded-xl border border-emerald-800/40 space-y-2">
              <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                Consejo de Racionamiento de Capital
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {aiReport.capitalRationingAdvice}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                {aiReport.fischerRateNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
