import React, { useState, useRef } from 'react';
import { InvestmentProject, CashFlowItem, PeriodType, RateType, FlowMode } from '../types/finance';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Layers,
  Sliders,
  DollarSign,
  TrendingUp,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { parseCashFlowFile, downloadCashFlowTemplate } from '../utils/fileImportExport';

interface ProjectFormProps {
  project: InvestmentProject;
  onUpdateProject: (updated: InvestmentProject) => void;
  onDuplicateProject?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onUpdateProject }) => {
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [growthRateModal, setGrowthRateModal] = useState(false);
  const [growthPercent, setGrowthPercent] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'flows' | 'breakeven' | 'config'>('flows');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof InvestmentProject, value: any) => {
    onUpdateProject({
      ...project,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddPeriod = () => {
    const newPeriodNum = project.cashFlows.length + 1;
    const lastFlow = project.cashFlows[project.cashFlows.length - 1];
    const newFlowItem: CashFlowItem = {
      period: newPeriodNum,
      netFlow: lastFlow ? lastFlow.netFlow * 1.05 : 20000,
      revenue: lastFlow?.revenue ? lastFlow.revenue * 1.05 : 100000,
      variableCosts: lastFlow?.variableCosts ? lastFlow.variableCosts * 1.05 : 50000,
      fixedExpenses: lastFlow?.fixedExpenses ?? 20000,
      depreciation: lastFlow?.depreciation ?? 5000,
      taxRate: lastFlow?.taxRate ?? 0.30,
      workingCapitalChange: 0,
      salvageValue: 0,
      notes: `Período ${newPeriodNum}`,
    };

    onUpdateProject({
      ...project,
      horizon: newPeriodNum,
      cashFlows: [...project.cashFlows, newFlowItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemovePeriod = (periodNum: number) => {
    if (project.cashFlows.length <= 1) {
      alert('El proyecto debe contar con al menos 1 período evaluado.');
      return;
    }
    const filtered = project.cashFlows
      .filter((item) => item.period !== periodNum)
      .map((item, idx) => ({ ...item, period: idx + 1 }));

    onUpdateProject({
      ...project,
      horizon: filtered.length,
      cashFlows: filtered,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFlowItemChange = (index: number, field: keyof CashFlowItem, value: any) => {
    const updated = [...project.cashFlows];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onUpdateProject({
      ...project,
      cashFlows: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApplyGrowth = () => {
    if (project.cashFlows.length === 0) return;
    const factor = 1 + growthPercent / 100;
    const baseFlow = project.cashFlows[0].netFlow || 10000;

    const updated = project.cashFlows.map((item, idx) => {
      if (idx === 0) return item;
      const grew = Math.round(baseFlow * Math.pow(factor, idx));
      return {
        ...item,
        netFlow: grew,
        revenue: item.revenue ? Math.round(item.revenue * factor) : undefined,
      };
    });

    onUpdateProject({
      ...project,
      cashFlows: updated,
      updatedAt: new Date().toISOString(),
    });
    setGrowthRateModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);

    const res = await parseCashFlowFile(file);
    setImporting(false);

    if (res.success && res.flows && res.flows.length > 0) {
      setImportMessage({
        text: `¡Éxito! Se importaron ${res.flows.length} períodos desde el archivo ${file.name}.`,
        isError: false,
      });

      onUpdateProject({
        ...project,
        name: res.suggestedName || project.name,
        initialInvestment: res.suggestedInvestment || project.initialInvestment,
        horizon: res.flows.length,
        cashFlows: res.flows,
        updatedAt: new Date().toISOString(),
      });
    } else {
      setImportMessage({
        text: res.error || 'No se pudieron extraer flujos válidos.',
        isError: true,
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const curr = project.currency;

  return (
    <div className="space-y-6">
      {/* Top Banner: Project Settings Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              Parámetros Generales y de Mercado
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura los supuestos de inversión, costo de capital (WACC) y periodicidad de evaluación.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('flows')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'flows'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Flujos de Caja ({project.cashFlows.length})
            </button>
            <button
              onClick={() => setActiveTab('breakeven')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'breakeven'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Punto de Equilibrio
            </button>
          </div>
        </div>

        {/* General Inputs Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">
              Nombre del Proyecto de Inversión *
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              placeholder="Ej: Expansión de Capacidad Productiva"
            />
          </div>

          {/* Sector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Sector / Industria
            </label>
            <input
              type="text"
              value={project.sector || ''}
              onChange={(e) => handleFieldChange('sector', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              placeholder="Ej: Manufactura, SaaS, Comercio"
            />
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Moneda de Registro
            </label>
            <select
              value={project.currency}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            >
              <option value="USD">USD ($ Dólar estadounidense)</option>
              <option value="EUR">EUR (€ Euro)</option>
              <option value="COP">COP ($ Peso colombiano)</option>
              <option value="MXN">MXN ($ Peso mexicano)</option>
              <option value="PEN">PEN (S/. Sol peruano)</option>
              <option value="ARS">ARS ($ Peso argentino)</option>
              <option value="CLP">CLP ($ Peso chileno)</option>
              <option value="BRL">BRL (R$ Real brasileño)</option>
            </select>
          </div>

          {/* Initial Investment I0 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Inversión Inicial (I₀) *</span>
              <span className="text-[10px] text-slate-400">Desembolso t=0</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {curr}
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={project.initialInvestment}
                onChange={(e) => handleFieldChange('initialInvestment', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          </div>

          {/* Discount Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Tasa de Descuento (k) *</span>
              <span className="text-[10px] text-slate-400">Costo Oportunidad / WACC</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.1"
                value={project.discountRate}
                onChange={(e) => handleFieldChange('discountRate', Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                %
              </span>
            </div>
          </div>

          {/* Rate Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Tipo de Tasa
            </label>
            <select
              value={project.rateType}
              onChange={(e) => handleFieldChange('rateType', e.target.value as RateType)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            >
              <option value="effective">Efectiva Anual (TEA / E.A.)</option>
              <option value="nominal">Nominal Anual (TNA)</option>
            </select>
          </div>

          {/* Periodicity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Periodicidad de los Flujos
            </label>
            <select
              value={project.periodType}
              onChange={(e) => handleFieldChange('periodType', e.target.value as PeriodType)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            >
              <option value="annual">Anual (1 vez por año)</option>
              <option value="semiannual">Semestral (2 veces por año)</option>
              <option value="quarterly">Trimestral (4 veces por año)</option>
              <option value="monthly">Mensual (12 veces por año)</option>
            </select>
          </div>
        </div>

        {/* Project Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Descripción y Objetivos Estratégicos del Proyecto
          </label>
          <textarea
            rows={2}
            value={project.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            placeholder="Detalla las características del proyecto, la justificación de mercado y las premisas clave para el diagnóstico de la IA..."
          />
        </div>
      </div>

      {/* TAB 1: CASH FLOWS TABLE */}
      {activeTab === 'flows' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Proyección de Flujos de Fondos Netos (FNE)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresa los flujos proyectados para cada período o importa una planilla existente.
              </p>
            </div>

            {/* Mode and Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Flow Mode Switch */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleFieldChange('flowMode', 'direct')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    project.flowMode === 'direct'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flujo Neto Directo
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('flowMode', 'detailed')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    project.flowMode === 'detailed'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Detallado (Ingr/Cost)
                </button>
              </div>

              {/* Growth Projection tool */}
              <button
                type="button"
                onClick={() => setGrowthRateModal(!growthRateModal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="Proyectar con tasa constante de crecimiento"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Crecimiento (+g%)</span>
              </button>

              {/* Excel Template */}
              <button
                type="button"
                onClick={downloadCashFlowTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="Descargar plantilla de Excel de muestra"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Plantilla</span>
              </button>

              {/* Import Excel / CSV */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? 'Importando...' : 'Importar Excel/CSV'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Import message status banner */}
          {importMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                importMessage.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {importMessage.isError ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Check className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{importMessage.text}</span>
              </div>
              <button
                onClick={() => setImportMessage(null)}
                className="text-xs underline font-semibold ml-4"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Growth Tool Popover */}
          {growthRateModal && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-emerald-900">
                  Proyección Geométrica: Tasa de crecimiento anual compuesta (g):
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={growthPercent}
                    onChange={(e) => setGrowthPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                  />
                  <span className="font-bold">%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyGrowth}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs"
                >
                  Aplicar a períodos 2 en adelante
                </button>
                <button
                  type="button"
                  onClick={() => setGrowthRateModal(false)}
                  className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Flows Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-16">Período</th>
                  {project.flowMode === 'direct' ? (
                    <>
                      <th className="py-3 px-3">Flujo Neto ({curr})</th>
                      <th className="py-3 px-3">Notas / Hito del Período</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-2">Ingresos ({curr})</th>
                      <th className="py-3 px-2">Costos Var. ({curr})</th>
                      <th className="py-3 px-2">Gastos Fijos ({curr})</th>
                      <th className="py-3 px-2">Depreciación</th>
                      <th className="py-3 px-2">Impuestos (%)</th>
                      <th className="py-3 px-2">K. Trabajo</th>
                      <th className="py-3 px-2">Valor Salvamento</th>
                      <th className="py-3 px-2 font-bold text-emerald-800">Flujo Caja Neto</th>
                    </>
                  )}
                  <th className="py-3 px-3 w-12 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {/* Period 0 row (I0 representation) */}
                <tr className="bg-amber-50/40 text-amber-950 font-mono">
                  <td className="py-2.5 px-3 font-bold font-sans">t = 0</td>
                  {project.flowMode === 'direct' ? (
                    <>
                      <td className="py-2.5 px-3 font-bold text-rose-600">
                        -{curr} {project.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans italic text-[11px]">
                        Desembolso inicial de inversión (Capex)
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan={7} className="py-2.5 px-2 text-slate-500 font-sans italic text-[11px]">
                        Desembolso de Inversión Inicial (Capex de activos y adecuaciones)
                      </td>
                      <td className="py-2.5 px-2 font-bold text-rose-600">
                        -{curr} {project.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  )}
                  <td className="py-2.5 px-3 text-center text-slate-400 font-sans text-[11px]">
                    Fijo
                  </td>
                </tr>

                {/* Cash Flows rows */}
                {project.cashFlows.map((item, idx) => {
                  return (
                    <tr key={item.period} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                        {project.periodType === 'monthly' ? `M${item.period}` : `Año ${item.period}`}
                      </td>

                      {project.flowMode === 'direct' ? (
                        <>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="500"
                              value={item.netFlow}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'netFlow', parseFloat(e.target.value) || 0)
                              }
                              className="w-full max-w-[200px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleFlowItemChange(idx, 'notes', e.target.value)}
                              placeholder={`Hito del período ${item.period}`}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              value={item.revenue ?? 0}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'revenue', parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              value={item.variableCosts ?? 0}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'variableCosts', parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              value={item.fixedExpenses ?? 0}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'fixedExpenses', parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              value={item.depreciation ?? 0}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'depreciation', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="0.05"
                              value={item.taxRate ?? 0.3}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              value={item.workingCapitalChange ?? 0}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'workingCapitalChange', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              value={item.salvageValue ?? 0}
                              onChange={(e) =>
                                handleFlowItemChange(idx, 'salvageValue', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 font-mono font-bold text-emerald-800">
                            {(() => {
                              const rev = item.revenue ?? 0;
                              const vc = item.variableCosts ?? 0;
                              const fe = item.fixedExpenses ?? 0;
                              const dp = item.depreciation ?? 0;
                              const taxR = item.taxRate ?? 0.30;
                              const wk = item.workingCapitalChange ?? 0;
                              const salv = item.salvageValue ?? 0;
                              const ebit = rev - vc - fe - dp;
                              const tax = ebit > 0 ? ebit * taxR : 0;
                              const nopat = ebit - tax;
                              const fne = nopat + dp - wk + salv;
                              return `${curr} ${fne.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`;
                            })()}
                          </td>
                        </>
                      )}

                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(item.period)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title={`Eliminar período ${item.period}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Period Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddPeriod}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Agregar Período ({project.cashFlows.length + 1})</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              Horizonte Total: {project.cashFlows.length} {project.periodType === 'monthly' ? 'meses' : 'años'}
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: BREAK-EVEN CALCULATOR ACCORDION */}
      {activeTab === 'breakeven' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Configuración del Punto de Equilibrio Operativo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calcula el umbral mínimo de unidades y ventas requerido para cubrir los costos fijos y variables.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Precio de Venta Unitario (P) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {curr}
                </span>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={project.breakEvenConfig?.sellingPricePerUnit ?? 100}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      breakEvenConfig: {
                        ...(project.breakEvenConfig || {
                          variableCostPerUnit: 40,
                          fixedCosts: 50000,
                        }),
                        sellingPricePerUnit: Math.max(0.01, parseFloat(e.target.value) || 0.01),
                      },
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Costo Variable Unitario (CVᵤ) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {curr}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={project.breakEvenConfig?.variableCostPerUnit ?? 40}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      breakEvenConfig: {
                        ...(project.breakEvenConfig || {
                          sellingPricePerUnit: 100,
                          fixedCosts: 50000,
                        }),
                        variableCostPerUnit: Math.max(0, parseFloat(e.target.value) || 0),
                      },
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Costos Fijos del Período (CF) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {curr}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={project.breakEvenConfig?.fixedCosts ?? 50000}
                  onChange={(e) =>
                    onUpdateProject({
                      ...project,
                      breakEvenConfig: {
                        ...(project.breakEvenConfig || {
                          sellingPricePerUnit: 100,
                          variableCostPerUnit: 40,
                        }),
                        fixedCosts: Math.max(0, parseFloat(e.target.value) || 0),
                      },
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Ventas Estimadas (Unidades)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={project.breakEvenConfig?.expectedUnitsSold ?? 1500}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    breakEvenConfig: {
                      ...(project.breakEvenConfig || {
                        sellingPricePerUnit: 100,
                        variableCostPerUnit: 40,
                        fixedCosts: 50000,
                      }),
                      expectedUnitsSold: Math.max(0, parseFloat(e.target.value) || 0),
                    },
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                placeholder="Para calcular Margen de Seguridad"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
            <span className="font-bold text-emerald-900">Margen de Contribución Unitario:</span>
            <p>
              (Precio - Costo Variable) = {curr} {((project.breakEvenConfig?.sellingPricePerUnit ?? 100) - (project.breakEvenConfig?.variableCostPerUnit ?? 40)).toFixed(2)}. Cada unidad vendida contribuye esta cantidad a la amortización de la estructura de costos fijos de la empresa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
