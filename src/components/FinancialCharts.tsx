import React, { useState } from 'react';
import { FinancialCalculationResult, InvestmentProject } from '../types/finance';
import { BarChart3, TrendingUp, Activity, PieChart } from 'lucide-react';

interface FinancialChartsProps {
  project: InvestmentProject;
  calc: FinancialCalculationResult;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ project, calc }) => {
  const [activeChart, setActiveChart] = useState<'flows' | 'payback' | 'npvProfile' | 'breakeven'>('flows');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; text: string } | null>(null);

  const curr = project.currency;
  const periodLabel = project.periodType === 'monthly' ? 'Mes' : project.periodType === 'quarterly' ? 'Trim.' : project.periodType === 'semiannual' ? 'Sem.' : 'Año';

  // --- 1. Flujos de Caja (Nominal vs Descontado) ---
  const flowSteps = calc.periodSteps.filter((s) => s.period > 0);
  const maxFlow = Math.max(...flowSteps.map((s) => Math.max(s.nominalFlow, s.discountedFlow, 0)), 1);
  const minFlow = Math.min(...flowSteps.map((s) => Math.min(s.nominalFlow, s.discountedFlow, 0)), 0);
  const flowRange = maxFlow - minFlow || 1;

  // --- 2. Recuperación Acumulada (Payback line) ---
  const maxCum = Math.max(...calc.periodSteps.map((s) => Math.max(s.cumulativeNominal, s.cumulativeDiscounted, 0)), 1);
  const minCum = Math.min(...calc.periodSteps.map((s) => Math.min(s.cumulativeNominal, s.cumulativeDiscounted, 0)), 0);
  const cumRange = maxCum - minCum || 1;

  // --- 3. Perfil del VPN ---
  const validNpvProfile = calc.npvProfile.filter((p) => Math.abs(p.npv) < 1e8);
  const maxNpvP = Math.max(...validNpvProfile.map((p) => p.npv), 1);
  const minNpvP = Math.min(...validNpvProfile.map((p) => p.npv), 0);
  const npvRange = maxNpvP - minNpvP || 1;

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 360;
  const padLeft = 85;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Header and Chart Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Visualización y Gráficas Financieras Dinámicas
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Comportamiento temporal de flujos, horizonte de amortización y sensibilidad de tasas.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setActiveChart('flows')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeChart === 'flows'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Flujos por Período
          </button>
          <button
            onClick={() => setActiveChart('payback')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeChart === 'payback'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Recuperación (PRI)
          </button>
          <button
            onClick={() => setActiveChart('npvProfile')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeChart === 'npvProfile'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Curva VPN vs Tasa (TIR)
          </button>
          {calc.breakEven && (
            <button
              onClick={() => setActiveChart('breakeven')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeChart === 'breakeven'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Punto de Equilibrio
            </button>
          )}
        </div>
      </div>

      {/* CHART 1: Flujos por Período */}
      {activeChart === 'flows' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-700 inline-block shadow-xs"></span>
                Flujo Nominal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-400 inline-block shadow-xs"></span>
                Flujo Descontado (Factor VP)
              </span>
            </div>
            <span className="font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Tasa periódica: {(calc.periodicRate * 100).toFixed(3)}%
            </span>
          </div>

          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[380px] select-none"
            >
              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = padTop + graphHeight * (1 - pct);
                const val = minFlow + flowRange * pct;
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] fill-slate-400 font-mono"
                    >
                      {curr} {val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Zero axis if minFlow < 0 */}
              {minFlow < 0 && maxFlow > 0 && (
                <line
                  x1={padLeft}
                  y1={padTop + graphHeight * (1 - (0 - minFlow) / flowRange)}
                  x2={svgWidth - padRight}
                  y2={padTop + graphHeight * (1 - (0 - minFlow) / flowRange)}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                />
              )}

              {/* Bars per period */}
              {flowSteps.map((step, idx) => {
                const totalBars = flowSteps.length;
                const slotWidth = graphWidth / totalBars;
                const barWidth = Math.min(slotWidth * 0.32, 28);
                const centerX = padLeft + slotWidth * idx + slotWidth / 2;

                const zeroY = padTop + graphHeight * (1 - (0 - minFlow) / flowRange);

                // Nominal bar height
                const nomY = padTop + graphHeight * (1 - (step.nominalFlow - minFlow) / flowRange);
                const nomHeight = Math.abs(nomY - zeroY);
                const nomTop = step.nominalFlow >= 0 ? nomY : zeroY;

                // Discounted bar height
                const descY = padTop + graphHeight * (1 - (step.discountedFlow - minFlow) / flowRange);
                const descHeight = Math.abs(descY - zeroY);
                const descTop = step.discountedFlow >= 0 ? descY : zeroY;

                return (
                  <g key={step.period} className="cursor-pointer group">
                    {/* Period label */}
                    <text
                      x={centerX}
                      y={svgHeight - 16}
                      textAnchor="middle"
                      className="text-[11px] fill-slate-600 font-semibold"
                    >
                      {periodLabel} {step.period}
                    </text>

                    {/* Nominal Bar */}
                    <rect
                      x={centerX - barWidth - 2}
                      y={nomTop}
                      width={barWidth}
                      height={Math.max(nomHeight, 2)}
                      rx={3}
                      fill="#065f46"
                      className="transition-all hover:opacity-85"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredPoint({
                          x: rect.x + rect.width / 2,
                          y: rect.y,
                          text: `${periodLabel} ${step.period} Nominal: ${curr} ${step.nominalFlow.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Discounted Bar */}
                    <rect
                      x={centerX + 2}
                      y={descTop}
                      width={barWidth}
                      height={Math.max(descHeight, 2)}
                      rx={3}
                      fill="#34d399"
                      className="transition-all hover:opacity-85"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredPoint({
                          x: rect.x + rect.width / 2,
                          y: rect.y,
                          text: `${periodLabel} ${step.period} Descontado: ${curr} ${step.discountedFlow.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Value label on top of nominal */}
                    <text
                      x={centerX - barWidth / 2 - 2}
                      y={nomTop - 6}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-700 font-mono font-medium hidden sm:block"
                    >
                      {step.nominalFlow >= 1000 ? (step.nominalFlow / 1000).toFixed(0) + 'k' : step.nominalFlow.toFixed(0)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
            <span className="font-bold text-emerald-700">Interpretación de flujos:</span>
            <span>
              La brecha entre la barra verde oscura (nominal) y la barra verde menta (descontada) representa el impacto erosivo de la tasa de oportunidad en el tiempo. A mayor plazo, menor valor real aportan los flujos futuros al VPN.
            </span>
          </div>
        </div>
      )}

      {/* CHART 2: Recuperación de la Inversión (Líneas de Payback) */}
      {activeChart === 'payback' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded bg-blue-600 inline-block"></span>
                Acumulado Nominal (PRI Simple: {calc.paybackPeriod ? `${calc.paybackPeriod.toFixed(2)} ${periodLabel}s` : 'No recupera'})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded bg-emerald-600 inline-block"></span>
                Acumulado Descontado (PRI Desc.: {calc.discountedPaybackPeriod ? `${calc.discountedPaybackPeriod.toFixed(2)} ${periodLabel}s` : 'No recupera'})
              </span>
            </div>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-0.5 bg-red-500 inline-block"></span>
              Línea Cero (Breakeven de Inversión)
            </span>
          </div>

          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[380px] select-none"
            >
              {/* Zero line */}
              {(() => {
                const zeroY = padTop + graphHeight * (1 - (0 - minCum) / cumRange);
                return (
                  <g>
                    <line
                      x1={padLeft}
                      y1={zeroY}
                      x2={svgWidth - padRight}
                      y2={zeroY}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                    />
                    <text
                      x={svgWidth - padRight - 5}
                      y={zeroY - 6}
                      textAnchor="end"
                      className="text-[11px] fill-red-600 font-bold"
                    >
                      Equilibrio (Inversión Recuperada = 0)
                    </text>
                  </g>
                );
              })()}

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = padTop + graphHeight * (1 - pct);
                const val = minCum + cumRange * pct;
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] fill-slate-400 font-mono"
                    >
                      {curr} {val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Calculate Polyline coordinates */}
              {(() => {
                const steps = calc.periodSteps;
                const totalSteps = steps.length;
                const stepX = graphWidth / (totalSteps - 1);

                const nominalPoints = steps.map((s, idx) => {
                  const x = padLeft + idx * stepX;
                  const y = padTop + graphHeight * (1 - (s.cumulativeNominal - minCum) / cumRange);
                  return `${x},${y}`;
                }).join(' ');

                const discountedPoints = steps.map((s, idx) => {
                  const x = padLeft + idx * stepX;
                  const y = padTop + graphHeight * (1 - (s.cumulativeDiscounted - minCum) / cumRange);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g>
                    {/* Nominal line */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={nominalPoints}
                    />

                    {/* Discounted line */}
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={discountedPoints}
                    />

                    {/* Points */}
                    {steps.map((s, idx) => {
                      const x = padLeft + idx * stepX;
                      const yNom = padTop + graphHeight * (1 - (s.cumulativeNominal - minCum) / cumRange);
                      const yDesc = padTop + graphHeight * (1 - (s.cumulativeDiscounted - minCum) / cumRange);

                      return (
                        <g key={idx}>
                          {/* X label */}
                          <text
                            x={x}
                            y={svgHeight - 16}
                            textAnchor="middle"
                            className="text-[11px] fill-slate-600 font-semibold"
                          >
                            {s.period === 0 ? 't=0 (I0)' : `${periodLabel} ${s.period}`}
                          </text>

                          {/* Nominal dot */}
                          <circle
                            cx={x}
                            cy={yNom}
                            r={5}
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                          />

                          {/* Discounted dot */}
                          <circle
                            cx={x}
                            cy={yDesc}
                            r={5.5}
                            fill="#ffffff"
                            stroke="#059669"
                            strokeWidth={3}
                          />
                        </g>
                      );
                    })}

                    {/* Intersection marker for Simple Payback */}
                    {calc.paybackPeriod !== null && (
                      <g>
                        {(() => {
                          const pbX = padLeft + calc.paybackPeriod * stepX;
                          const zeroY = padTop + graphHeight * (1 - (0 - minCum) / cumRange);
                          return (
                            <g>
                              <circle cx={pbX} cy={zeroY} r={7} fill="#2563eb" />
                              <circle cx={pbX} cy={zeroY} r={11} fill="none" stroke="#2563eb" strokeWidth={2} opacity={0.6} />
                              <text
                                x={pbX}
                                y={zeroY - 14}
                                textAnchor="middle"
                                className="text-[11px] fill-blue-700 font-bold font-mono"
                              >
                                PRI Simple: {calc.paybackPeriod.toFixed(2)}
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}

                    {/* Intersection marker for Discounted Payback */}
                    {calc.discountedPaybackPeriod !== null && (
                      <g>
                        {(() => {
                          const pbX = padLeft + calc.discountedPaybackPeriod * stepX;
                          const zeroY = padTop + graphHeight * (1 - (0 - minCum) / cumRange);
                          return (
                            <g>
                              <circle cx={pbX} cy={zeroY} r={7} fill="#059669" />
                              <circle cx={pbX} cy={zeroY} r={12} fill="none" stroke="#059669" strokeWidth={2} opacity={0.6} />
                              <text
                                x={pbX}
                                y={zeroY + 24}
                                textAnchor="middle"
                                className="text-[11px] fill-emerald-800 font-bold font-mono"
                              >
                                PRI Desc: {calc.discountedPaybackPeriod.toFixed(2)}
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-950">
              <span className="font-bold text-blue-800">PRI Simple ({calc.paybackPeriod ? `${calc.paybackPeriod.toFixed(2)} períodos` : 'No recupera'}):</span>
              <p className="mt-0.5 text-blue-900/80">
                Mide el tiempo nominal hasta que la suma simple de flujos iguala el desembolso inicial. No contempla el costo del dinero ni la tasa de descuento.
              </p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-950">
              <span className="font-bold text-emerald-800">PRI Descontado ({calc.discountedPaybackPeriod ? `${calc.discountedPaybackPeriod.toFixed(2)} períodos` : 'No recupera'}):</span>
              <p className="mt-0.5 text-emerald-900/80">
                Estándar riguroso de banca de inversión. Determina el período exacto en el que el valor presente acumulado compensa el costo del capital invertido.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CHART 3: Curva del Perfil del VPN vs Tasa de Descuento (Sensibilidad y TIR) */}
      {activeChart === 'npvProfile' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded bg-emerald-600 inline-block"></span>
                Curva de Valor Presente Neto VPN(k)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                Tasa Actual ({project.discountRate}%)
              </span>
              {calc.irr !== null && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                  TIR (Cruce con VPN = 0: {(calc.irr * 100).toFixed(2)}%)
                </span>
              )}
            </div>
            <span className="font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Corte VPN=0 define la TIR
            </span>
          </div>

          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[380px] select-none"
            >
              {/* Zero line */}
              {(() => {
                const zeroY = padTop + graphHeight * (1 - (0 - minNpvP) / npvRange);
                return (
                  <g>
                    <line
                      x1={padLeft}
                      y1={zeroY}
                      x2={svgWidth - padRight}
                      y2={zeroY}
                      stroke="#94a3b8"
                      strokeWidth={1.8}
                    />
                    <text
                      x={padLeft - 10}
                      y={zeroY + 4}
                      textAnchor="end"
                      className="text-[11px] fill-slate-700 font-bold"
                    >
                      VPN = 0
                    </text>
                  </g>
                );
              })()}

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = padTop + graphHeight * (1 - pct);
                const val = minNpvP + npvRange * pct;
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {curr} {val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Profile Curve */}
              {(() => {
                const points = validNpvProfile.map((p, idx) => {
                  const x = padLeft + (idx / (validNpvProfile.length - 1)) * graphWidth;
                  const y = padTop + graphHeight * (1 - (p.npv - minNpvP) / npvRange);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g>
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />

                    {/* X axis rate markers */}
                    {validNpvProfile.filter((_, idx) => idx % 4 === 0).map((p, idx) => {
                      const origIndex = idx * 4;
                      const x = padLeft + (origIndex / (validNpvProfile.length - 1)) * graphWidth;
                      return (
                        <text
                          key={origIndex}
                          x={x}
                          y={svgHeight - 16}
                          textAnchor="middle"
                          className="text-[11px] fill-slate-600 font-medium"
                        >
                          {p.rate}%
                        </text>
                      );
                    })}

                    {/* Current Discount Rate Point */}
                    {(() => {
                      const curRatePct = project.discountRate;
                      const idxApprox = curRatePct / 2;
                      const x = padLeft + Math.min(Math.max(idxApprox / (validNpvProfile.length - 1), 0), 1) * graphWidth;
                      const y = padTop + graphHeight * (1 - (calc.npv - minNpvP) / npvRange);

                      return (
                        <g>
                          <circle cx={x} cy={y} r={7} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                          <circle cx={x} cy={y} r={12} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.5} />
                          <text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            className="text-[11px] fill-amber-800 font-bold font-mono bg-white"
                          >
                            Tasa Actual {curRatePct}% (VPN: {calc.npv >= 1000 ? (calc.npv / 1000).toFixed(1) + 'k' : calc.npv.toFixed(0)})
                          </text>
                        </g>
                      );
                    })()}

                    {/* IRR Point (where VPN intersects 0) */}
                    {calc.irr !== null && (
                      (() => {
                        const irrPct = calc.irr * 100;
                        if (irrPct >= 0 && irrPct <= 50) {
                          const idxApprox = irrPct / 2;
                          const x = padLeft + (idxApprox / (validNpvProfile.length - 1)) * graphWidth;
                          const zeroY = padTop + graphHeight * (1 - (0 - minNpvP) / npvRange);

                          return (
                            <g>
                              <circle cx={x} cy={zeroY} r={7} fill="#9333ea" stroke="#ffffff" strokeWidth={2} />
                              <circle cx={x} cy={zeroY} r={13} fill="none" stroke="#9333ea" strokeWidth={2} opacity={0.5} />
                              <text
                                x={x}
                                y={zeroY + 22}
                                textAnchor="middle"
                                className="text-[11px] fill-purple-900 font-bold font-mono"
                              >
                                TIR: {irrPct.toFixed(2)}%
                              </text>
                            </g>
                          );
                        }
                        return null;
                      })()
                    )}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Significado Económico del Perfil del VPN:</span>
            <p className="mt-0.5">
              La curva demuestra la pendiente decreciente típica del valor presente ante incrementos de la tasa de costo de capital.
              El punto de intersección con el eje horizontal ($VPN = 0$) es por definición matemática la <strong>Tasa Interna de Retorno (TIR)</strong>. Mientras la tasa de oportunidad exigida se mantenga a la izquierda de la TIR, el proyecto genera riqueza neta para los inversores.
            </p>
          </div>
        </div>
      )}

      {/* CHART 4: Punto de Equilibrio (Break-even) */}
      {activeChart === 'breakeven' && calc.breakEven && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Unidades de Equilibrio (Qe)</span>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {calc.breakEven.units.toLocaleString('es-ES', { maximumFractionDigits: 0 })} uds
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Ventas de Equilibrio (Ve)</span>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {curr} {calc.breakEven.sales.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Margen Contribución Unitario</span>
              <p className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                {curr} {calc.breakEven.contributionMarginUnit.toFixed(2)} ({ (calc.breakEven.contributionMarginRatio * 100).toFixed(1) }%)
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Margen de Seguridad</span>
              <p className={`text-base font-bold font-mono mt-0.5 ${calc.breakEven.safetyMargin > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {(calc.breakEven.safetyMargin * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* SVG Break-Even Chart */}
          {(() => {
            const qBreak = calc.breakEven.units;
            const maxQ = Math.max(qBreak * 2, (project.breakEvenConfig?.expectedUnitsSold || qBreak) * 1.5, 100);
            const maxMoney = maxQ * calc.breakEven.sellingPrice;

            const qToX = (q: number) => padLeft + (q / maxQ) * graphWidth;
            const mToY = (m: number) => padTop + graphHeight * (1 - m / maxMoney);

            const qBreakX = qToX(qBreak);
            const breakMoneyY = mToY(calc.breakEven.sales);

            return (
              <div className="relative overflow-x-auto">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto max-h-[380px] select-none"
                >
                  {/* Grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = padTop + graphHeight * (1 - pct);
                    const val = maxMoney * pct;
                    return (
                      <g key={idx}>
                        <line x1={padLeft} y1={y} x2={svgWidth - padRight} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                        <text x={padLeft - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                          {curr} {(val / 1000).toFixed(0)}k
                        </text>
                      </g>
                    );
                  })}

                  {/* Fixed Costs Line */}
                  <line
                    x1={padLeft}
                    y1={mToY(calc.breakEven.fixedCosts)}
                    x2={svgWidth - padRight}
                    y2={mToY(calc.breakEven.fixedCosts)}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                  />
                  <text
                    x={svgWidth - padRight - 5}
                    y={mToY(calc.breakEven.fixedCosts) - 6}
                    textAnchor="end"
                    className="text-[10px] fill-slate-500 font-semibold"
                  >
                    Costos Fijos ({curr} {calc.breakEven.fixedCosts.toLocaleString()})
                  </text>

                  {/* Total Costs Line: CF + CV_u * Q */}
                  <line
                    x1={padLeft}
                    y1={mToY(calc.breakEven.fixedCosts)}
                    x2={qToX(maxQ)}
                    y2={mToY(calc.breakEven.fixedCosts + calc.breakEven.variableCost * maxQ)}
                    stroke="#dc2626"
                    strokeWidth={2.5}
                  />

                  {/* Total Revenue Line: P * Q */}
                  <line
                    x1={padLeft}
                    y1={mToY(0)}
                    x2={qToX(maxQ)}
                    y2={mToY(calc.breakEven.sellingPrice * maxQ)}
                    stroke="#16a34a"
                    strokeWidth={3}
                  />

                  {/* Break-even point marker */}
                  <circle cx={qBreakX} cy={breakMoneyY} r={7} fill="#0284c7" stroke="#ffffff" strokeWidth={2} />
                  <circle cx={qBreakX} cy={breakMoneyY} r={14} fill="none" stroke="#0284c7" strokeWidth={2} opacity={0.5} />

                  {/* Drop lines to axes */}
                  <line x1={qBreakX} y1={breakMoneyY} x2={qBreakX} y2={padTop + graphHeight} stroke="#0284c7" strokeDasharray="3 3" />
                  <line x1={padLeft} y1={breakMoneyY} x2={qBreakX} y2={breakMoneyY} stroke="#0284c7" strokeDasharray="3 3" />

                  <text
                    x={qBreakX}
                    y={breakMoneyY - 16}
                    textAnchor="middle"
                    className="text-[11px] fill-sky-800 font-bold font-mono"
                  >
                    Punto de Equilibrio: {qBreak.toFixed(0)} uds ({curr} {(calc.breakEven.sales / 1000).toFixed(1)}k)
                  </text>

                  {/* Expected Units marker if exists */}
                  {project.breakEvenConfig?.expectedUnitsSold && (
                    (() => {
                      const expQ = project.breakEvenConfig.expectedUnitsSold;
                      const expX = qToX(expQ);
                      const expY = mToY(expQ * calc.breakEven.sellingPrice);
                      return (
                        <g>
                          <circle cx={expX} cy={expY} r={6} fill="#10b981" />
                          <line x1={expX} y1={expY} x2={expX} y2={padTop + graphHeight} stroke="#10b981" strokeDasharray="2 2" />
                          <text x={expX} y={svgHeight - 16} textAnchor="middle" className="text-[10px] fill-emerald-800 font-bold">
                            Ventas Proyectadas ({expQ} uds)
                          </text>
                        </g>
                      );
                    })()
                  )}

                  {/* X Axis label */}
                  <text x={svgWidth / 2} y={svgHeight - 2} textAnchor="middle" className="text-[11px] fill-slate-500 font-semibold">
                    Volumen de Producción / Ventas (Unidades)
                  </text>
                </svg>
              </div>
            );
          })()}
        </div>
      )}

      {/* Floating tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl border border-slate-700 font-mono"
          style={{ left: hoveredPoint.x, top: hoveredPoint.y }}
        >
          {hoveredPoint.text}
        </div>
      )}
    </div>
  );
};
