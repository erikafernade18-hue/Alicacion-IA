import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'FINANCIA IA',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Gemini AI Diagnostic endpoint
app.post('/api/gemini/diagnose', async (req, res) => {
  try {
    const { projectData, calculations, scenarios } = req.body;

    if (!projectData || !calculations) {
      return res.status(400).json({ error: 'Faltan datos del proyecto o cálculos matemáticos.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'API key no configurada',
        message: 'No se detectó GEMINI_API_KEY en las variables de entorno. Se puede configurar en Settings > Secrets.',
        useFallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Eres un Director Financiero (CFO) y Consultor Senior de Banca de Inversión con más de 20 años de experiencia evaluando proyectos empresariales.
Analiza con rigor técnico el siguiente proyecto de inversión utilizando ESTRICTAMENTE los resultados matemáticos calculados por el motor financiero del sistema:

--- DATOS DEL PROYECTO ---
Nombre: ${projectData.name}
Descripción: ${projectData.description || 'Sin descripción adicional'}
Moneda: ${projectData.currency}
Inversión Inicial (I0): ${projectData.currency} ${calculations.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
Horizonte de Evaluación: ${projectData.horizon} ${projectData.periodType === 'monthly' ? 'meses' : projectData.periodType === 'quarterly' ? 'trimestres' : projectData.periodType === 'semiannual' ? 'semestres' : 'años'}
Tasa de Descuento (k): ${(calculations.effectiveAnnualRate * 100).toFixed(2)}% anual (Tasa periódica aplicada: ${(calculations.periodicRate * 100).toFixed(4)}%)
Tipo de Tasa: ${projectData.rateType === 'effective' ? 'Efectiva' : 'Nominal'} (${projectData.periodType})

--- RESULTADOS MATEMÁTICOS DEL MOTOR ---
1. Valor Presente Neto (VPN / VAN): ${projectData.currency} ${calculations.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
   Estado VPN: ${calculations.npv > 0 ? 'Genera valor / Aceptable' : calculations.npv === 0 ? 'Indiferente / Cubre costo de capital' : 'Destruye valor / Rechazable'}
2. Tasa Interna de Retorno (TIR): ${calculations.irr !== null ? (calculations.irr * 100).toFixed(2) + '%' : 'No calculable o flujos no convencionales'}
   Spread TIR vs Tasa Descuento: ${calculations.irr !== null ? ((calculations.irr - calculations.periodicRate) * 100).toFixed(2) + ' puntos porcentuales por período' : 'N/A'}
3. Tasa Interna de Retorno Modificada (TIRM): ${calculations.mirr !== null ? (calculations.mirr * 100).toFixed(2) + '%' : 'N/A'}
4. Período de Recuperación de Inversión Simple (PRI): ${calculations.paybackPeriod !== null ? calculations.paybackPeriod.toFixed(2) + ' períodos' : 'No se recupera en el horizonte'}
5. Período de Recuperación Descontado (PRI Descontado): ${calculations.discountedPaybackPeriod !== null ? calculations.discountedPaybackPeriod.toFixed(2) + ' períodos' : 'No se recupera en el horizonte'}
6. Relación Beneficio / Costo (B/C): ${calculations.benefitCostRatio.toFixed(3)} (Criterio: ${calculations.benefitCostRatio > 1 ? 'Viable (>1)' : 'Desfavorable (<1)'})
7. Punto de Equilibrio: ${calculations.breakEven ? `Unidades: ${calculations.breakEven.units.toFixed(0)}, Ventas: ${projectData.currency} ${calculations.breakEven.sales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}, Margen de Seguridad: ${(calculations.breakEven.safetyMargin * 100).toFixed(1)}%` : 'No configurado'}

--- FLUJOS DE CAJA NETOS (Período 0 a ${calculations.cashFlows.length - 1}) ---
${calculations.cashFlows.map((f: number, i: number) => `t=${i}: ${projectData.currency} ${f.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`).join(', ')}

${scenarios ? `--- ESCENARIOS EVALUADOS ---
Pesimista: VPN = ${projectData.currency} ${scenarios.pessimistic.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}, TIR = ${scenarios.pessimistic.irr !== null ? (scenarios.pessimistic.irr * 100).toFixed(2) + '%' : 'N/A'}
Base: VPN = ${projectData.currency} ${scenarios.base.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}, TIR = ${scenarios.base.irr !== null ? (scenarios.base.irr * 100).toFixed(2) + '%' : 'N/A'}
Optimista: VPN = ${projectData.currency} ${scenarios.optimistic.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}, TIR = ${scenarios.optimistic.irr !== null ? (scenarios.optimistic.irr * 100).toFixed(2) + '%' : 'N/A'}` : ''}

INSTRUCCIONES CLAVE:
- NO inventes cifras distintas a las calculadas. Usa con fidelidad los valores proporcionados.
- Responde en formato JSON estricto y válido conforme a la siguiente estructura:
{
  "verdict": "APROBADO" | "CONDICIONADO" | "RECHAZADO",
  "financialScore": number (de 0 a 100, evaluando solidez, rentabilidad y riesgo),
  "executiveSummary": "Resumen ejecutivo directo de 2-3 párrafos con veredicto, viabilidad y retorno.",
  "indicatorsAnalysis": {
    "npvInterpretation": "Análisis profundo del VPN y la creación de riqueza neta.",
    "irrInterpretation": "Análisis de la TIR frente a la tasa de descuento (WACC/TMAR).",
    "paybackInterpretation": "Análisis de la velocidad de recuperación de capital (simple vs descontado) y exposición al riesgo temporal.",
    "benefitCostInterpretation": "Análisis del retorno por cada unidad monetaria invertida."
  },
  "strengths": ["Fortaleza financiera 1", "Fortaleza financiera 2", "Fortaleza financiera 3"],
  "weaknesses": ["Debilidad o riesgo 1", "Debilidad o riesgo 2", "Debilidad o riesgo 3"],
  "riskEvaluation": {
    "liquidityRisk": "Bajo" | "Medio" | "Alto",
    "rateSensitivityRisk": "Bajo" | "Medio" | "Alto",
    "marketRisk": "Bajo" | "Medio" | "Alto",
    "riskSummary": "Evaluación condensada del perfil de riesgo global."
  },
  "scenariosCommentary": "Comentario sobre la resiliencia en escenarios pesimista y optimista.",
  "strategicRecommendations": [
    "Recomendación estratégica o correctiva 1",
    "Recomendación estratégica o correctiva 2",
    "Recomendación estratégica o correctiva 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // Regex cleanup in case of markdown block wrap
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      diagnostic: parsedData,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/diagnose:', error);
    return res.status(500).json({
      error: 'Error al generar el diagnóstico con IA',
      details: error?.message || String(error),
      useFallback: true,
    });
  }
});

// Gemini AI Chat Consultation endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, projectData, calculations, conversationHistory } = req.body;

    if (!message || !projectData || !calculations) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'API key no configurada',
        message: 'Configura GEMINI_API_KEY en Settings > Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextPrompt = `Eres FINANCIA IA, el asesor financiero inteligente integrado en la aplicación de evaluación de proyectos.
Estás asesorando al usuario sobre su proyecto actual:
- Proyecto: ${projectData.name} (${projectData.description || 'Sin descripción'})
- Moneda: ${projectData.currency}
- Inversión Inicial: ${projectData.currency} ${calculations.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
- VPN: ${projectData.currency} ${calculations.npv.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
- TIR: ${calculations.irr !== null ? (calculations.irr * 100).toFixed(2) + '%' : 'N/A'}
- Tasa de Descuento: ${(calculations.effectiveAnnualRate * 100).toFixed(2)}% anual
- PRI Descontado: ${calculations.discountedPaybackPeriod !== null ? calculations.discountedPaybackPeriod.toFixed(2) + ' períodos' : 'No recupera'}
- B/C: ${calculations.benefitCostRatio.toFixed(3)}
- Flujos Netos: ${calculations.cashFlows.map((f: number, i: number) => `P${i}: ${f}`).join(', ')}

Responde de manera profesional, precisa, didáctica y financiera a la consulta del usuario.
Si el usuario pregunta sobre cambios de supuestos, explícale el impacto financiero y conceptual. Sé conciso pero riguroso.`;

    const chatMessages: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        chatMessages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    chatMessages.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatMessages,
      config: {
        systemInstruction: contextPrompt,
      },
    });

    return res.json({
      success: true,
      reply: response.text || 'Sin respuesta del modelo.',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({
      error: 'Error al consultar al asistente financiero',
      details: error?.message || String(error),
    });
  }
});

// Compare Projects with AI
app.post('/api/gemini/compare', async (req, res) => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects) || projects.length < 2) {
      return res.status(400).json({ error: 'Se requieren al menos 2 proyectos para comparar.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'API key no configurada',
        useFallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const summaryText = projects.map((p: any, idx: number) => `
Proyecto #${idx + 1}: ${p.projectData.name}
- Inversión Inicial: ${p.projectData.currency} ${p.calculations.initialInvestment}
- VPN: ${p.projectData.currency} ${p.calculations.npv.toFixed(2)}
- TIR: ${p.calculations.irr !== null ? (p.calculations.irr * 100).toFixed(2) + '%' : 'N/A'}
- PRI Descontado: ${p.calculations.discountedPaybackPeriod !== null ? p.calculations.discountedPaybackPeriod.toFixed(2) : 'No recupera'}
- B/C: ${p.calculations.benefitCostRatio.toFixed(3)}
- Tasa Descuento: ${(p.calculations.effectiveAnnualRate * 100).toFixed(2)}%
    `).join('\n');

    const prompt = `Eres un asesor de comités de inversiones corporativas. Compara los siguientes proyectos evaluados matemáticamente:
${summaryText}

Devuelve un JSON con:
{
  "bestOption": "Nombre del proyecto recomendado",
  "ranking": ["Nombre 1° lugar", "Nombre 2° lugar", ...],
  "comparativeAnalysis": "Análisis detallado de compensaciones entre VPN absoluto, rentabilidad relativa (TIR), velocidad de liquidez (PRI) y relación B/C.",
  "capitalRationingAdvice": "Consejos si el capital es limitado frente a si los proyectos son mutuamente excluyentes o independientes.",
  "fischerRateNote": "Observación sobre el cruce de Fisher o sensibilidad ante variaciones de la tasa de costo de capital."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      comparison: parsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/compare:', error);
    return res.status(500).json({
      error: 'Error al comparar con IA',
      useFallback: true,
    });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FINANCIA IA server running on port ${PORT}`);
});
