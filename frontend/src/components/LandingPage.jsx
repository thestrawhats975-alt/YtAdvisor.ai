import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import Navbar from './Navbar';

const LandingPage = () => {
  const canvasRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 4;
  const [openFaq, setOpenFaq] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary/30 selection:text-primary min-h-screen relative">
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      <div className="fixed inset-0 grain-overlay pointer-events-none z-[99]"></div>

      <Navbar />

      <main className="relative">
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" id="interactive-grid"></canvas>
          <div className="absolute inset-0 spectral-glow pointer-events-none"></div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="z-10 text-center px-4 max-w-7xl w-full">
            <motion.span initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.4em' }} transition={{ duration: 0.8, delay: 0.1 }} className="font-label text-[10px] uppercase tracking-[0.4em] text-primary mb-6 block">AI-powered content intelligence</motion.span>
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} className="font-headline text-5xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-5 text-on-surface uppercase">
              KNOW BEFORE YOU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-on-surface to-primary/40">FILM.</span><br />
              WIN BEFORE YOU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-on-surface to-primary/40">UPLOAD.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="text-on-surface/50 text-base font-light leading-relaxed max-w-3xl mx-auto mb-8">
              DimenzIq analyzes your video idea against real competitor data and audience demand signals — telling you exactly what to make, how to position it, and whether it's worth your time before you press record.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex items-center justify-center gap-4 mb-10 flex-wrap max-w-4xl mx-auto w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">1</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">Paste your idea</span>
              </div>
              <span className="text-outline-variant/30 text-sm font-light">→</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">2</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">AI scans the market</span>
              </div>
              <span className="text-outline-variant/30 text-sm font-light">→</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">3</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">Get your verdict</span>
              </div>
              <span className="text-outline-variant/30 text-sm font-light">→</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">4</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">Win the niche</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65 }} className="flex flex-col md:flex-row items-center justify-center gap-4 mb-10">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link to="/signup" className="bg-[#970100] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_40px_rgba(255,0,0,0.4)] transition-all">Get Early Access</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link to="/analyze" className="bg-surface-container border border-outline-variant/30 text-on-surface/60 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:border-primary/50 hover:text-on-surface transition-all">Try Free Analysis</Link>
              </motion.div>
            </motion.div>

            <div className="relative mt-12 mx-auto max-w-4xl w-full">
              {/* Tab bar */}
              <div className="flex border-b border-outline-variant/15">
                {['VERDICT', 'MARKET', 'CREATIVE', 'EXECUTION'].map((tab, i) => (
                  <button key={tab} onClick={() => setActiveSlide(i)} className={`px-5 py-2.5 font-label text-[9px] uppercase tracking-widest transition-all border-b-2 -mb-px ${activeSlide === i ? 'border-primary text-primary' : 'border-transparent text-on-surface/30 hover:text-on-surface/50'}`}>{tab}</button>
                ))}
                <div className="flex-1"></div>
                <div className="flex items-center pr-4 gap-1">{[0, 1, 2, 3].map(i => <button key={i} onClick={() => setActiveSlide(i)} className={`h-0.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'bg-primary w-4' : 'bg-on-surface/15 w-1.5'}`}></button>)}</div>
              </div>

              {/* Panel */}
              <div className="relative bg-surface-container-lowest border-x border-b border-outline-variant/15 shadow-2xl overflow-hidden" style={{ height: '360px' }}>
                <div className="absolute top-0 left-0 w-full laser-line animate-pulse z-20"></div>

                {/* VERDICT */}
                <div className={`absolute inset-0 flex transition-opacity duration-700 ${activeSlide === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="w-[30%] border-r border-outline-variant/10 p-8 flex flex-col justify-center items-center bg-surface-container/30">
                    <div className="font-label text-[8px] text-on-surface/25 uppercase tracking-widest mb-5 text-center">VIRAL PROBABILITY</div>
                    <div className="font-headline text-7xl font-black text-primary leading-none">94.2</div>
                    <div className="font-label text-[11px] text-primary/50 uppercase mb-5">%</div>
                    <div className="w-full h-px bg-surface-container-low mb-1"><div className="h-full bg-primary" style={{ width: '94%' }}></div></div>
                    <div className="w-full bg-surface-container-low h-1 mb-5"><div className="bg-primary h-full" style={{ width: '94%' }}></div></div>
                    <div className="px-5 py-1.5 border border-green-500/30 bg-green-500/5">
                      <span className="font-label text-[9px] text-green-400 uppercase tracking-widest">● VERDICT: GO</span>
                    </div>
                    <div className="mt-3 font-label text-[7px] text-on-surface/20 text-center">CONFIDENCE: 91.4% · 0.04ms</div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest mb-4">ANALYSIS BREAKDOWN</div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
                      {[{ l: 'Hook Strength', v: 'HIGH', p: 82, c: 'bg-green-500' }, { l: 'CTR Potential', v: '+2.8x Baseline', p: 75, c: 'bg-primary' }, { l: 'Market Saturation', v: '23% — Clear', p: 23, c: 'bg-green-500/60' }, { l: 'Retention Forecast', v: '>52% AVG', p: 65, c: 'bg-primary/70' }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[8px] font-label text-on-surface/30 mb-1.5"><span>{m.l}</span><span className="text-on-surface/60">{m.v}</span></div>
                          <div className="w-full bg-surface-container-low h-0.5"><div className={`${m.c} h-full`} style={{ width: `${m.p}%` }}></div></div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-outline-variant/10 pt-4 mt-auto">
                      <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest mb-2">STRATEGIC RECOMMENDATION</div>
                      <p className="text-on-surface/50 text-xs leading-relaxed">The "React vs Vue debate" angle has 40% less competition than direct tutorials. Contrarian positioning with data-backed claims is the recommended entry vector.</p>
                      <div className="mt-3 font-label text-[7px] text-on-surface/15">SYS_ID: 09X-VERDICT-4421</div>
                    </div>
                  </div>
                </div>

                {/* MARKET */}
                <div className={`absolute inset-0 flex transition-opacity duration-700 ${activeSlide === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="w-1/2 border-r border-outline-variant/10 p-6 flex flex-col">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest mb-4">COMPETITOR DOMINANCE MAP</div>
                    <div className="space-y-3 flex-1">
                      {[{ n: 'TechExplained', s: 87, v: '8.2M avg' }, { n: 'CodeWithMosh', s: 72, v: '3.1M avg' }, { n: 'TheOdinProject', s: 58, v: '1.8M avg' }, { n: 'NetworkChuck', s: 41, v: '940K avg' }].map(c => (
                        <div key={c.n}>
                          <div className="flex justify-between text-[8px] font-label mb-1.5"><span className="text-on-surface/50">{c.n}</span><span className="text-on-surface/25">{c.v}</span></div>
                          <div className="flex items-center gap-2"><div className="flex-1 bg-surface-container-low h-1"><div className="bg-[#FF0000]/60 h-full" style={{ width: `${c.s}%` }}></div></div><span className="font-label text-[8px] text-on-surface/25 w-7">{c.s}%</span></div>
                        </div>
                      ))}
                      <div className="border border-green-500/20 bg-green-500/5 p-2 mt-2">
                        <div className="flex justify-between text-[8px] font-label mb-1"><span className="text-green-400">[YOUR ENTRY POINT]</span><span className="text-green-400/60">Opening</span></div>
                        <div className="flex items-center gap-2"><div className="flex-1 bg-surface-container-low h-1"><div className="bg-green-500 h-full" style={{ width: '12%' }}></div></div><span className="font-label text-[8px] text-green-400/60 w-7">12%</span></div>
                      </div>
                    </div>
                    <div className="font-label text-[7px] text-on-surface/15 mt-3">42,000 VIDEOS ANALYZED</div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest mb-4">CONTENT GAPS IDENTIFIED: 3</div>
                    <div className="space-y-3 flex-1">
                      {[{ id: 'GAP_01', t: 'Beginner-to-job success stories', d: 'HIGH', s: '2%' }, { id: 'GAP_02', t: 'Salary negotiation for developers', d: 'MED-HIGH', s: '8%' }, { id: 'GAP_03', t: 'Side income with coding skills', d: 'HIGH', s: '14%' }].map(g => (
                        <div key={g.id} className="border border-green-500/10 bg-green-500/5 p-3">
                          <div className="flex justify-between items-start mb-1"><div className="font-label text-[7px] text-on-surface/25">{g.id}</div><div className="font-label text-[8px] text-green-400">DEMAND: {g.d}</div></div>
                          <div className="text-xs text-on-surface/70 font-semibold mb-1">{g.t}</div>
                          <div className="font-label text-[7px] text-on-surface/25">Existing coverage: {g.s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CREATIVE */}
                <div className={`absolute inset-0 flex transition-opacity duration-700 ${activeSlide === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="w-1/2 border-r border-outline-variant/10 p-6 flex flex-col gap-3">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest">CONTENT ANGLE ENGINE</div>
                    <div className="border border-primary/15 bg-primary/5 p-4">
                      <div className="font-label text-[8px] text-primary/50 mb-2">RECOMMENDED ANGLE</div>
                      <div className="text-on-surface/80 text-sm font-bold leading-snug">Contrarian take + data evidence — challenge consensus, back with numbers</div>
                    </div>
                    <div className="bg-surface-container p-3">
                      <div className="font-label text-[8px] text-on-surface/25 mb-1.5">HOOK FORMULA</div>
                      <div className="text-on-surface/65 text-xs italic">"The reason 90% of [NICHE] tutorials fail — and 3 things the top 1% do differently"</div>
                    </div>
                    <div className="bg-surface-container p-3">
                      <div className="font-label text-[8px] text-on-surface/25 mb-1.5">PSYCHOLOGICAL TRIGGERS</div>
                      <div className="text-on-surface/60 text-xs">Curiosity Gap · Fear of Missing Out · Social Proof</div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-3">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest">PRODUCTION BRIEF</div>
                    <div className="border-l-2 border-primary/40 pl-3 py-1">
                      <div className="font-label text-[7px] text-on-surface/25 mb-1">OPTIMISED TITLE</div>
                      <div className="text-on-surface/70 text-xs">"Why Your Tutorial Videos Keep Failing (Data From 500K Views)"</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-container p-3"><div className="font-label text-[7px] text-on-surface/25 mb-1">FORMAT</div><div className="text-on-surface/60 text-xs">Tutorial → Reveal → CTA</div></div>
                      <div className="bg-surface-container p-3"><div className="font-label text-[7px] text-on-surface/25 mb-1">DURATION</div><div className="text-on-surface/60 text-xs">9–12 minutes</div></div>
                    </div>
                    <div className="bg-surface-container p-3">
                      <div className="font-label text-[7px] text-on-surface/25 mb-1">THUMBNAIL CONCEPT</div>
                      <div className="text-on-surface/60 text-xs">Shocked face LEFT · data chart RIGHT · red overlay "90% FAIL"</div>
                    </div>
                    <div className="font-label text-[7px] text-on-surface/20 mt-auto">DIFFERENTIATION_SCORE: 8.7/10</div>
                  </div>
                </div>

                {/* EXECUTION */}
                <div className={`absolute inset-0 flex transition-opacity duration-700 ${activeSlide === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="w-2/5 border-r border-outline-variant/10 p-6 flex flex-col">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest mb-4">VIDEO STRUCTURE BLUEPRINT</div>
                    <div className="space-y-2.5 flex-1">
                      {[{ t: '0–30s', l: 'HOOK', d: 'Open with bold claim. No intro.', c: 'border-[#FF0000]/50' }, { t: '30–90s', l: 'SETUP', d: 'Context + why this matters now.', c: 'border-primary/40' }, { t: '1–4m', l: 'CORE', d: '3 data-backed evidence points.', c: 'border-primary/30' }, { t: '4–7m', l: 'REVEAL', d: 'The counterintuitive insight.', c: 'border-primary/20' }, { t: '7–9m', l: 'PROOF', d: 'Real examples + numbers.', c: 'border-primary/15' }, { t: '9–11m', l: 'CTA', d: 'Next step. No soft close.', c: 'border-green-500/40' }].map(s => (
                        <div key={s.t} className={`border-l-2 ${s.c} pl-3 py-0.5`}>
                          <div className="flex items-center gap-3">
                            <div className="font-label text-[7px] text-on-surface/25 w-10">{s.t}</div>
                            <div className="font-label text-[9px] text-primary w-12">{s.l}</div>
                            <div className="text-[9px] text-on-surface/45">{s.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="font-label text-[7px] text-on-surface/15 mt-3">BLUEPRINT_ID: EX-7721</div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="font-label text-[8px] text-on-surface/20 uppercase tracking-widest">PERFORMANCE FORECAST</div>
                    <div>
                      <div className="font-label text-[7px] text-on-surface/25 mb-2">PROJECTED VIEW TRAJECTORY (30 DAYS)</div>
                      <div className="flex items-end gap-1 h-16">
                        {[8, 15, 22, 40, 62, 85, 100].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: `rgba(255,0,0,${0.1 + i * 0.12})` }}></div>
                        ))}
                      </div>
                      <div className="flex justify-between font-label text-[7px] text-on-surface/15 mt-1"><span>DAY 1</span><span>DAY 7</span><span>DAY 30</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container p-3"><div className="font-label text-[7px] text-on-surface/25 mb-1">48H ESTIMATE</div><div className="font-headline text-xl font-bold text-primary">12–18K</div><div className="font-label text-[7px] text-on-surface/25">views</div></div>
                      <div className="bg-surface-container p-3"><div className="font-label text-[7px] text-on-surface/25 mb-1">30D ESTIMATE</div><div className="font-headline text-xl font-bold text-on-surface/60">80–120K</div><div className="font-label text-[7px] text-on-surface/25">views</div></div>
                    </div>
                    <div className="font-label text-[7px] text-on-surface/15 mt-auto">TITLE: "Why Your Tutorial Videos Keep Failing..."</div>
                  </div>
                </div>

                {/* Fade + CTA */}
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/90 to-transparent pointer-events-none z-20"></div>
                <div className="absolute bottom-3 inset-x-0 flex justify-center z-30">
                  <Link to="/signup" className="flex items-center gap-2 text-sm font-label text-on-surface/60 uppercase tracking-wider hover:text-primary transition-colors">
                    <span>Get early access to unlock your full analysis</span><span className="text-primary text-base">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

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
              <h2 className="font-headline text-4xl font-black mb-6 tracking-tight">HOW IT WORKS</h2>
              <p className="text-on-surface/60 text-sm leading-relaxed max-w-xs">Three AI agents work in sequence — scanning the market, finding your angle, then building your production brief — all in a matter of seconds.</p>
            </div>
            <div className="md:w-2/3 space-y-12">
              <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="flex gap-8 group">
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
                  <h3 className="font-headline text-xl font-bold mb-3">Market Reality Check</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-6">Scans top-performing videos in your niche to map market saturation, surface competitor weaknesses, and calculate the real potential of your idea before you invest a single hour of filming time.</p>
                  <div className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/5 font-label text-[11px] text-on-surface/30"><span className="text-primary-container">LOG:</span> CALCULATING NICHE SATURATION... <span className="text-secondary">HIGH</span><br /><span className="text-primary-container">LOG:</span> IDENTIFYING CONTENT GAPS... <span className="text-secondary">3 GAPS FOUND</span></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex gap-8 group">
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
                  <h3 className="font-headline text-xl font-bold mb-3">Smart Content Positioning</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-6">Takes the market data and reshapes your idea into a clearly differentiated content angle - pinpointing the specific gap your competitors have not filled yet, and the hook that makes your take worth watching.</p>
                  <div className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/5 items-center gap-4"><div className="font-label text-[11px] text-on-surface/30 w-full"><span className="text-primary-container">LOG:</span> RUNNING POSITIONING ANALYSIS... <span className="text-secondary">OK</span><br /><span className="text-primary-container">LOG:</span> CONTENT ANGLE FOUND</div></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="flex gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-3 transition-all">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-3 transition-all">03 // THE OPTIMIZER</span>
                  <h3 className="font-headline text-xl font-bold mb-3">Production-Ready Content Brief</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-6">Translates the strategy into a clear, step-by-step content plan. Generates CTR-optimized titles, high-retention script structures, and thumbnail concepts — everything you need before you press record.</p>
                  <button className="bg-surface-bright text-on-surface px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">SEE HOW IT WORKS</button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface-container-low/30 relative">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20 space-y-4">
              <h2 className="font-headline text-5xl font-black tracking-tighter">THE GROWTH ENGINE</h2>
              <p className="text-on-surface/40 uppercase font-label text-[11px] tracking-widest">Professional-grade analysis built for creators who take growth seriously.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-2 md:row-span-2 bg-surface-container p-8 border border-outline-variant/10 rounded-sm flex flex-col gap-6 group overflow-hidden relative">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#FF0000]/5 rounded-full blur-3xl group-hover:bg-[#FF0000]/10 transition-colors"></div>
                <div>
                  <span className="material-symbols-outlined text-[#FF0000] mb-6">analytics</span>
                  <h3 className="font-headline text-2xl font-bold mb-4">Intelligence. Strategy. Execution.</h3>
                  <div className="space-y-3 max-w-md">
                    <div className="border-l-2 border-primary/40 pl-3 py-1">
                      <div className="font-label text-[9px] text-primary/50 uppercase tracking-widest mb-1">01 // ANALYST</div>
                      <div className="text-on-surface/85 text-[13px] font-semibold leading-snug mb-1">Is this market worth entering?</div>
                      <div className="text-on-surface/40 text-xs leading-relaxed">Scans real competitor videos to reveal who dominates, why small creators fail, and whether a real opening exists.</div>
                    </div>
                    <div className="border-l-2 border-primary/25 pl-3 py-1">
                      <div className="font-label text-[9px] text-primary/50 uppercase tracking-widest mb-1">02 // STRATEGIST</div>
                      <div className="text-on-surface/85 text-[13px] font-semibold leading-snug mb-1">What angle gives you a chance?</div>
                      <div className="text-on-surface/40 text-xs leading-relaxed">Turns market gaps into a specific, differentiated content angle — exactly which unexploited gap to target and why.</div>
                    </div>
                    <div className="border-l-2 border-[#FF0000]/50 pl-3 py-1">
                      <div className="font-label text-[9px] text-primary/50 uppercase tracking-widest mb-1">03 // OPTIMIZER</div>
                      <div className="text-on-surface/85 text-[13px] font-semibold leading-snug mb-1">Title, hook, thumbnail, structure — done.</div>
                      <div className="text-on-surface/40 text-xs leading-relaxed">Full content brief: CTR-engineered title, hook that holds past 30 seconds, thumbnail concept, and frame-by-frame structure.</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6 relative"><div className="w-full bg-surface-container-lowest/50 border border-outline-variant/10 rounded-sm p-4 flex flex-row items-center gap-6">
                  <div className="h-16 w-20 shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-relaxed text-on-surface/70 font-body uppercase tracking-tight">
                      AI-driven insights that cut research time and surface the exact growth moves that matter — so you spend your energy creating, not second-guessing.
                    </p>
                  </div>
                </div></div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-2 bg-surface p-6 border border-outline-variant/10 rounded-sm flex flex-col gap-3 overflow-hidden">
                <div>
                  <div className="font-label text-[9px] text-primary/40 uppercase tracking-widest mb-2">VERDICT_ENGINE</div>
                  <h3 className="font-headline text-xl font-bold whitespace-nowrap">If it won't work, we say so.</h3>
                </div>
                <div className="bg-surface-container-lowest border border-[#FF0000]/15 rounded-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000]"></div>
                      <span className="font-label text-[10px] text-[#FF0000] uppercase tracking-widest">VERDICT: AVOID</span>
                    </div>
                    <span className="font-label text-[8px] text-on-surface/20 uppercase">ANALYST_OUTPUT</span>
                  </div>
                  <div className="h-px bg-outline-variant/10 mb-2"></div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div><div className="font-label text-[8px] text-on-surface/30 mb-1">MARKET SAT.</div><div className="text-xs font-semibold text-on-surface/70">89% — Critical</div></div>
                    <div><div className="font-label text-[8px] text-on-surface/30 mb-1">GROWTH VEL.</div><div className="text-xs font-semibold text-on-surface/70">−12% YoY</div></div>
                    <div><div className="font-label text-[8px] text-on-surface/30 mb-1">ENTRY RISK</div><div className="text-xs font-semibold text-[#FF0000]">HIGH</div></div>
                  </div>
                  <div className="text-[9px] font-label text-on-surface/30">REC → <span className="text-on-surface/50">Pivot content angle before investing in production</span></div>
                </div>
                <p className="text-on-surface/45 text-xs leading-relaxed">When the market is dead or dominated, the verdict is AVOID — not a softened "it's challenging." You get told to pivot before you waste 40 hours on a video nobody will find.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-1 bg-surface-container-high p-6 border border-outline-variant/15 rounded-sm">
                <span className="material-symbols-outlined text-[#FF0000] mb-4">priority_high</span>
                <h3 className="font-headline font-bold text-base uppercase tracking-wider mb-2">Gap Discovery</h3>
                <p className="text-on-surface/40 text-xs leading-relaxed">Find what nobody else is making. Competitor analysis maps what exists. Audience demand signals reveal what's missing. The gap between them is your entry point.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-1 bg-surface-container-lowest p-6 border border-outline-variant/20 rounded-sm flex flex-col justify-between">
                <div className="font-label text-[9px] text-on-surface/30">CREATOR_CONTEXT</div>
                <div className="text-2xl font-headline font-bold text-[#FF0000]">Creator Context Engine</div>
                <p className="text-on-surface/40 text-[10px] leading-relaxed mb-4">Personalised directions based on your channel size and growth stage. Every recommendation adapts to your context — advice that works for a 10K creator won't mislead one with 1M subscribers.</p><div className="flex gap-1"><div className="w-1 h-4 bg-[#FF0000]/40"></div><div className="w-1 h-4 bg-[#FF0000]/40"></div><div className="w-1 h-4 bg-[#FF0000]/40"></div><div className="w-1 h-4 bg-[#FF0000]"></div></div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-sm font-bold tracking-[0.3em] uppercase text-primary text-center mb-16">What Creators Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0 }} whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 250, damping: 22 } }} className="bg-surface-container/20 backdrop-blur-md p-8 border border-outline-variant/5 rounded-sm hover:border-outline-variant/20 transition-all">
                <p className="text-on-surface/80 text-lg font-light leading-relaxed mb-8 italic">"The DimenzIq engine predicted our 1.2M view breakout with terrifying accuracy. We don't guess anymore."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-high rounded-sm overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5pbe6UmNEFeygzoAiAgPR7-9FiismP2VbwZW4afLVhYO4wEI0hXPl5ImkT7kG6gyEyKtAIf1JxFmKz4CIhPOqqnF9SAk7OzooH26NusEzZvMhxOTauaqJN16f6hzTf1JN_VdpSCOqZ7_zYymOhnwScqoOSoF6KfnIfbLhzOFKaQXoJwK8eCu1yLgI-mKS6WD4anwoyBxMqDMlp0upLl0n2DCabgJeg3Fm36jM6_VPoFCY0dsVpT4Zy5NWXxKMVAmho0cemYt0Rco" />
                  </div>
                  <div>
                    <div className="font-headline font-bold text-xs uppercase tracking-widest">MAVERICK_LOGS</div>
                    <div className="text-[9px] font-label text-on-surface/40 uppercase">Tech Creator | 800k Subs</div>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 250, damping: 22 } }} className="bg-surface-container/20 backdrop-blur-md p-8 border border-outline-variant/5 rounded-sm hover:border-outline-variant/20 transition-all">
                <p className="text-on-surface/80 text-lg font-light leading-relaxed mb-8 italic">"It's like having a 24/7 research team that never sleeps. The ROI was immediate upon first upload."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-high rounded-sm overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB84vgSypX5eN1azWFx_5dBhtWEbhkbAFjSgEc6bWKF_jCEcJWxTisA5mlQVOHv2qAbtasmODeM2hty7S_hgApKfRWlfHY1YfRw_QcIWDA5TkuGkGvIh5rTlZUuuBb4h0i2_RkGByqnpz5-mQwnxt01aC1uHpLcqYxn-NQN4YNDM1UyvDWV1AizDWEDU7Tppw7zQVAtkvej5Godjrkbvrn8_H4ihvGwa28bQVkLeMnCUFyOkKwf2oe0h9uIaH78jGAJ0szeb7RRJtw" />
                  </div>
                  <div>
                    <div className="font-headline font-bold text-xs uppercase tracking-widest">SILICON_VALLEY_DEV</div>
                    <div className="text-[9px] font-label text-on-surface/40 uppercase">SaaS Founder | 250k Subs</div>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 250, damping: 22 } }} className="bg-surface-container/20 backdrop-blur-md p-8 border border-outline-variant/5 rounded-sm hover:border-outline-variant/20 transition-all">
                <p className="text-on-surface/80 text-lg font-light leading-relaxed mb-8 italic">"Precision over noise. DimenzIq cut my research time by 80%."</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-high rounded-sm overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDP1hi6ve4rZNSEPiTek9csxEH63ynQthtwSWneLlKLPTZx1_GsRJI-_eGIgTtGp8g0b_llLwFHC6U3G1tUUCoo9t2FZQz0IdKAbMrLrwnrUpINu2BdKm-bT2-az2s4qXMQ51xmpyDtt3PmgURs7jaemxL1uouNw1owg1PxH4ntYZ0wkUYVALwhgugJeVwrYqXereUNs9z0yZEMdf8hZnO78fk4PD5x8TkfPid9TrNHkV6CXN6MazzcVZSXTyFRk6h6ow_94YhAFV8" />
                  </div>
                  <div>
                    <div className="font-headline font-bold text-xs uppercase tracking-widest">CODE_COMMANDER</div>
                    <div className="text-[9px] font-label text-on-surface/40 uppercase">Engineering Lead | 1.1M Subs</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface-container-lowest border-y border-outline-variant/10">
          <div className="max-w-4xl mx-auto px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px flex-1 bg-outline-variant/20"></div>
              <h2 className="font-headline text-2xl font-black tracking-widest uppercase">FREQUENTLY ASKED</h2>
              <div className="h-px flex-1 bg-outline-variant/20"></div>
            </div>
            <div className="space-y-12">
              {[
                { q: 'How does the content scoring work?', a: 'Our AI cross-references your idea against real video performance data — analyzing market saturation, competitor positioning, audience demand signals, and engagement patterns to generate a clear success score for your concept.' },
                { q: 'Is this tool compatible with all niches?', a: 'Yes. The engine is built to work across a wide range of content categories and languages — from tech and finance to lifestyle and gaming. The analysis adapts to your specific niche.' },
                { q: 'How does onboarding work?', a: "After getting early access, our engine analyzes your channel to build a personalized baseline — so every recommendation is calibrated to your current size, audience, and growth stage." },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center mb-4 text-left group">
                    <h3 className={`font-headline text-lg font-bold tracking-tight transition-colors ${openFaq === i ? 'text-primary' : 'group-hover:text-primary'}`}>{faq.q}</h3>
                    <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="material-symbols-outlined text-primary/40 shrink-0 ml-4">add</motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                        <p className="text-on-surface/40 text-sm leading-relaxed border-l-2 border-primary/20 pl-6 pb-4">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-secondary-container/10 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
            <motion.h2 initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} className="font-headline text-5xl md:text-7xl font-black tracking-tighter mb-8 text-on-surface uppercase">Ready to Grow?</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="text-on-surface/60 max-w-xl mx-auto mb-12 text-sm leading-relaxed">Early access is limited. Be among the first creators to get data-backed intelligence for every video idea — so you stop guessing and start growing.</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.35 }} className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <input className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-6 py-4 w-full md:w-80 text-xs font-label focus:outline-none focus:border-primary transition-colors text-on-surface" placeholder="ENTER_EMAIL_ADDRESS" type="email" />
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}><Link to="/signup" className="bg-[#970100] hover:bg-[#b50100] px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_40px_rgba(255,0,0,0.4)] transition-all text-white block">Get Early Access</Link></motion.div>
            </motion.div>
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
          © {new Date().getFullYear()} DimenzIq. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
