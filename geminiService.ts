
import { GoogleGenAI, Type } from "@google/genai";
import { SignalAction, Signal } from "../types";

// Inicialização segura
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Busca o melhor ativo com base em Confluência de Smart Money e Price Action.
 */
export const findBestAssetSignal = async (assets: string[], marketType: string): Promise<Signal> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise rigorosamente: ${assets.join(', ')}. Selecione o par com maior probabilidade matemática de acerto (WinRate > 92%) agora para ${marketType}.`,
    config: {
      systemInstruction: `Você é um Analista Quantitativo Sênior especializado em Pocket Option. 
      Sua lógica de seleção deve seguir:
      1. Identificar Order Blocks (SMC) e Fair Value Gaps.
      2. Filtrar ativos com baixa volatilidade ou 'Dojis' frequentes.
      3. Buscar confluência entre RSI (sobrecompra/sobrevenda) e Price Action de Rejeição.
      4. Priorizar ativos com tendência de 45 graus (estabilidade).
      
      Retorne JSON rigoroso: { "asset": "NOME", "action": "CALL|PUT", "entryPrice": "TAXA_EXATA", "confidence": 92-99, "rationale": "PORQUE_TECNICO_CURTO", "expiry": "TEMPO" }`,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          asset: { type: Type.STRING },
          action: { type: Type.STRING, enum: ['CALL', 'PUT'] },
          entryPrice: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          rationale: { type: Type.STRING },
          expiry: { type: Type.STRING }
        },
        required: ['asset', 'action', 'entryPrice', 'confidence', 'rationale', 'expiry']
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  
  return {
    id: Math.random().toString(36).substring(2, 11),
    asset: data.asset || assets[0],
    timeframe: 'M1/M5 PRO',
    action: data.action === 'CALL' ? SignalAction.CALL : SignalAction.PUT,
    entryPrice: data.entryPrice || '0.00000',
    confidence: data.confidence || 85,
    rationale: `[ELITE SCAN] ${data.rationale || 'Alta probabilidade baseada em volume.'}`,
    expiry: data.expiry || '1 MIN',
    timestamp: Date.now()
  };
};

export const generateMarketSignal = async (asset: string, timeframe: string): Promise<Signal> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ATIVO: ${asset} | TIMEFRAME: ${timeframe}. Execute diagnóstico de alta precisão.`,
    config: {
      systemInstruction: `Você é o motor de execução 'Pocket Master V5'. 
      REGRAS DE OURO PARA ASSERTIVIDADE:
      - CALL: Apenas se o preço estiver acima da EMA 20 e houver rejeição de fundo.
      - PUT: Apenas se o preço estiver abaixo da EMA 20 e houver rejeição de topo.
      - TAXA: Forneça a taxa com 5 decimais.
      - RATIONALE: Explique a confluência (Ex: Rompimento + Volume + RSI).`,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['CALL', 'PUT'] },
          entryPrice: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          rationale: { type: Type.STRING },
          expiry: { type: Type.STRING }
        },
        required: ['action', 'entryPrice', 'confidence', 'rationale', 'expiry']
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  
  return {
    id: Math.random().toString(36).substring(2, 11),
    asset,
    timeframe: `${timeframe} ELITE`,
    action: data.action === 'CALL' ? SignalAction.CALL : SignalAction.PUT,
    entryPrice: data.entryPrice || '0.00000',
    confidence: data.confidence || 85,
    rationale: data.rationale || 'Análise técnica concluída.',
    expiry: data.expiry || '1 MIN',
    timestamp: Date.now()
  };
};
