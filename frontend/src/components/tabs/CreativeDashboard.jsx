import React from 'react';
import { useOutletContext } from 'react-router-dom';

const CreativeDashboard = () => {
  const { apiPayload } = useOutletContext();
  
  if (!apiPayload) return null;

  const strategist = apiPayload.strategist || {};

  // Extract strictly dynamic fields from the backend JSON object mapped to "strategist"
  const exactHookScript = strategist.exact_hook_script;
  const titlePsychology = strategist.title_psychology;
  const thumbnailPrompt = strategist.thumbnail_contrast_prompt;

  return (
    <div className="p-10 max-w-7xl mx-auto w-full space-y-12 pb-24 relative">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-4">
        <span className="px-2 py-1 bg-[#970100]/20 text-[#970100] text-[10px] font-black tracking-widest uppercase rounded-sm border border-[#970100]/30">MODULE 03</span>
        <h2 className="text-[#970100] font-headline font-bold text-sm uppercase tracking-[0.3em]">CREATIVE PACKAGE</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#970100]/30 to-transparent"></div>
      </div>

      {/* EXACT HOOK SCRIPT & PSYCHOLOGY CARD */}
      {(exactHookScript || titlePsychology) && (
        <section className="relative group mt-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#970100] to-transparent opacity-20 rounded-sm blur transition duration-1000 group-hover:opacity-40"></div>
          <div className="relative bg-[#0e0e0e] border border-[#970100]/50 p-12 text-center flex flex-col items-center justify-center min-h-[320px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
            {exactHookScript && (
              <>
                <span className="text-[#970100] font-label text-[9px] font-black uppercase tracking-[0.4em] mb-6">EXACT HOOK SCRIPT</span>
                <h3 className="text-3xl md:text-5xl font-headline font-extrabold text-[#e5e2e1] leading-tight tracking-tighter max-w-4xl uppercase">
                   "{exactHookScript}"
                </h3>
              </>
            )}

            {titlePsychology && (
              <div className="mt-12 flex flex-col items-center">
                <p className="text-[#e5e2e1]/60 italic font-body text-lg max-w-3xl leading-relaxed">
                    {titlePsychology}
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <span className="w-12 h-px bg-[#603e39]/30"></span>
                  <span className="text-[#970100] font-label text-[10px] font-bold uppercase tracking-widest">TITLE & HOOK PSYCHOLOGY</span>
                  <span className="w-12 h-px bg-[#603e39]/30"></span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* THUMBNAIL BRIEF */}
      {thumbnailPrompt && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* CONCEPT CARD */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#970100]">brush</span>
              <span className="text-[#e5e2e1] font-headline font-bold uppercase tracking-widest text-xs">THUMBNAIL CONCEPT</span>
            </div>
            <div className="aspect-video bg-[#2a2a2a] rounded-sm overflow-hidden border border-[#603e39]/15 relative group">
              {/* Note: I kept the abstract reference image from the design since we don't have a generated image yet */}
              <img alt="Thumbnail Base Graphic" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHWC00zj1mcftkNqWSiBIf0JK_MXGcMirN5aEJKyJwCtZGySF9kBT0qzbe-3S5ZzEgQsDeU67gz-nKwuay7hpivHyQEMIACdrryZYhcRwBXFhry6icU0k-hZnoEVjLEGhvytjwjB4LxOwwXLddbZHD8g7ZNONBzp_aD6RwoAigRS2_luttQXjSRCPnWllYivkIsP57LrI0vvC3dVVCdgoEuXzxL9sQKcK5M5PxYgnr-0LdwYs9t5Cod6jGASgph505pCSYl5qPagA"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 max-w-md pr-4">
                <span className="text-[10px] font-bold text-[#ffb4a8] tracking-widest uppercase mb-1 block">VISUAL HOOK PROMPT</span>
                <p className="text-sm font-body text-[#e5e2e1]/80 line-clamp-3">{thumbnailPrompt}</p>
              </div>
            </div>
          </div>

          {/* RULE CARD */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#970100]">contrast</span>
              <span className="text-[#e5e2e1] font-headline font-bold uppercase tracking-widest text-xs">CONTRAST RULE</span>
            </div>
            <div className="flex-1 bg-[#1c1b1b] border border-[#603e39]/15 p-8 rounded-sm">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#970100]/10 border border-[#970100] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-[#970100]">01</span>
                  </div>
                  <div>
                    <p className="text-[#e5e2e1] font-bold text-sm uppercase font-headline">The 80/20 Rule</p>
                    <p className="text-[#e5e2e1]/40 text-xs mt-1 leading-relaxed">80% dark surfaces, 20% high-intensity tactical red accents for maximum visual punch.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#970100]/10 border border-[#970100] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-[#970100]">02</span>
                  </div>
                  <div>
                    <p className="text-[#e5e2e1] font-bold text-sm uppercase font-headline">Prompt Enforcement</p>
                    <p className="text-[#e5e2e1]/40 text-xs mt-1 leading-relaxed line-clamp-3">Base execution rules directly from prompt: {thumbnailPrompt}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* FLOATING ACTION (CONTEXTUAL) */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-14 h-14 bg-[#970100] rounded-sm flex items-center justify-center shadow-[0_10px_30px_rgba(151,1,0,0.4)] group transition-all active:scale-95">
          <span className="material-symbols-outlined text-[#e5e2e1] text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          <div className="absolute right-16 px-4 py-2 bg-[#353534] text-[#e5e2e1] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-[#603e39]/20">
              QUICK OPTIMIZE
          </div>
        </button>
      </div>

    </div>
  );
};

export default CreativeDashboard;
