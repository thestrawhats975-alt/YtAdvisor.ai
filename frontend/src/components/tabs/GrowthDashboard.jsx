import React from 'react';
import { useOutletContext } from 'react-router-dom';

const GrowthDashboard = () => {
  const { apiPayload } = useOutletContext();
  if (!apiPayload) return null;

  const growth = apiPayload.growth || {};
  const verdict = apiPayload.verdict || {};

  const postPublishStrategy = growth.pinned_comment || growth.community_post_seed;
  const performanceOutlook = verdict.performance_outlook || verdict.series_positioning || growth.series_positioning;
  const nextVideos = growth.next_video_series || [];

  return (
    <div className="w-full pb-32 scroll-smooth bg-[#0a0a0a]">
       <div className="p-12 space-y-16 max-w-7xl mx-auto w-full">
         
         <div className="flex items-center gap-3">
           <h2 className="text-[#970100] font-mono text-xs font-bold uppercase tracking-[0.2em]">GROWTH STRATEGY</h2>
         </div>

         {/* POST-PUBLISH STRATEGY (Replaces static Pinned Comment) */}
         {postPublishStrategy && (
            <section className="space-y-4">
               <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2 text-[#970100]">
                   <span className="material-symbols-outlined text-lg" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>
                   <span className="font-mono text-xs font-bold uppercase">POST-PUBLISH STRATEGY</span>
                 </div>
               </div>
               <div className="relative group bg-[#1c1b1b] p-6 rounded-sm border-l-2 border-[#970100]/50 hover:bg-[#201f1f] transition-all shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                 <button className="absolute top-4 right-4 text-[#e5e2e1]/40 hover:text-[#27ae60] transition-colors focus:outline-none focus:text-[#27ae60] active:scale-95">
                   <span className="material-symbols-outlined">content_copy</span>
                 </button>
                 <div className="pl-4 border-l-2 border-[#353534]">
                   <p className="text-[#e5e2e1] leading-relaxed text-sm md:text-base font-body tracking-wide pr-8">
                      {postPublishStrategy}
                   </p>
                   <div className="mt-4 flex items-center gap-2 text-[#e5e2e1]/40 text-[11px] font-mono border-t border-[#353534] pt-2 max-w-fit">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Execute immediately upon launch.
                   </div>
                 </div>
               </div>
            </section>
         )}

         {/* SERIES POSITIONING (Maps to Performance Outlook) */}
         {performanceOutlook && (
            <section className="bg-[#1c1b1b] p-8 md:p-12 rounded-sm border-l-4 border-[#970100] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-2 text-[#970100] mb-6">
                 <span className="material-symbols-outlined text-lg">radar</span>
                 <span className="font-mono text-xs font-bold uppercase tracking-widest">30-DAY OUTLOOK</span>
               </div>
               <p className="text-[#e5e2e1] font-headline text-2xl md:text-3xl font-medium leading-tight max-w-4xl tracking-tight">
                   "{performanceOutlook.trim()}"
               </p>
            </section>
         )}

         {/* CONTENT ROADMAP (Restored section) */}
         {nextVideos.length > 0 && (
           <section className="space-y-8">
             <div className="flex items-center gap-2 text-[#970100]">
                <span className="material-symbols-outlined text-lg">alt_route</span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest">CONTENT ROADMAP</span>
             </div>
             <div className="flex flex-col gap-6">
               {nextVideos.map((video, idx) => (
                 <div key={idx} className="bg-[#1c1b1b] p-8 border border-[#353534] hover:border-[#970100]/30 transition-all rounded-sm flex flex-col justify-between group">
                   <div className="space-y-4">
                     <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-[#970100] uppercase tracking-[0.2em]">PRIORITY 0{video.priority || idx + 1}</span>
                        <span className="material-symbols-outlined text-xs text-[#e5e2e1]/20">trending_up</span>
                     </div>
                     <h3 className="text-xl font-headline font-bold text-[#e5e2e1] leading-tight group-hover:text-[#970100] transition-colors">{video.title}</h3>
                     <p className="text-sm text-[#e5e2e1]/40 font-body leading-relaxed">{video.strategic_reason}</p>
                   </div>
                   <div className="mt-8 pt-4 border-t border-[#353534] flex justify-end">
                      <span className="text-[9px] font-mono text-[#e5e2e1]/20 uppercase tracking-[0.3em]">STRATEGY READY</span>
                   </div>
                 </div>
               ))}
             </div>
           </section>
         )}

       </div>
    </div>
  );
};

export default GrowthDashboard;
