import React from 'react';
import { InvestmentProject } from '../types/finance';
import {
  TrendingUp,
  Plus,
  FolderOpen,
  Copy,
  Sparkles,
  BarChart2,
  FileText,
  Calculator,
  Scale,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';

export type ActiveSection = 'home' | 'project' | 'indicators' | 'charts' | 'ai' | 'compare' | 'report';

interface NavbarProps {
  projects: InvestmentProject[];
  currentProject: InvestmentProject;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDuplicateProject: () => void;
  onLoadSample: (sampleId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  currentProject,
  activeSection,
  onSelectSection,
  onSelectProject,
  onNewProject,
  onDuplicateProject,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md print:hidden">
      {/* Top tier brand and project selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectSection('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 via-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white font-sans">
                  FINANCIA <span className="text-emerald-400">IA</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  v3.8
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                Evaluación Financiera de Inversiones
              </p>
            </div>
          </button>

          {/* Current Project Selector Dropdown */}
          <div className="relative ml-2 sm:ml-4 border-l border-slate-800 pl-3 sm:pl-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 hidden md:inline">
                Proyecto:
              </span>
              <div className="relative">
                <select
                  value={currentProject.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="appearance-none bg-slate-800/90 hover:bg-slate-800 text-slate-100 text-xs font-semibold pl-3 pr-8 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currency})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicateProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors"
            title="Duplicar proyecto actual para evaluar otro escenario"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
        <div className="flex space-x-1 py-1.5 min-w-max">
          <button
            onClick={() => onSelectSection('home')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'home'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Inicio / Proyectos</span>
          </button>

          <button
            onClick={() => onSelectSection('project')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'project'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Editar Proyecto y Flujos</span>
          </button>

          <button
            onClick={() => onSelectSection('indicators')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'indicators'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Indicadores y Procedimientos</span>
          </button>

          <button
            onClick={() => onSelectSection('charts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'charts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Gráficas Dinámicas</span>
          </button>

          <button
            onClick={() => onSelectSection('ai')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'ai'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Diagnóstico IA</span>
          </button>

          <button
            onClick={() => onSelectSection('compare')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'compare'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Comparación</span>
          </button>

          <button
            onClick={() => onSelectSection('report')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'report'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Informe Formal</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
