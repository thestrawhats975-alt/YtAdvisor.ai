import React from 'react';
import { useOutletContext } from 'react-router-dom';

const VerdictDashboard = () => {
  const { apiPayload } = useOutletContext();
  
  if (!apiPayload) return null; // Defensive check, but strictly handled by layout

  const verdict = apiPayload.verdict || {};
  const market = apiPayload.market || {};

  const marketTruth = market.market_truth;
  const ideaUpgrade = verdict.idea_upgrade;
  const benchmark = verdict.performance_benchmark;
  const outlook = verdict.performance_outlook;
  const channelStrength = verdict.channel_strength;
  const channelRisk = verdict.channel_risk;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-12 pb-16 mt-4">
        
        {/* Mission Reframe -> Idea Upgrade + Market Context */}
        {(ideaUpgrade || marketTruth) && (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#FF0000]" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
              <h2 className="font-headline font-black text-xl tracking-tight uppercase">KEY ANALYSIS</h2>
            </div>
            
            <div className="bg-[#201F1F]/40 backdrop-blur-[20px] border border-[#603E39]/15 p-10 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF0000]/5 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-[#FF0000]/10"></div>
              <div className="relative z-10 space-y-4">
                <span className="text-[#FF0000] text-[0.6875rem] font-black tracking-[0.2em] uppercase font-headline">CORE REFINEMENT</span>
                <h3 className="text-2xl md:text-3xl font-black font-headline text-[#E5E2E1] leading-tight max-w-4xl">{ideaUpgrade || 'Refining for market viability.'}</h3>
                
                {marketTruth && (
                  <div className="pt-4 max-w-2xl">
                    <p className="text-[#E5E2E1]/50 leading-relaxed">
                      <span className="text-[#E5E2E1] font-bold mr-2">MARKET CONTEXT:</span> 
                      {marketTruth}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Cards Row -> Maps to Performance Outlook conditionally */}
        {(benchmark || outlook) && (
          <div className="flex flex-col gap-8">
            <div className="bg-[#1C1B1B] p-8 rounded-sm border-l-2 border-[#FF0000] flex flex-col justify-between">
              <div className="space-y-1">
                <span className="material-symbols-outlined text-[#FF0000]">speed</span>
                <h4 className="text-[0.6875rem] font-bold text-[#FF0000] tracking-widest uppercase font-mono">BENCHMARK</h4>
              </div>
              <div className="space-y-4">
                <p className="text-lg font-bold text-[#E5E2E1] leading-snug">{benchmark}</p>
                <p className="text-xs font-mono text-[#E5E2E1]/40 uppercase tracking-tight">System calculated trajectory based on current input parameters.</p>
              </div>
            </div>
            
            <div className="bg-[#1C1B1B] p-8 rounded-sm flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="material-symbols-outlined text-[#00FF41]">analytics</span>
                  <h4 className="text-[0.6875rem] font-bold text-[#00FF41] tracking-widest uppercase font-mono">OUTLOOK</h4>
                </div>
              </div>
              <p className="text-lg font-bold text-[#E5E2E1] leading-snug">
                  {outlook}
              </p>
            </div>
          </div>
        )}

        {/* Channel Intel */}
        {(channelStrength || channelRisk) && (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[#FF0000]" style={{fontVariationSettings: "'FILL' 1"}}>shield_with_heart</span>
              <h2 className="font-headline font-black text-xl tracking-tight uppercase">CHANNEL ANALYSIS</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {channelStrength && (
                <div className="bg-[#0A0A0A] p-8 space-y-4 border-l-4 border-[#00FF41]">
                  <div className="flex items-center gap-2 text-[#00FF41]">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="text-[0.6875rem] font-black tracking-widest uppercase font-mono">STRENGTH</span>
                  </div>
                  <p className="text-lg font-bold text-[#E5E2E1] leading-snug">{channelStrength}</p>
                </div>
              )}
              {channelRisk && (
                <div className="bg-[#0A0A0A] p-8 space-y-4 border-l-4 border-amber-500">
                  <div className="flex items-center gap-2 text-amber-500">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span className="text-[0.6875rem] font-black tracking-widest uppercase font-mono">RISK</span>
                  </div>
                  <p className="text-lg font-bold text-[#E5E2E1] leading-snug">{channelRisk}</p>
                </div>
              )}
            </div>
          </section>
        )}


      </div>
    );
};

export default VerdictDashboard;
