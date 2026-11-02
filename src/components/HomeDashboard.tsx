import React from 'react';
import { InvestmentProject } from '../types/finance';
import { evaluateProject } from '../utils/financialEngine';
import { SAMPLE_PROJECTS } from '../utils/sampleProjects';
import {
  Plus,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowRight,
  Copy,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  DollarSign,
  Clock,
  Scale,
  Sparkles,
} from 'lucide-react';
import { ActiveSection } from './Navbar';

interface HomeDashboardProps {
  projects: InvestmentProject[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onLoadTemplate: (template: InvestmentProject) => void;
  onNavigate: (section: ActiveSection) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onLoadTemplate,
  onNavigate,
}) => {
  // Compute portfolio high-level stats
  const evaluatedAll = projects.map((p) => ({
    project: p,
    calc: evaluateProject(p),
  }));

  const totalCapital = evaluatedAll.reduce((sum, item) => sum + item.calc.initialInvestment, 0);
  const positiveNpvCount = evaluatedAll.filter((item) => item.calc.npv > 0).length;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-8 sm:p-10 border border-emerald-900/50 shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Profesional de Evaluación de Inversiones</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans leading-tight">
            Toma decisiones financieras con <span className="text-emerald-400">rigor matemático</span> e inteligencia artificial.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Evalúa la viabilidad de tus proyectos de inversión empresarial calculando VPN, TIR, TIRM, Período de Recuperación (PRI simple y descontado), Relación Beneficio/Costo y Punto de Equilibrio con diagnósticos automatizados y grounded en finanzas corporativas.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Evaluar Nuevo Proyecto</span>
            </button>

            <button
              onClick={() => onNavigate('indicators')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all"
            >
              <span>Ver Indicadores del Proyecto Activo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Portfolio Stats */}
        <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Proyectos en Cartera</span>
            <span className="text-xl font-extrabold text-white">{projects.length} evaluados</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Inversión Total Analizada</span>
            <span className="text-xl font-extrabold text-emerald-400">
              USD {totalCapital.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Proyectos con VPN &gt; 0</span>
            <span className="text-xl font-extrabold text-emerald-300">
              {positiveNpvCount} de {projects.length} ({projects.length > 0 ? Math.round((positiveNpvCount / projects.length) * 100) : 0}%)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Diagnóstico IA</span>
            <span className="text-xl font-extrabold text-white flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Grounded
            </span>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Tus Proyectos de Inversión
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona cualquier proyecto para editar sus supuestos, visualizar sus flujos o generar reportes.
            </p>
          </div>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Proyecto</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {evaluatedAll.map(({ project, calc }) => {
            const isCurrent = project.id === currentProjectId;
            const curr = project.currency;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`bg-white rounded-2xl p-6 border cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200/90 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {project.sector || 'Inversión'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1" title={project.name}>
                        {project.name}
                      </h3>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      calc.npv > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {calc.npv > 0 ? 'Viable' : 'Deficitario'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {project.description || 'Sin descripción detallada.'}
                  </p>

                  {/* Financial Mini Badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">Inversión (I₀)</span>
                      <span className="font-bold text-slate-800">
                        {curr} {calc.initialInvestment.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">VPN / VAN</span>
                      <span className={`font-bold ${calc.npv > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {curr} {calc.npv.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">TIR</span>
                      <span className="font-bold text-slate-800">
                        {calc.irr !== null ? `${(calc.irr * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">B/C Ratio</span>
                      <span className={`font-bold ${calc.benefitCostRatio >= 1 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {calc.benefitCostRatio.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer controls */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {project.horizon} {project.periodType === 'monthly' ? 'meses' : 'años'}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDuplicateProject(project.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title="Duplicar proyecto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectProject(project.id);
                        onNavigate('indicators');
                      }}
                      className="ml-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Modelos de Inversión y Plantillas Predefinidas
          </h2>
          <p className="text-xs text-slate-500">
            Explora proyectos empresariales ya estructurados en diferentes sectores económicos para tomar como base o referencia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_PROJECTS.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
            >
              <div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  {template.sector}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                  {template.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {template.description}
                </p>
                <div className="mt-3 text-xs font-mono text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Inversión:</span>
                    <span className="font-bold">USD {template.initialInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Tasa k:</span>
                    <span>{template.discountRate}% anual</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onLoadTemplate(template)}
                  className="w-full py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cargar como Nuevo Proyecto</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Knowledge Hub / Methodology Guide */}
      <div className="bg-slate-100/70 rounded-2xl p-6 border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          Fundamentos y Metodología de Evaluación Financiera
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              ¿Por qué el VPN es el criterio reina?
            </span>
            <p className="leading-relaxed">
              El Valor Presente Neto mide directamente el incremento absoluto de riqueza para los accionistas, descontando los flujos a la tasa de oportunidad. A diferencia de ratios relativos, el VPN no sufre de problemas de escala.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Limitaciones de la TIR y uso de la TIRM
            </span>
            <p className="leading-relaxed">
              La TIR clásica asume implícitamente que los flujos intermedios se reinvierten a la misma tasa TIR (a menudo irrealmente alta). Además, con flujos no convencionales pueden existir múltiples raíces reales (Descartes). La TIRM corrige esto reinvirtiendo al WACC.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              PRI Simple vs PRI Descontado
            </span>
            <p className="leading-relaxed">
              El PRI simple ignora el costo del capital y los flujos posteriores al corte. El PRI Descontado considera el valor del dinero en el tiempo, respondiendo con rigor cuántos períodos toma cubrir tanto la inversión como el costo del dinero.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
