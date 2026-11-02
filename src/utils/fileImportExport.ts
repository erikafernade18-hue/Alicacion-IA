import * as XLSX from 'xlsx';
import { CashFlowItem, InvestmentProject, FinancialCalculationResult } from '../types/finance';

export interface ImportParseResult {
  success: boolean;
  flows?: CashFlowItem[];
  suggestedName?: string;
  suggestedInvestment?: number;
  error?: string;
  detectedFormat?: string;
}

/**
 * Parses an uploaded Excel or CSV file into CashFlowItem array.
 */
export async function parseCashFlowFile(file: File): Promise<ImportParseResult> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, error: 'El archivo está vacío o no contiene hojas válidas.' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert sheet to array of rows
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, error: 'La hoja de cálculo no contiene filas legibles.' };
    }

    // Try to locate headers
    let headerRowIndex = -1;
    let periodCol = -1;
    let flowCol = -1;
    let revCol = -1;
    let varCostCol = -1;
    let fixExpCol = -1;
    let deprCol = -1;
    let notesCol = -1;

    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c]).toLowerCase().trim();
        if (cell.includes('period') || cell.includes('año') || cell.includes('mes') || cell.includes('ano') || cell === 't') {
          periodCol = c;
          headerRowIndex = r;
        }
        if (cell.includes('flujo') || cell.includes('cash') || cell.includes('neto') || cell.includes('fne') || cell.includes('flow')) {
          flowCol = c;
          headerRowIndex = r;
        }
        if (cell.includes('ingreso') || cell.includes('venta') || cell.includes('revenue')) {
          revCol = c;
        }
        if (cell.includes('costo') || cell.includes('cost')) {
          varCostCol = c;
        }
        if (cell.includes('gasto') || cell.includes('fijo') || cell.includes('expense')) {
          fixExpCol = c;
        }
        if (cell.includes('deprec') || cell.includes('amort')) {
          deprCol = c;
        }
        if (cell.includes('nota') || cell.includes('descrip') || cell.includes('comment')) {
          notesCol = c;
        }
      }

      if (flowCol !== -1) {
        break;
      }
    }

    const parsedFlows: CashFlowItem[] = [];
    let detectedInvestment: number | undefined;

    // If headers were found
    if (headerRowIndex !== -1 && flowCol !== -1) {
      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let periodNum = parsedFlows.length + 1;
        if (periodCol !== -1 && row[periodCol] !== undefined && row[periodCol] !== '') {
          const parsedPeriod = parseInt(String(row[periodCol]).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsedPeriod)) periodNum = parsedPeriod;
        }

        const rawFlowVal = row[flowCol];
        if (rawFlowVal === undefined || rawFlowVal === '') continue;

        const cleanVal = typeof rawFlowVal === 'number'
          ? rawFlowVal
          : parseFloat(String(rawFlowVal).replace(/[^\d.-]/g, ''));

        if (isNaN(cleanVal)) continue;

        // If period is 0 and negative, it might be initial investment
        if (periodNum === 0 && cleanVal < 0) {
          detectedInvestment = Math.abs(cleanVal);
          continue;
        }

        const item: CashFlowItem = {
          period: periodNum,
          netFlow: cleanVal,
        };

        if (revCol !== -1 && row[revCol] !== undefined) {
          const rev = parseFloat(String(row[revCol]).replace(/[^\d.-]/g, ''));
          if (!isNaN(rev)) item.revenue = rev;
        }
        if (varCostCol !== -1 && row[varCostCol] !== undefined) {
          const vc = parseFloat(String(row[varCostCol]).replace(/[^\d.-]/g, ''));
          if (!isNaN(vc)) item.variableCosts = vc;
        }
        if (fixExpCol !== -1 && row[fixExpCol] !== undefined) {
          const fe = parseFloat(String(row[fixExpCol]).replace(/[^\d.-]/g, ''));
          if (!isNaN(fe)) item.fixedExpenses = fe;
        }
        if (deprCol !== -1 && row[deprCol] !== undefined) {
          const dp = parseFloat(String(row[deprCol]).replace(/[^\d.-]/g, ''));
          if (!isNaN(dp)) item.depreciation = dp;
        }
        if (notesCol !== -1 && row[notesCol]) {
          item.notes = String(row[notesCol]).trim();
        }

        parsedFlows.push(item);
      }
    } else {
      // Fallback: parse single column of numbers
      let pCount = 1;
      for (let r = 0; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (typeof cell === 'number') {
            if (pCount === 1 && cell < 0) {
              detectedInvestment = Math.abs(cell);
            } else {
              parsedFlows.push({ period: pCount, netFlow: cell });
              pCount++;
            }
          } else if (typeof cell === 'string') {
            const num = parseFloat(cell.replace(/[^\d.-]/g, ''));
            if (!isNaN(num) && num !== 0) {
              if (pCount === 1 && num < 0) {
                detectedInvestment = Math.abs(num);
              } else {
                parsedFlows.push({ period: pCount, netFlow: num });
                pCount++;
              }
            }
          }
        }
      }
    }

    if (parsedFlows.length === 0) {
      return {
        success: false,
        error: 'No se detectaron flujos numéricos válidos en el archivo. Verifica que las celdas contengan valores monetarios.',
      };
    }

    // Sort by period
    parsedFlows.sort((a, b) => a.period - b.period);

    // Re-index periods to be continuous 1..N if needed
    parsedFlows.forEach((item, index) => {
      item.period = index + 1;
    });

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    return {
      success: true,
      flows: parsedFlows,
      suggestedName: fileName,
      suggestedInvestment: detectedInvestment,
      detectedFormat: file.name.endsWith('.csv') ? 'CSV' : 'Excel',
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error al procesar el archivo: ${err?.message || 'Formato no soportado'}`,
    };
  }
}

/**
 * Generates and downloads a CSV template for easy data entry.
 */
export function downloadCashFlowTemplate() {
  const headers = ['Periodo', 'Flujo_Neto', 'Ingresos', 'Costos_Variables', 'Gastos_Fijos', 'Depreciacion', 'Notas'];
  const sampleData = [
    [1, 50000, 150000, 70000, 30000, 10000, 'Año 1'],
    [2, 70000, 180000, 80000, 30000, 10000, 'Año 2'],
    [3, 90000, 210000, 90000, 30000, 10000, 'Año 3'],
    [4, 110000, 240000, 100000, 30000, 10000, 'Año 4'],
    [5, 130000, 270000, 110000, 30000, 10000, 'Año 5'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Flujos');
  XLSX.writeFile(wb, 'Plantilla_Flujos_FINANCIA_IA.xlsx');
}

/**
 * Exports complete project calculation details to CSV.
 */
export function exportCalculationToCSV(project: InvestmentProject, calc: FinancialCalculationResult) {
  const headers = [
    'Periodo',
    'Flujo Nominal',
    'Factor Descuento',
    'Flujo Descontado',
    'Acumulado Nominal',
    'Acumulado Descontado',
  ];

  const rows = calc.periodSteps.map((step) => [
    step.period === 0 ? '0 (Inversión Inicial)' : step.period,
    step.nominalFlow.toFixed(2),
    step.discountFactor.toFixed(6),
    step.discountedFlow.toFixed(2),
    step.cumulativeNominal.toFixed(2),
    step.cumulativeDiscounted.toFixed(2),
  ]);

  const summaryRows = [
    [],
    ['INDICADORES FINANCIEROS CLAVE'],
    ['Proyecto', project.name],
    ['Moneda', project.currency],
    ['Tasa de Descuento Anual', `${(calc.effectiveAnnualRate * 100).toFixed(2)}%`],
    ['Tasa Periódica Aplicada', `${(calc.periodicRate * 100).toFixed(4)}%`],
    ['Valor Presente Neto (VPN)', calc.npv.toFixed(2)],
    ['Tasa Interna de Retorno (TIR)', calc.irr !== null ? `${(calc.irr * 100).toFixed(2)}%` : 'N/A'],
    ['Tasa Interna Modificada (TIRM)', calc.mirr !== null ? `${(calc.mirr * 100).toFixed(2)}%` : 'N/A'],
    ['PRI Simple (Períodos)', calc.paybackPeriod !== null ? calc.paybackPeriod.toFixed(2) : 'No recupera'],
    ['PRI Descontado (Períodos)', calc.discountedPaybackPeriod !== null ? calc.discountedPaybackPeriod.toFixed(2) : 'No recupera'],
    ['Relación Beneficio / Costo (B/C)', calc.benefitCostRatio.toFixed(3)],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, ...summaryRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Evaluacion_Financiera');
  XLSX.writeFile(wb, `Reporte_${project.name.replace(/\s+/g, '_')}_FINANCIA_IA.xlsx`);
}

/**
 * Exports project definition to JSON file.
 */
export function exportProjectToJSON(project: InvestmentProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Proyecto_${project.name.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
