/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InvestmentProject, FinancialCalculationResult, AIDiagnostic } from './types/finance';
import { evaluateProject, generateDeterministicDiagnostic } from './utils/financialEngine';
import { SAMPLE_PROJECTS } from './utils/sampleProjects';
import { Navbar, ActiveSection } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { ProjectForm } from './components/ProjectForm';
import { IndicatorsPanel } from './components/IndicatorsPanel';
import { FinancialCharts } from './components/FinancialCharts';
import { AIDiagnosisSection } from './components/AIDiagnosisSection';
import { ComparisonSection } from './components/ComparisonSection';
import { ExecutiveReport } from './components/ExecutiveReport';

const STORAGE_KEY = 'FINANCIA_IA_PROJECTS_V1';
const ACTIVE_ID_KEY = 'FINANCIA_IA_ACTIVE_ID_V1';

export default function App() {
  // Load saved projects or initialize with samples
  const [projects, setProjects] = useState<InvestmentProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage projects:', e);
    }
    return SAMPLE_PROJECTS;
  });

  // Active project ID
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_ID_KEY);
      if (savedId && projects.some((p) => p.id === savedId)) {
        return savedId;
      }
    } catch {}
    return projects[0]?.id || SAMPLE_PROJECTS[0].id;
  });

  // Active Section
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');

  // AI Diagnostic State
  const [diagnostic, setDiagnostic] = useState<AIDiagnostic | null>(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects to localStorage:', e);
    }
  }, [projects]);

  // Sync activeProjectId
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_KEY, activeProjectId);
    } catch {}
    // Reset cached diagnostic when switching project
    setDiagnostic(null);
  }, [activeProjectId]);

  // Find current project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];
  }, [projects, activeProjectId]);

  // Financial calculations for current project
  const calculations: FinancialCalculationResult = useMemo(() => {
    return evaluateProject(currentProject);
  }, [currentProject]);

  // Project update handler
  const handleUpdateProject = (updated: InvestmentProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setDiagnostic(null); // invalidate diagnostic on data change
  };

  // Create new blank project
  const handleNewProject = () => {
    const newId = `project-${Date.now()}`;
    const newProject: InvestmentProject = {
      id: newId,
      name: `Nuevo Proyecto #${projects.length + 1}`,
      description: 'Evaluación financiera de nueva iniciativa empresarial.',
      sector: 'General',
      currency: 'USD',
      initialInvestment: 100000,
      horizon: 5,
      periodType: 'annual',
      rateType: 'effective',
      discountRate: 12.0,
      flowMode: 'direct',
      cashFlows: [
        { period: 1, netFlow: 25000, notes: 'Año 1' },
        { period: 2, netFlow: 35000, notes: 'Año 2' },
        { period: 3, netFlow: 45000, notes: 'Año 3' },
        { period: 4, netFlow: 55000, notes: 'Año 4' },
        { period: 5, netFlow: 65000, notes: 'Año 5' },
      ],
      breakEvenConfig: {
        sellingPricePerUnit: 100,
        variableCostPerUnit: 40,
        fixedCosts: 30000,
        expectedUnitsSold: 1000,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newId);
    setActiveSection('project');
  };

  // Duplicate active project
  const handleDuplicateProject = (idToDup?: string) => {
    const target = idToDup ? projects.find((p) => p.id === idToDup) : currentProject;
    if (!target) return;

    const dupId = `project-${Date.now()}`;
    const duplicated: InvestmentProject = {
      ...JSON.parse(JSON.stringify(target)),
      id: dupId,
      name: `${target.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [duplicated, ...prev]);
    setActiveProjectId(dupId);
    setActiveSection('project');
  };

  // Delete project
  const handleDeleteProject = (idToDelete: string) => {
    if (projects.length <= 1) {
      alert('Debes conservar al menos un proyecto en la aplicación.');
      return;
    }
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto de inversión?')) {
      const remaining = projects.filter((p) => p.id !== idToDelete);
      setProjects(remaining);
      if (activeProjectId === idToDelete) {
        setActiveProjectId(remaining[0].id);
      }
    }
  };

  // Load a prebuilt sample template as a new project
  const handleLoadTemplate = (template: InvestmentProject) => {
    const copyId = `sample-${Date.now()}`;
    const newFromTemplate: InvestmentProject = {
      ...JSON.parse(JSON.stringify(template)),
      id: copyId,
      name: `${template.name} (Mi Evaluación)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [newFromTemplate, ...prev]);
    setActiveProjectId(copyId);
    setActiveSection('indicators');
  };

  // Request AI Diagnostic
  const handleRunDiagnostic = async () => {
    setLoadingDiagnostic(true);
    try {
      const response = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData: currentProject,
          calculations,
        }),
      });

      if (!response.ok) {
        throw new Error('Servidor retornó error o no hay API key disponible.');
      }

      const data = await response.json();
      if (data.success && data.diagnostic) {
        setDiagnostic({
          ...data.diagnostic,
          source: 'gemini-3.8-flash',
        });
      } else {
        throw new Error('Formato de respuesta no reconocido.');
      }
    } catch {
      // Deterministic financial rule-engine fallback
      const fallbackDiag = generateDeterministicDiagnostic(currentProject, calculations);
      setDiagnostic(fallbackDiag);
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        projects={projects}
        currentProject={currentProject}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onSelectProject={setActiveProjectId}
        onNewProject={handleNewProject}
        onDuplicateProject={() => handleDuplicateProject()}
        onLoadSample={(id) => {
          const sample = SAMPLE_PROJECTS.find((s) => s.id === id);
          if (sample) handleLoadTemplate(sample);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeSection === 'home' && (
          <HomeDashboard
            projects={projects}
            currentProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onLoadTemplate={handleLoadTemplate}
            onNavigate={setActiveSection}
          />
        )}

        {activeSection === 'project' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Editor de Parámetros y Flujos de Fondos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modifica los datos del proyecto actual. Los indicadores y gráficas se recalculan al instante.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSection('indicators')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Ver Indicadores Calculados →
                </button>
              </div>
            </div>

            <ProjectForm
              project={currentProject}
              onUpdateProject={handleUpdateProject}
              onDuplicateProject={() => handleDuplicateProject()}
            />
          </div>
        )}

        {activeSection === 'indicators' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Panel de Indicadores Financieros
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resultados matemáticos exactos: Valor Presente Neto, TIR, PRI simple y descontado, B/C y amortización.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSection('charts')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Ver Gráficas
                </button>
                <button
                  onClick={() => {
                    setActiveSection('ai');
                    if (!diagnostic) handleRunDiagnostic();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Diagnóstico IA</span>
                  <span>✨</span>
                </button>
              </div>
            </div>

            <IndicatorsPanel project={currentProject} calc={calculations} />
          </div>
        )}

        {activeSection === 'charts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Análisis Gráfico y Curvas de Sensibilidad
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comportamiento gráfico de flujos, cruce de equilibrio de inversión y función de valor actual.
                </p>
              </div>

              <button
                onClick={() => setActiveSection('indicators')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Volver a Indicadores
              </button>
            </div>

            <FinancialCharts project={currentProject} calc={calculations} />
          </div>
        )}

        {activeSection === 'ai' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Auditoría Financiera y Diagnóstico con IA
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asesor de inversiones con inteligencia artificial alimentado por los datos cuantitativos del motor financiero.
                </p>
              </div>
            </div>

            <AIDiagnosisSection
              project={currentProject}
              calc={calculations}
              diagnostic={diagnostic}
              loading={loadingDiagnostic}
              onRunDiagnostic={handleRunDiagnostic}
            />
          </div>
        )}

        {activeSection === 'compare' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Comparador de Alternativas de Inversión
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Análisis comparativo de proyectos con cálculo de Tasa de Fisher y asesoría de selección.
                </p>
              </div>
            </div>

            <ComparisonSection
              projects={projects}
              currentProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                setActiveSection('indicators');
              }}
            />
          </div>
        )}

        {activeSection === 'report' && (
          <div className="space-y-6">
            <ExecutiveReport
              project={currentProject}
              calc={calculations}
              diagnostic={diagnostic}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-200">FINANCIA IA</span>
            <span>•</span>
            <span>Evaluación Financiera Profesional de Proyectos de Inversión</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Motor Matemático: VAN / TIR / TIRM / PRI / B-C</span>
            <span>•</span>
            <span>Grounded en Principios Corporativos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
