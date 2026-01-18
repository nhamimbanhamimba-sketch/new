
import React, { memo, useState, useEffect } from 'react';
import { Signal, SignalAction } from '../types';

interface SignalCardProps {
  signal: Signal;
  onClose: (id: string) => void;
  onResult: (result: 'win' | 'loss') => void;
}

const SignalCard: React.FC<SignalCardProps> = memo(({ signal, onClose, onResult }) => {
  const [status, setStatus] = useState<'pending' | 'checking' | 'win' | 'loss'>('pending');
  const isCall = signal.action === SignalAction.CALL;

  useEffect(() => {
    // Simulação visual de checagem após 8 segundos
    const timer = setTimeout(() => {
      setStatus('checking');
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenBroker = () => {
    window.open('https://pocketoption.com/smart-chart/', '_blank');
  };

  return (
    <div className={`bg-[#111827] rounded-3xl overflow-hidden border shadow-2xl mb-4 max-w-md mx-auto transform transition-all duration-500 animate-fade-in border-slate-800`}>
      {/* Badge de Alta Assertividade */}
      <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
          <span className="font-black text-blue-400 text-[9px] uppercase tracking-[0.2em]">Sinal Verificado IA</span>
        </div>
        <div className="flex space-x-1">
          <div className="w-1 h-3 bg-blue-500/40 rounded-full"></div>
          <div className="w-1 h-3 bg-blue-500/70 rounded-full"></div>
          <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
        </div>
      </div>
      
      <div className="p-5 space-y-4 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase leading-none">{signal.asset}</h3>
            <div className="flex items-center mt-1.5 space-x-2">
              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black border border-blue-500/20 uppercase">{signal.timeframe}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Protocolo V5</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[8px] text-slate-500 font-black uppercase mb-1">Confiança IA</div>
            <div className="text-xl font-black text-blue-500 leading-none">{signal.confidence}%</div>
          </div>
        </div>

        {/* Triple Confluence Indicators */}
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {['TÉCNICA', 'VOLUME', 'IA'].map((label) => (
            <div key={label} className="bg-slate-900/50 border border-slate-800 rounded-lg py-1 flex flex-col items-center">
              <span className="text-[6px] text-slate-500 font-black mb-0.5">{label}</span>
              <div className="w-5 h-1 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
            </div>
          ))}
        </div>

        <div className={`text-center py-6 rounded-2xl border transition-all duration-700 ${
          isCall ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'
        }`}>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ação Sugerida</div>
          <div className={`text-5xl font-black italic tracking-tighter transition-all ${
            isCall ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]'
          }`}>
            {isCall ? 'COMPRAR' : 'VENDER'}
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
            <span className="text-[9px] text-slate-500 font-black uppercase">Taxa de Entrada</span>
            <span className="font-mono font-bold text-white text-sm tracking-wider">{signal.entryPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500 font-black uppercase">Expiração</span>
            <span className="font-mono font-bold text-white text-sm tracking-wider">{signal.expiry}</span>
          </div>
        </div>

        <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 italic">
          <p className="text-[9px] text-slate-400 leading-relaxed font-medium">"{signal.rationale}"</p>
        </div>

        <div className="space-y-2 pt-2">
          <button 
            onClick={handleOpenBroker}
            className={`w-full py-4 rounded-xl font-black text-[11px] transition-all flex items-center justify-center space-x-2 shadow-xl border-b-4 border-black/30 active:border-b-0 active:translate-y-1 uppercase tracking-widest ${
              isCall ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            <span>OPERAR NA POCKET OPTION</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>

          <button 
            onClick={() => onClose(signal.id)}
            className="w-full py-3 rounded-xl font-black text-[10px] text-slate-500 hover:text-white border border-slate-800 hover:bg-slate-800 transition-all uppercase tracking-widest mt-2"
          >
            FECHAR RELATÓRIO
          </button>
        </div>
      </div>
    </div>
  );
});

export default SignalCard;
