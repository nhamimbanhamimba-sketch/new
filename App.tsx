
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ASSETS_REALTIME, ASSETS_OTC, ANALYSIS_STEPS, SCAN_STEPS } from './constants';
import { Signal, AnalysisState, SignalAction } from './types';
import SignalCard from './components/SignalCard';
import { GoogleGenAI, Type } from "@google/genai";

// Serviço integrado para evitar erros de importação no build do Vercel
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const generateMarketSignal = async (asset: string, timeframe: string): Promise<Signal> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ATIVO: ${asset} | TIMEFRAME: ${timeframe}. Execute diagnóstico de alta precisão para Pocket Option.`,
    config: {
      systemInstruction: "Você é um bot de sinais de elite. Retorne apenas JSON.",
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
    rationale: data.rationale || 'Análise concluída.',
    expiry: data.expiry || '1 MIN',
    timestamp: Date.now()
  };
};

const findBestAssetSignal = async (assets: string[], marketType: string): Promise<Signal> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise: ${assets.join(', ')} para ${marketType}. Escolha o melhor.`,
    config: {
      systemInstruction: "Selecione o melhor par para operar agora. Retorne apenas JSON.",
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
    rationale: `[RECOMENDAÇÃO] ${data.rationale}`,
    expiry: data.expiry || '1 MIN',
    timestamp: Date.now()
  };
};

const EXPIRY_OPTIONS = ['1', '2', '3', '5', '10', '15'];

const App: React.FC = () => {
  const [view, setView] = useState<'market-selection' | 'asset-selection' | 'expiry-selection' | 'analysis' | 'results'>('market-selection');
  const [marketType, setMarketType] = useState<'STOCK' | 'OTC'>('OTC');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [isRecommendationMode, setIsRecommendationMode] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState({ win: 142, loss: 12 });
  const [isFindingBest, setIsFindingBest] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
      setIsTelegram(true);
    }
  }, []);

  const removeSignal = useCallback((id: string) => {
    setSignals(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleSignalResult = useCallback((result: 'win' | 'loss') => {
    setStats(prev => ({
      win: result === 'win' ? prev.win + 1 : prev.win,
      loss: result === 'loss' ? prev.loss + 1 : prev.loss
    }));
  }, []);

  const handleRecommendationClick = async (mType: 'STOCK' | 'OTC') => {
    setMarketType(mType);
    setIsFindingBest(true);
    setView('analysis');
    try {
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        setAnalysis({ isAnalyzing: true, progress: ((i + 1) / SCAN_STEPS.length) * 100, currentStep: SCAN_STEPS[i] });
        await new Promise(r => setTimeout(r, 400));
        if (i === 3) {
          const assetsToScan = mType === 'STOCK' ? ASSETS_REALTIME : ASSETS_OTC;
          const tempSignal = await findBestAssetSignal(assetsToScan, mType);
          setSelectedAsset(tempSignal.asset);
        }
      }
      setIsFindingBest(false);
      setIsRecommendationMode(true);
      setView('expiry-selection');
    } catch (e) { setView('market-selection'); }
  };

  const handleAssetSelect = (asset: string) => {
    setSelectedAsset(asset);
    setIsRecommendationMode(false);
    setView('expiry-selection');
  };

  const startAnalysis = async (expiry: string) => {
    setView('analysis');
    try {
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        setAnalysis({ isAnalyzing: true, progress: ((i + 1) / ANALYSIS_STEPS.length) * 100, currentStep: ANALYSIS_STEPS[i] });
        await new Promise(r => setTimeout(r, 300));
      }
      const newSignal = await generateMarketSignal(selectedAsset, `M${expiry}`);
      setSignals(prev => [newSignal, ...prev]);
      setView('results');
    } catch (e) { setView('market-selection'); }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center font-sans overflow-hidden p-0">
      <div className="w-full max-w-[450px] h-full flex flex-col bg-[#06080a] relative overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-[#0b1118] p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            {view !== 'market-selection' && (
              <button onClick={() => setView('market-selection')} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
            <div className="font-black text-sm tracking-tighter">POCKET AI <span className="text-blue-500">V5</span></div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">WIN: {stats.win} | LOSS: {stats.loss}</div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {view === 'market-selection' && (
            <div className="space-y-4 pt-10">
              <div className="text-center mb-10">
                <h1 className="text-5xl font-black italic tracking-tighter">ELITE ENGINE</h1>
                <p className="text-blue-500 text-[10px] font-black tracking-[0.3em] mt-2 uppercase">Sistemas Quantitativos</p>
              </div>
              <button onClick={() => { setMarketType('STOCK'); setView('asset-selection'); }} className="w-full bg-slate-900 p-6 rounded-2xl font-black border border-slate-800 hover:bg-blue-600 transition-all uppercase italic">Mercado Real (Forex)</button>
              <button onClick={() => { setMarketType('OTC'); setView('asset-selection'); }} className="w-full bg-slate-900 p-6 rounded-2xl font-black border border-slate-800 hover:bg-emerald-600 transition-all uppercase italic">Pocket OTC</button>
              <div className="pt-10 space-y-2">
                <button onClick={() => handleRecommendationClick('STOCK')} className="w-full bg-blue-500/10 text-blue-500 p-4 rounded-xl font-black text-[11px] border border-blue-500/20 uppercase italic">Scan Melhor Ativo Real</button>
                <button onClick={() => handleRecommendationClick('OTC')} className="w-full bg-emerald-500/10 text-emerald-500 p-4 rounded-xl font-black text-[11px] border border-emerald-500/20 uppercase italic">Scan Melhor Ativo OTC</button>
              </div>
            </div>
          )}

          {view === 'asset-selection' && (
            <div className="grid grid-cols-1 gap-2 pt-4">
              {(marketType === 'STOCK' ? ASSETS_REALTIME : ASSETS_OTC).map(asset => (
                <button key={asset} onClick={() => handleAssetSelect(asset)} className="bg-slate-900 p-4 rounded-xl text-left font-black text-xs border border-slate-800 flex justify-between uppercase italic">
                  <span>{asset}</span>
                  <span className="text-green-500">98% PAYOUT</span>
                </button>
              ))}
            </div>
          )}

          {view === 'expiry-selection' && (
            <div className="pt-10 space-y-6">
              <div className="text-center">
                <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">Timing de Operação</div>
                <h2 className="text-3xl font-black italic uppercase">{selectedAsset}</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {EXPIRY_OPTIONS.map(time => (
                  <button key={time} onClick={() => startAnalysis(time)} className="bg-slate-900 p-6 rounded-2xl font-black text-xl border border-slate-800 hover:bg-blue-600 transition-all">
                    {time}<span className="text-[10px] block opacity-50">MIN</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'analysis' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest animate-pulse">{analysis.currentStep}</p>
                <div className="w-48 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${analysis.progress}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {view === 'results' && (
            <div className="space-y-4">
              {signals.map(s => <SignalCard key={s.id} signal={s} onClose={removeSignal} onResult={handleSignalResult} />)}
            </div>
          )}
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default App;
