import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0A0A0A] text-[#E5E2E1] font-body min-h-screen selection:bg-[#970100] selection:text-[#e5e2e1]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shiny-sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-shiny-sweep {
          animation: shiny-sweep 0.7s ease-in-out;
        }
        @keyframes text-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-text-flow {
          background: linear-gradient(to right, #e5e2e1 20%, #71717a 40%, #e5e2e1 60%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-flow 8s linear infinite;
        }
        .pricing-card-glow {
          box-shadow: 0 0 40px rgba(255, 0, 0, 0.15);
        }
        .ghost-border {
          border: 1px solid rgba(96, 62, 57, 0.15);
        }
      `}} />

      <Navbar />

      <main className="pt-32 pb-20 px-6">
        {/* Hero Section */}
        <header className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter mb-8 animate-text-flow px-2 py-1">
              Stop guessing. Start growing.
          </h1>
          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className="text-xs font-label uppercase tracking-widest text-[#e5e2e1]/40">Monthly</span>
            <div className="w-12 h-6 bg-[#201f1f] rounded-full p-1 flex items-center cursor-pointer ghost-border transition-colors hover:bg-[#2a2a2a]">
              <div className="w-4 h-4 bg-[#ffb4a8] rounded-full translate-x-6 transition-transform shadow-[0_0_10px_rgba(255,180,168,0.5)]"></div>
            </div>
            <span className="text-xs font-label uppercase tracking-widest text-[#e5e2e1]">Yearly <span className="text-[#FF0000] font-bold">-20%</span></span>
          </div>
        </header>

        {/* Pricing Cards Grid */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-stretch">
          
          {/* Left Card: Starter */}
          <div className="bg-[#111827] p-8 md:p-10 rounded-sm flex flex-col h-full border-none shadow-xl hover:shadow-[0_0_30px_rgba(17,24,39,0.8)] transition-shadow">
            <div className="mb-10">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-[#e5e2e1] mb-2">Starter</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-headline font-bold text-[#e5e2e1]">$0</span>
                <span className="text-[#e5e2e1]/40 font-label text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffb4a8] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">Basic Performance Tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffb4a8] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">Monthly Strategy Brief</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffb4a8] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">Standard Data Export</span>
              </li>
            </ul>
            <button className="w-full py-4 px-6 border border-[#e5e2e1]/20 rounded-sm font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#e5e2e1]/5 transition-colors">
                Get Started Free
            </button>
          </div>

          {/* Middle Card: Creator Pro */}
          <div className="bg-[#201f1f] p-8 md:p-10 rounded-sm flex flex-col h-full ghost-border pricing-card-glow relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            {/* Highlight Badge */}
            <div className="absolute top-0 right-0 bg-[#970100] px-4 py-1">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#e5e2e1]">Most Popular</span>
            </div>
            <div className="mb-10">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-[#e5e2e1] mb-2">Creator Pro</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-headline font-bold text-[#e5e2e1]">$29</span>
                <span className="text-[#e5e2e1]/40 font-label text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1] font-body font-medium">Personalized AI Analyst</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">Real-time Competitor Intel</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">Unlimited Keyword Clusters</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">Priority Processing Node</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-[#e5e2e1]/80 font-body">24/7 Tactical Support</span>
              </li>
            </ul>
            <button className="w-full py-4 px-6 bg-[#FF0000] text-white rounded-sm font-headline font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                Upgrade to Pro
            </button>
          </div>

          {/* Right Card: Ultimate */}
          <div className="group bg-gradient-to-br from-[#8B0000] to-[#2a0000] hover:to-[#000000] p-8 md:p-10 rounded-sm flex flex-col h-full relative overflow-hidden shadow-[0_0_50px_rgba(139,0,0,0.3)] transition-colors duration-500">
            {/* Highlight Badge */}
            <div className="absolute top-0 right-0 bg-white px-4 py-1">
              <span className="text-[10px] font-black tracking-widest uppercase text-black">Most Aggressive</span>
            </div>
            <div className="mb-10">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-white mb-2">Ultimate</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-headline font-bold text-white">$99</span>
                <span className="text-white/60 font-label text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Custom Neural Strategy Engine</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Infinite Competitive Surveillance</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Autonomous Content Deployment</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Whitelabel Reporting Suite</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Dedicated Growth Architect</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Full API Direct Access</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF0000] text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-sm text-white font-body font-bold">Black-Ops Market Intel</span>
              </li>
            </ul>
            <button className="w-full py-4 px-6 bg-white text-black rounded-sm font-headline font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-xl relative overflow-hidden group/btn hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              <span className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover/btn:animate-shiny-sweep"></span>
              Go Ultimate
            </button>
          </div>

        </div>

        {/* Trust Section / Briefing */}
        <section className="mt-32 py-32 bg-[#0e0e0e] border-y border-[#603e39]/10">
          <div className="max-w-4xl mx-auto px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px flex-1 bg-[#603e39]/20"></div>
              <h2 className="font-headline text-2xl font-black tracking-widest uppercase text-[#e5e2e1]">BRIEFING_DOCS</h2>
              <div className="h-px flex-1 bg-[#603e39]/20"></div>
            </div>
            
            <div className="space-y-12">
              <div className="group cursor-help">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold group-hover:text-[#ffb4a8] transition-colors tracking-tight">How does the Viral Delta Algorithm work?</h3>
                  <span className="material-symbols-outlined text-[#ffb4a8]/40 group-hover:rotate-45 transition-transform">add</span>
                </div>
                <p className="text-[#e5e2e1]/40 text-sm leading-relaxed border-l-2 border-[#ffb4a8]/10 pl-6 hidden group-hover:block">The delta is calculated by cross-referencing real-time retention data against 100+ global metadata variables including search velocity, thumbnail contrast ratios, and psychological framing patterns.</p>
              </div>
              <div className="group cursor-help">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold group-hover:text-[#ffb4a8] transition-colors tracking-tight">Is this tool compatible with all niches?</h3>
                  <span className="material-symbols-outlined text-[#ffb4a8]/40 group-hover:rotate-45 transition-transform">add</span>
                </div>
                <p className="text-[#e5e2e1]/40 text-sm leading-relaxed border-l-2 border-[#ffb4a8]/10 pl-6 hidden group-hover:block">Yes. Our neural networks are trained on multi-lingual datasets across 42 high-level categories, ensuring precision accuracy regardless of your content vertical.</p>
              </div>
              <div className="group cursor-help">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold group-hover:text-[#ffb4a8] transition-colors tracking-tight">What is the onboarding protocol?</h3>
                  <span className="material-symbols-outlined text-[#ffb4a8]/40 group-hover:rotate-45 transition-transform">add</span>
                </div>
                <p className="text-[#e5e2e1]/40 text-sm leading-relaxed border-l-2 border-[#ffb4a8]/10 pl-6 hidden group-hover:block">Upon early access approval, users undergo a 15-minute integration phase where our engine analyzes your channel's historical DNA to build a custom tactical baseline.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Execution */}
      <footer className="w-full border-t border-[#603E39]/15 bg-[#0E0E0E] mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-10 gap-6 max-w-7xl mx-auto">
          <div className="text-lg font-black text-[#E5E2E1] font-['Space_Grotesk']">
              STRAT_ENGN
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-['Inter'] uppercase text-[10px] tracking-[0.1em] text-[#E5E2E1]/40 hover:text-[#FF0000] transition-colors" href="#">TERMINAL</a>
            <a className="font-['Inter'] uppercase text-[10px] tracking-[0.1em] text-[#E5E2E1]/40 hover:text-[#FF0000] transition-colors" href="#">PRIVACY</a>
            <a className="font-['Inter'] uppercase text-[10px] tracking-[0.1em] text-[#E5E2E1]/40 hover:text-[#FF0000] transition-colors" href="#">API_DOCS</a>
            <a className="font-['Inter'] uppercase text-[10px] tracking-[0.1em] text-[#E5E2E1]/40 hover:text-[#FF0000] transition-colors" href="#">SYSTEM_STATUS</a>
          </div>
          <div className="font-['Inter'] uppercase text-[10px] tracking-[0.1em] text-[#E5E2E1]/40 text-center md:text-right">
              ©2024 STRAT_ENGN TACTICAL SYSTEMS. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
