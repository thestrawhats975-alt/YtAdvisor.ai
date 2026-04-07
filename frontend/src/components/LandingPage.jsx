import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const LandingPage = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let dots = [];
    const spacing = 32;
    const mouse = { x: -1000, y: -1000 };
    let animationFrameId;

    function init() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      dots = [];
      for (let x = spacing / 2; x < canvas.offsetWidth; x += spacing) {
        for (let y = spacing / 2; y < canvas.offsetHeight; y += spacing) {
          dots.push({ x, y, baseRadius: 1 });
        }
      }
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      dots.forEach(dot => {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;
        
        let ratio = 0;
        if (dist < maxDist) {
          ratio = (maxDist - dist) / maxDist;
        }

        const radius = dot.baseRadius + (ratio * 2.5);
        const opacity = 0.1 + (ratio * 0.5);
        
        const r = Math.floor(53 + (255 - 53) * ratio);
        const g = Math.floor(53 + (0 - 53) * ratio);
        const b = Math.floor(52 + (0 - 52) * ratio);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary/30 selection:text-primary min-h-screen">
      <Navbar />

      <main className="relative">
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" id="interactive-grid"></canvas>
          <div className="absolute inset-0 spectral-glow pointer-events-none"></div>
          <div className="z-10 text-center px-4 max-w-5xl">
            <span className="font-label text-[10px] uppercase tracking-[0.4em] text-primary mb-6 block">Tactical intelligence layer v.2.04</span>
            <h1 className="font-headline text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-12 text-on-surface uppercase">
              KNOW BEFORE YOU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-on-surface to-primary/40">FILM.</span><br/>
              WIN BEFORE YOU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-on-surface to-primary/40">UPLOAD.</span>
            </h1>

            <div className="relative mt-12 mx-auto max-w-4xl bg-surface-container-lowest border border-outline-variant/15 p-1 rounded-sm shadow-2xl overflow-hidden group">
              <div className="absolute top-0 left-0 w-full laser-line animate-pulse z-20"></div>
              <div className="bg-surface p-6 flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-3/5 aspect-video bg-surface-container-low rounded-sm relative overflow-hidden md:translate-y-4 transition-transform duration-700">
                  <img className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" alt="Futuristic glowing purple and blue digital landscape" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgpagTNswxAgCbWumO5LY_aW8A8-Utk39uO1ktCnl9C6acexA5_f7JvZzLyyX0-jl44uvCXXkHLTVj8tUcgucDi6fshDmRywZRhU9C7laxw0ymPRrxx8vJ_B-vDKGQaxrAIts-su-1OGvMOe0FgoZoEIJzUBgmAV_QAIe2jc7mEj7UnhtQ3CJYPQB7ksWqsqCM5_KKasNzrhnv3sOzjIr0RW9zxb06MfV9FmEGVHpwuWQhXVotgCm-vCBk10KFLi5BqWb1PqpXDxM" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
                  <div className="absolute bottom-4 left-4 font-label text-[10px] text-primary/60 uppercase">SOURCE: YT_LOG_0942.MP4</div>
                </div>
                <div className="w-full md:w-2/5 space-y-4 text-left md:-translate-y-4 transition-transform duration-700">
                  <div className="p-4 bg-surface-container border border-outline-variant/10 rounded-sm">
                    <div className="font-label text-[10px] text-on-surface/40 uppercase mb-2">Viral Probability</div>
                    <div className="text-3xl font-headline font-bold text-primary">94.2%</div>
                    <div className="w-full bg-surface-container-low h-1 mt-2">
                      <div className="bg-primary h-full w-[94%]"></div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container border border-outline-variant/10 rounded-sm">
                    <div className="font-label text-[10px] text-on-surface/40 uppercase mb-2">MARKET VULNERABILITY</div>
                    <div className="text-2xl font-headline font-bold text-on-surface animate-red-pulse">+18.5k <span className="text-sm font-normal text-on-surface/30">Potential Delta</span></div>
                  </div>
                  <div className="p-2 border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-tighter text-center">
                    SCANNING HOOK STRUCTURE...
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block absolute top-1/2 left-12 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
            <div className="text-[10px] font-label space-y-2 text-on-surface/40">
              <p>ENGINE_LOAD: 0.04ms</p>
              <p>SYSTEM_STATUS: NOMINAL</p>
              <p>ENCRYPTION: AES_256</p>
            </div>
          </div>
        </section>

        <section className="py-32 px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3 sticky top-32 h-fit">
              <h2 className="font-headline text-4xl font-black mb-6 tracking-tight">THREE-AGENT_PIPELINE</h2>
              <p className="text-on-surface/60 text-sm leading-relaxed max-w-xs">Stop guessing. Three distinct AI agents dissect the market, engineer a unique positioning strategy, and output a foolproof execution blueprint in seconds.</p>
            </div>
            <div className="md:w-2/3 space-y-12">
              <div className="flex gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-1 transition-all">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                  </div>
                  <div className="w-px h-full bg-outline-variant/20 mt-4 relative overflow-hidden">
                    <div className="pipeline-line-pulse pulse-1"></div>
                  </div>
                </div>
                <div className="pb-16 pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-1 transition-all">01 // THE ANALYST</span>
                  <h3 className="font-headline text-xl font-bold mb-3">Market Reality Extraction</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-6">Scans top-performing videos in your specific niche to map market saturation, expose competitor weaknesses, and calculate the brutal reality of your idea's success rate.</p>
                  <div className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/5 font-label text-[11px] text-on-surface/30"><span className="text-primary-container">LOG:</span> CALCULATING NICHE VOLATILITY... <span className="text-secondary">HIGH</span><br/><span className="text-primary-container">LOG:</span> IDENTIFYING CONTENT GAPS... <span className="text-secondary">3 VULNERABILITIES FOUND</span></div>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-2 transition-all">
                    <span className="material-symbols-outlined text-sm">query_stats</span>
                  </div>
                  <div className="w-px h-full bg-outline-variant/20 mt-4 relative overflow-hidden">
                    <div className="pipeline-line-pulse pulse-2"></div>
                  </div>
                </div>
                <div className="pb-16 pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-2 transition-all">02 // THE STRATEGIST</span>
                  <h3 className="font-headline text-xl font-bold mb-3">Asymmetric Positioning Pivot</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-6">Takes the Analyst’s raw data and pivots your initial idea into a highly differentiated content angle. It finds the exact psychological hook your competitors missed.</p>
                  <div className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/5 items-center gap-4"><div className="font-label text-[11px] text-on-surface/30 w-full"><span className="text-primary-container">LOG:</span> INITIATING DIFFERENTIATION PROTOCOL... <span className="text-secondary">OK</span><br/><span className="text-primary-container">LOG:</span> IDEA UPGRADE SUCCESSFUL</div></div>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-3 transition-all">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-3 transition-all">03 // THE OPTIMIZER</span>
                  <h3 className="font-headline text-xl font-bold mb-3">Tactical Execution Blueprint</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-6">Translates the abstract strategy into a rigid, frame-by-frame battle plan. Generates optimized titles, high-retention script structures, and visual thumbnail concepts.</p>
                  <button className="bg-surface-bright text-on-surface px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">DEPLOY BLUEPRINT</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface-container-low/30 relative">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20 space-y-4">
              <h2 className="font-headline text-5xl font-black tracking-tighter">THE_ARSENAL</h2>
              <p className="text-on-surface/40 uppercase font-label text-[11px] tracking-widest">Weapons-grade intelligence designed specifically for the top 1% of content architects.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
              <div className="md:col-span-2 md:row-span-2 bg-surface-container p-8 border border-outline-variant/10 rounded-sm flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#FF0000]/5 rounded-full blur-3xl group-hover:bg-[#FF0000]/10 transition-colors"></div>
                <div>
                  <span className="material-symbols-outlined text-[#FF0000] mb-6">analytics</span>
                  <h3 className="font-headline text-2xl font-bold mb-4">Frame-by-Frame Execution UIs</h3>
                  <p className="text-on-surface/50 text-sm max-w-xs">Don't just get an idea. Get the exact script structure, pacing notes, and visual cues needed to hold audience attention past the critical 30-second mark.</p>
                </div>
                <div className="mt-8 flex items-center gap-6 relative"><div className="w-full bg-surface-container-lowest/50 border border-outline-variant/10 rounded-sm p-6 flex flex-row items-center gap-8">
                  <div className="h-28 w-24 shrink-0">
                    <div className="flex items-end gap-1.5 h-full">
                      <div className="w-2 bg-[#FF0000]/20 h-[15%]"></div>
                      <div className="w-2 bg-[#FF0000]/30 h-[25%]"></div>
                      <div className="w-2 bg-[#FF0000]/40 h-[40%]"></div>
                      <div className="w-2 bg-[#FF0000]/60 h-[55%]"></div>
                      <div className="w-2 bg-[#FF0000]/80 h-[75%]"></div>
                      <div className="w-2 bg-[#FF0000]/90 h-[85%]"></div>
                      <div className="w-2 bg-[#FF0000] h-[100%]"></div>
                    </div>
                  </div>
                  <div className="flex-1 max-w-[280px]">
                    <p className="text-[11px] leading-relaxed text-on-surface/70 font-body uppercase tracking-tight">
                      The creative Intelligent Advice along with reasoning explanation that would save you hours of intelligence and analysis, focusing your energy towards the growth.
                    </p>
                  </div>
                </div></div>
              </div>
              <div className="md:col-span-2 bg-surface p-6 border border-outline-variant/10 rounded-sm flex gap-6 items-center">
                <div className="flex-1">
                  <h3 className="font-headline text-lg font-bold mb-2">Brutal 'AVOID' Directives</h3>
                  <p className="text-on-surface/40 text-xs">Our AI doesn't just tell you what to do; it explicitly warns you what will kill your video. Avoid dead trends and saturated formats before you waste hours filming.</p>
                </div>
                <div className="w-24 h-24 bg-surface-container-high rounded-full border-4 border-[#FF0000]/20 flex items-center justify-center"><img alt="Skull and crossbones" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida/ADBb0ugRBNtuu5IQywb9FYRp8rCEWL4WWkYLQ16oZ4wTuImhcIq6gJk1oFbejornZ5UtYzlfIl_EdybZQZOPNp6bNjekmG7XWzuR34fkaOYSSg0c0fdrtGsjoeeJUJVYLhffipJ6ai8QdHcY3v_wEgjmpiwfkZ-eHTxO9cHFR1wAj6LL1vl6_MLMuR-F_rfRPwMyxaDxeJFh_uPjajzLN5Hhcwb-Ea69AjnVgbr3iE664M6Xc0-EhWYvz9gN16qho52LLDufM75w4PvDPg"/></div>
              </div>
              <div className="md:col-span-1 bg-surface-container-high p-6 border border-outline-variant/15 rounded-sm">
                <span className="material-symbols-outlined text-[#FF0000] mb-4">priority_high</span>
                <h3 className="font-headline font-bold text-sm uppercase tracking-wider mb-2">Gap Exploitation</h3>
                <p className="text-on-surface/40 text-[10px] leading-relaxed">Instantly isolate exactly what your target audience is searching for, but no one else in your niche is delivering.</p>
              </div>
              <div className="md:col-span-1 bg-surface-container-lowest p-6 border border-outline-variant/20 rounded-sm flex flex-col justify-between">
                <div className="font-label text-[9px] text-on-surface/30">CREATOR_CONTEXT</div>
                <div className="text-2xl font-headline font-bold text-[#FF0000]">Creator Context Engine</div>
                <p className="text-on-surface/40 text-[10px] leading-relaxed mb-4">Advice that scales to you. The system dynamically alters its strategy and risk tolerance based on your specific channel size and historical view velocity.</p><div className="flex gap-1"><div className="w-1 h-4 bg-[#FF0000]/40"></div><div className="w-1 h-4 bg-[#FF0000]/40"></div><div className="w-1 h-4 bg-[#FF0000]/40"></div><div className="w-1 h-4 bg-[#FF0000]"></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-sm font-bold tracking-[0.3em] uppercase text-primary text-center mb-16">Verified Commanders</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container/20 backdrop-blur-md p-8 border border-outline-variant/5 rounded-sm hover:border-outline-variant/20 transition-all">
                <p className="text-on-surface/80 text-lg font-light leading-relaxed mb-8 italic">"The DimenzIq engine predicted our 1.2M view breakout with terrifying accuracy. We don't guess anymore."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-high rounded-sm overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5pbe6UmNEFeygzoAiAgPR7-9FiismP2VbwZW4afLVhYO4wEI0hXPl5ImkT7kG6gyEyKtAIf1JxFmKz4CIhPOqqnF9SAk7OzooH26NusEzZvMhxOTauaqJN16f6hzTf1JN_VdpSCOqZ7_zYymOhnwScqoOSoF6KfnIfbLhzOFKaQXoJwK8eCu1yLgI-mKS6WD4anwoyBxMqDMlp0upLl0n2DCabgJeg3Fm36jM6_VPoFCY0dsVpT4Zy5NWXxKMVAmho0cemYt0Rco"/>
                  </div>
                  <div>
                    <div className="font-headline font-bold text-xs uppercase tracking-widest">MAVERICK_LOGS</div>
                    <div className="text-[9px] font-label text-on-surface/40 uppercase">Tech Creator | 800k Subs</div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container/20 backdrop-blur-md p-8 border border-outline-variant/5 rounded-sm hover:border-outline-variant/20 transition-all">
                <p className="text-on-surface/80 text-lg font-light leading-relaxed mb-8 italic">"It's like having a 24/7 research team that never sleeps. The ROI was immediate upon first upload."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-high rounded-sm overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB84vgSypX5eN1azWFx_5dBhtWEbhkbAFjSgEc6bWKF_jCEcJWxTisA5mlQVOHv2qAbtasmODeM2hty7S_hgApKfRWlfHY1YfRw_QcIWDA5TkuGkGvIh5rTlZUuuBb4h0i2_RkGByqnpz5-mQwnxt01aC1uHpLcqYxn-NQN4YNDM1UyvDWV1AizDWEDU7Tppw7zQVAtkvej5Godjrkbvrn8_H4ihvGwa28bQVkLeMnCUFyOkKwf2oe0h9uIaH78jGAJ0szeb7RRJtw"/>
                  </div>
                  <div>
                    <div className="font-headline font-bold text-xs uppercase tracking-widest">SILICON_VALLEY_DEV</div>
                    <div className="text-[9px] font-label text-on-surface/40 uppercase">SaaS Founder | 250k Subs</div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container/20 backdrop-blur-md p-8 border border-outline-variant/5 rounded-sm hover:border-outline-variant/20 transition-all">
                <p className="text-on-surface/80 text-lg font-light leading-relaxed mb-8 italic">"Precision over noise. DimenzIq cut my research time by 80%."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-high rounded-sm overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDP1hi6ve4rZNSEPiTek9csxEH63ynQthtwSWneLlKLPTZx1_GsRJI-_eGIgTtGp8g0b_llLwFHC6U3G1tUUCoo9t2FZQz0IdKAbMrLrwnrUpINu2BdKm-bT2-az2s4qXMQ51xmpyDtt3PmgURs7jaemxL1uouNw1owg1PxH4ntYZ0wkUYVALwhgugJeVwrYqXereUNs9z0yZEMdf8hZnO78fk4PD5x8TkfPid9TrNHkV6CXN6MazzcVZSXTyFRk6h6ow_94YhAFV8"/>
                  </div>
                  <div>
                    <div className="font-headline font-bold text-xs uppercase tracking-widest">CODE_COMMANDER</div>
                    <div className="text-[9px] font-label text-on-surface/40 uppercase">Engineering Lead | 1.1M Subs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface-container-lowest border-y border-outline-variant/10">
          <div className="max-w-4xl mx-auto px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px flex-1 bg-outline-variant/20"></div>
              <h2 className="font-headline text-2xl font-black tracking-widest uppercase">BRIEFING_DOCS</h2>
              <div className="h-px flex-1 bg-outline-variant/20"></div>
            </div>
            <div className="space-y-12">
              <div className="group cursor-help">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold group-hover:text-primary transition-colors tracking-tight">How does the Viral Delta Algorithm work?</h3>
                  <span className="material-symbols-outlined text-primary/40 group-hover:rotate-45 transition-transform">add</span>
                </div>
                <p className="text-on-surface/40 text-sm leading-relaxed border-l-2 border-primary/10 pl-6 hidden group-hover:block">The delta is calculated by cross-referencing real-time retention data against 100+ global metadata variables including search velocity, thumbnail contrast ratios, and psychological framing patterns.</p>
              </div>
              <div className="group cursor-help">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold group-hover:text-primary transition-colors tracking-tight">Is this tool compatible with all niches?</h3>
                  <span className="material-symbols-outlined text-primary/40 group-hover:rotate-45 transition-transform">add</span>
                </div>
                <p className="text-on-surface/40 text-sm leading-relaxed border-l-2 border-primary/10 pl-6 hidden group-hover:block">Yes. Our neural networks are trained on multi-lingual datasets across 42 high-level categories, ensuring precision accuracy regardless of your content vertical.</p>
              </div>
              <div className="group cursor-help">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold group-hover:text-primary transition-colors tracking-tight">What is the onboarding protocol?</h3>
                  <span className="material-symbols-outlined text-primary/40 group-hover:rotate-45 transition-transform">add</span>
                </div>
                <p className="text-on-surface/40 text-sm leading-relaxed border-l-2 border-primary/10 pl-6 hidden group-hover:block">Upon early access approval, users undergo a 15-minute integration phase where our engine analyzes your channel's historical DNA to build a custom tactical baseline.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-secondary-container/10 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
            <h2 className="font-headline text-5xl md:text-7xl font-black tracking-tighter mb-8 text-on-surface uppercase">Ready for Deployment?</h2>
            <p className="text-on-surface/60 max-w-xl mx-auto mb-12 text-sm leading-relaxed">Early access slots are strictly limited to maintain computational priority for existing commanders. Apply for credentials below.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <input className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-6 py-4 w-full md:w-80 text-xs font-label focus:outline-none focus:border-primary transition-colors text-on-surface" placeholder="ENTER_EMAIL_ADDRESS" type="email"/>
              <Link to="/signup" className="bg-[#970100] hover:bg-[#b50100] px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_30px_rgba(255,0,0,0.3)] transition-all text-white">Initialize Access</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[#1C1B1B] bg-[#0E0E0E] dark:bg-[#0E0E0E]">
        <div className="font-['Space_Grotesk'] font-bold text-[#FF0000] dark:text-[#FF0000] uppercase tracking-widest text-lg">
          DimenzIq
        </div>
        <div className="flex flex-wrap justify-center gap-6 font-['Inter'] text-[10px] uppercase tracking-widest text-zinc-500">
          <a className="text-zinc-600 hover:text-zinc-400 transition-colors" href="#">Security</a>
          <a className="text-zinc-600 hover:text-zinc-400 transition-colors" href="#">API</a>
          <a className="text-zinc-600 hover:text-zinc-400 transition-colors" href="#">Terms</a>
          <a className="text-zinc-600 hover:text-zinc-400 transition-colors" href="#">Privacy</a>
        </div>
        <div className="font-['Inter'] text-[10px] uppercase tracking-widest text-zinc-500 text-center md:text-right">
          © 2024 DimenzIq Tactical Intelligence. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
