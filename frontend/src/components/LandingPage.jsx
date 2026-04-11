import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useInView } from 'framer-motion';
import Navbar from './Navbar';
import StarBorder from './StarBorder';

/* ─── LIVE DEMO: Unified Cinematic Sequence (auto-replay) ─── */
const LiveDemoSequence = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [cycle, setCycle] = useState(0);

  const [phase, setPhase] = useState(0);
  const [inputText, setInputText] = useState('');
  const [thinkingLines, setThinkingLines] = useState([]);
  const [thinkingDone, setThinkingDone] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [outputStep, setOutputStep] = useState(0);

  const ideaText = "Why most coding tutorials fail — and what the top 1% do differently";

  const thoughts = [
    { agent: 'MARKET_SCANNER', text: 'Scanning 42,847 videos in "coding tutorials" niche...' },
    { agent: 'MARKET_SCANNER', text: 'Top 5 competitors identified. TechExplained dominates at 87% share.' },
    { agent: 'MARKET_SCANNER', text: 'Content gap detected: "failure analysis" angle — only 2% coverage.' },
    { agent: 'STRATEGIST', text: 'Evaluating hook patterns from top 200 performers...' },
    { agent: 'STRATEGIST', text: 'Contrarian framing matches 3 of top 5 viral patterns in niche.' },
    { agent: 'OPTIMIZER', text: 'Generating title variants... Testing CTR prediction models...' },
    { agent: 'OPTIMIZER', text: 'Winner: "Why Your Tutorial Videos Keep Failing (Data From 500K Views)"' },
    { agent: 'OPTIMIZER', text: 'Structure mapped. Retention forecast: >52% avg. Verdict ready.' },
  ];

  // Full reset for replay
  const resetState = () => {
    setPhase(0);
    setInputText('');
    setThinkingLines([]);
    setThinkingDone(false);
    setShowOutput(false);
    setOutputStep(0);
  };

  useEffect(() => {
    if (!isInView) return;
    resetState();

    const timers = [];
    const typeDelay = 600;

    timers.push(setTimeout(() => setPhase(1), typeDelay));

    for (let i = 0; i < ideaText.length; i++) {
      timers.push(setTimeout(() => {
        setInputText(ideaText.slice(0, i + 1));
      }, typeDelay + i * 45));
    }

    const typingEnd = typeDelay + ideaText.length * 45 + 500;
    timers.push(setTimeout(() => setPhase(2), typingEnd));

    const thinkStart = typingEnd + 1000;
    timers.push(setTimeout(() => setPhase(3), thinkStart));

    thoughts.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setThinkingLines(prev => [...prev, thoughts[i]]);
      }, thinkStart + 400 + i * 900));
    });

    const thinkEnd = thinkStart + 400 + thoughts.length * 900 + 600;
    timers.push(setTimeout(() => setThinkingDone(true), thinkEnd));
    timers.push(setTimeout(() => { setPhase(4); setShowOutput(true); }, thinkEnd + 400));

    for (let i = 1; i <= 3; i++) {
      timers.push(setTimeout(() => setOutputStep(i), thinkEnd + 400 + i * 500));
    }

    // Auto-replay: hold result for 8s then restart
    const totalDuration = thinkEnd + 400 + 3 * 500 + 8000;
    timers.push(setTimeout(() => {
      resetState();
      setTimeout(() => setCycle(c => c + 1), 600);
    }, totalDuration));

    return () => timers.forEach(clearTimeout);
  }, [isInView, cycle]);

  return (
    <div ref={ref} className="flex flex-col min-h-[640px] md:min-h-[460px]">
      {/* ── INPUT AREA ── */}
      <div className="px-4 md:px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className={`w-full bg-surface-container-low/50 border rounded-sm px-4 py-2.5 text-sm font-body transition-colors duration-300 ${phase >= 2 ? 'border-[#FF0000]/30' : 'border-white/8'}`}>
              <span className="text-on-surface/80">{inputText}</span>
              {phase === 1 && <span className="inline-block w-0.5 h-4 bg-on-surface/60 ml-0.5 animate-pulse align-middle" />}
              {phase === 0 && <span className="text-on-surface/20 text-sm">Paste your video idea...</span>}
            </div>
          </div>
          <motion.button
            className={`shrink-0 px-4 py-2.5 rounded-sm font-label text-[10px] uppercase tracking-widest transition-all duration-300 ${phase >= 2
              ? 'bg-[#FF0000] text-white shadow-[0_0_16px_rgba(255,0,0,0.3)]'
              : 'bg-surface-container border border-white/8 text-on-surface/30'
              }`}
            animate={phase === 2 ? { scale: [1, 0.93, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            {phase >= 3 ? (
              <span className="flex items-center gap-1.5">
                <motion.span
                  className="inline-block w-2.5 h-2.5 border-[1.5px] border-white/40 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
                Analyzing
              </span>
            ) : 'Analyze →'}
          </motion.button>
        </div>
      </div>

      {/* ── THINKING / CHAIN OF THOUGHT ── */}
      <AnimatePresence>
        {phase >= 3 && !showOutput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-6 py-4 space-y-0.5 bg-surface-container/10 border-b border-white/5" style={{ minHeight: '180px' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse" />
                <span className="font-label text-[9px] text-on-surface/30 uppercase tracking-widest">Agent reasoning</span>
              </div>
              {thinkingLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 py-0.5"
                >
                  <span className={`font-mono text-[9px] uppercase tracking-wider shrink-0 w-28 text-right ${line.agent === 'MARKET_SCANNER' ? 'text-[#FF0000]/60' :
                    line.agent === 'STRATEGIST' ? 'text-green-500/60' :
                      'text-amber-400/60'
                    }`}>
                    [{line.agent}]
                  </span>
                  <span className="text-on-surface/50 text-[11px] font-body leading-relaxed">{line.text}</span>
                </motion.div>
              ))}
              {!thinkingDone && (
                <div className="flex items-center gap-1 pl-[7.5rem] pt-1">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <motion.span key={i} className="w-1 h-1 rounded-full bg-on-surface/20"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: d }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OUTPUT ── */}
      {showOutput && (
        <div className="px-4 md:px-6 py-4">

          {/* ROW 1: Verdict banner + 4 metric pills */}
          {outputStep >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3"
            >
              {/* Verdict strip */}
              <div className="flex items-center gap-4 px-4 py-3 mb-2.5 border border-green-500/20 bg-green-500/5 rounded-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-headline text-3xl md:text-4xl font-black text-green-400 leading-none tracking-tighter">GO</span>
                </div>
                <div className="h-8 w-px bg-white/8" />
                <div>
                  <div className="font-label text-[8px] text-on-surface/30 uppercase tracking-widest">VIRAL PROBABILITY</div>
                  <div className="font-headline text-xl font-black text-[#FF0000]">94.2%</div>
                </div>
                <div className="h-8 w-px bg-white/8 hidden md:block" />
                <div className="hidden md:block">
                  <div className="font-label text-[8px] text-on-surface/30 uppercase tracking-widest">HOOK STRENGTH</div>
                  <div className="font-headline text-xl font-black text-on-surface/80">HIGH</div>
                </div>
                <div className="h-8 w-px bg-white/8 hidden md:block" />
                <div className="hidden md:block">
                  <div className="font-label text-[8px] text-on-surface/30 uppercase tracking-widest">MARKET GAP</div>
                  <div className="font-headline text-xl font-black text-on-surface/80">23%</div>
                </div>
                <div className="ml-auto hidden md:flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-label text-[7px] text-on-surface/20 uppercase">CONFIDENCE: 91.4%</span>
                </div>
              </div>

              {/* Metric bars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'CTR Potential', value: '+2.8×', pct: 75, bar: 'bg-[#FF0000]' },
                  { label: 'Retention', value: '>52%', pct: 65, bar: 'bg-green-500' },
                  { label: 'Saturation', value: '23%', pct: 23, bar: 'bg-gray-400' },
                  { label: 'Risk Score', value: '3/10', pct: 30, bar: 'bg-green-400' },
                ].map((m, i) => (
                  <motion.div key={m.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                    className="bg-surface-container/30 border border-white/5 rounded-sm px-3 py-2"
                  >
                    <div className="font-label text-[7px] text-on-surface/30 uppercase mb-1">{m.label}</div>
                    <div className="font-headline text-base font-bold text-on-surface/80 mb-1.5">{m.value}</div>
                    <div className="w-full bg-white/5 h-0.5 rounded-full overflow-hidden">
                      <motion.div className={`${m.bar} h-full rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.pct}%` }}
                        transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ROW 2: Hook Script + Content Gaps + Blueprint */}
          {outputStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3"
            >
              {/* Hook Script */}
              <div className="border border-white/5 bg-surface-container/20 rounded-sm p-3">
                <div className="font-label text-[8px] text-[#FF0000]/50 uppercase tracking-widest mb-2">HOOK SCRIPT</div>
                <p className="font-mono text-[11px] text-on-surface/80 leading-relaxed italic">
                  "90% of coding tutorials get under 500 views — not because they're bad, but because creators miss 3 things the top 1% do in the first 30 seconds."
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['Curiosity Gap', 'Social Proof'].map(t => (
                    <span key={t} className="text-[7px] font-label text-on-surface/30 border border-white/8 px-1.5 py-0.5 rounded-sm uppercase">{t}</span>
                  ))}
                </div>
              </div>

              {/* Content Gaps */}
              <div className="border border-white/5 bg-surface-container/20 rounded-sm p-3">
                <div className="font-label text-[8px] text-green-500/50 uppercase tracking-widest mb-2">CONTENT GAPS</div>
                <div className="space-y-1.5">
                  {[
                    { gap: 'Failure analysis angle', demand: 'HIGH', pct: 2 },
                    { gap: 'Salary negotiation', demand: 'MED-HIGH', pct: 8 },
                    { gap: 'Side-income with code', demand: 'HIGH', pct: 14 },
                  ].map((g, i) => (
                    <motion.div key={g.gap}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.07 }}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-green-500/60 text-[8px] shrink-0">◆</span>
                        <span className="text-on-surface/60 text-[10px] truncate">{g.gap}</span>
                      </div>
                      <span className={`font-label text-[7px] shrink-0 uppercase ${g.demand === 'HIGH' ? 'text-green-400/70' : 'text-amber-400/70'}`}>{g.pct}% covered</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pacing Blueprint */}
              <div className="border border-white/5 bg-surface-container/20 rounded-sm p-3">
                <div className="font-label text-[8px] text-on-surface/30 uppercase tracking-widest mb-2">PACING GUIDE</div>
                <div className="space-y-1">
                  {[
                    { t: '0–30s', l: 'HOOK', c: 'border-[#FF0000]/50' },
                    { t: '30s–1m', l: 'SETUP', c: 'border-gray-400/30' },
                    { t: '1–4m', l: 'EVIDENCE', c: 'border-gray-400/25' },
                    { t: '4–7m', l: 'REVEAL', c: 'border-gray-400/20' },
                    { t: '9–11m', l: 'CTA', c: 'border-green-500/40' },
                  ].map((s, i) => (
                    <motion.div key={s.t}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.06 }}
                      className={`flex items-center gap-2 border-l-2 ${s.c} pl-2`}
                    >
                      <span className="font-label text-[7px] text-on-surface/20 w-10">{s.t}</span>
                      <span className="font-label text-[9px] text-on-surface/60">{s.l}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ROW 3: Title + system footer */}
          {outputStep >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="border border-white/5 bg-surface-container/10 rounded-sm px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="font-label text-[7px] text-on-surface/20 uppercase tracking-widest mb-1">OPTIMISED TITLE</div>
                <div className="text-on-surface/80 text-sm font-bold leading-snug">"Why Your Tutorial Videos Keep Failing (Data From 500K Views)"</div>
                <div className="font-label text-[7px] text-on-surface/20 mt-1 uppercase">Angle: Contrarian + Data Evidence · Format: Tutorial → Reveal → CTA · 9–12 min</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <span className="font-label text-[7px] text-green-500/50 uppercase tracking-wider">Analysis complete</span>
                <span className="font-label text-[7px] text-on-surface/15 ml-2">42,847 videos scanned · 0.04ms</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

const LandingPage = () => {
  const canvasRef = useRef(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!hasStarted) return;
    const target = 47000000;
    const step = Math.ceil(target / (60 * 1.5));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted]);

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
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} className="font-headline text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-5 text-on-surface uppercase">
              KNOW BEFORE YOU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-on-surface to-primary/40">FILM.</span><br />
              WIN BEFORE YOU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-on-surface to-primary/40">UPLOAD.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="text-on-surface/50 text-sm sm:text-base font-light leading-relaxed max-w-3xl mx-auto mb-8 px-2">
              The market doesn't care how hard you worked. It rewards the
              right idea, positioned correctly, at exactly the right moment.
              ________ tells you if you have that — before you press record.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex items-center justify-center gap-2 sm:gap-4 mb-10 flex-wrap max-w-4xl mx-auto w-full px-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">1</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">Paste your idea</span>
              </div>
              <span className="text-outline-variant/30 text-sm font-light hidden sm:inline">→</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">2</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">AI scans the market</span>
              </div>
              <span className="text-outline-variant/30 text-sm font-light hidden sm:inline">→</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center shrink-0"><span className="font-label text-[8px] text-primary font-bold">3</span></div>
                <span className="font-label text-[10px] text-on-surface/50 uppercase tracking-widest">Get your verdict</span>
              </div>
              <span className="text-outline-variant/30 text-sm font-light hidden sm:inline">→</span>
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

            <div className="relative mt-12 mx-auto max-w-5xl w-full">
              {/* Live Demo Window */}
              <div className="relative rounded-lg overflow-hidden border border-outline-variant/15 shadow-[0_0_80px_rgba(255,0,0,0.06)] bg-surface-container-lowest">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10 bg-surface-container/50 backdrop-blur-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF0000]/40"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-on-surface/10"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-on-surface/10"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-surface-container-low/60 rounded-sm px-6 py-1 border border-outline-variant/10">
                      <span className="font-label text-[9px] text-on-surface/30 uppercase tracking-widest">STRAT_ENGN // LIVE ANALYSIS</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-label text-[8px] text-green-500/60 uppercase tracking-wider">LIVE</span>
                  </div>
                </div>

                {/* Live analysis demo */}
                <LiveDemoSequence />
              </div>
            </div>

            {/* CTA below demo window — sits outside, never overlaps */}
            <div className="flex justify-center mt-5">
              <Link to="/analyze" className="flex items-center gap-2 text-xs font-label text-on-surface/40 uppercase tracking-wider hover:text-primary transition-colors group">
                <span>Try it with your own idea</span>
                <span className="text-primary text-sm group-hover:translate-x-1 transition-transform">→</span>
              </Link>
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

        <section className="py-24 md:py-32 bg-surface-container-low/20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">

            {/* The Pain */}
            {/* <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mb-32 border-l-4 border-[#FF0000] pl-6 md:pl-10">
              <h2 className="font-headline text-4xl md:text-6xl font-black tracking-tighter mb-8 uppercase text-on-surface">You've been here before.</h2>
              <div className="space-y-6 text-on-surface/60 text-lg md:text-xl leading-relaxed font-body">
                <p>ou spent weeks producing a video. The execution was flawless. You invested real time and money. But it still failed to hit your usual numbers.</p>
                <p>Not because the quality was bad. Because the topic was already too crowded. Because someone else beat you to it. Because the angle didn't match what the audience craves right now.</p>
                <p className="text-on-surface/90 font-bold text-2xl pt-4">You can't afford to waste resources on a dead idea. You need facts and better intelligence, not guesses.</p>
              </div>
            </motion.div> */}
            {/* The Pain */}
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center mb-32">
              {/* Left Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="lg:w-1/2 border-l-4 border-[#FF0000] pl-6 md:pl-10 relative z-10"
              >
                <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-8 uppercase text-on-surface leading-[0.95]">
                  You've been<br />here before.
                </h2>
                <div className="space-y-6 text-on-surface/60 text-lg md:text-xl leading-relaxed font-body">
                  <p>
                    You spent weeks producing a video. The execution was flawless. You invested real time and money. But it still failed to hit your usual numbers.
                  </p>
                  <p>
                    Not because the quality was bad. Because you are competing against <span className="text-on-surface font-bold">2.6 million</span> new videos every single day. YouTube is a winner-takes-all market — data shows that less than <span className="text-[#FF0000] font-bold">1%</span> of videos capture over <span className="text-[#FF0000] font-bold">80%</span> of the platform's total views.
                  </p>
                  <p>
                    If your angle is even slightly off, or your hook fails in the first <span className="text-on-surface font-bold">30 seconds</span>, the algorithm buries your expensive production to promote a competitor.
                  </p>
                  <p className="text-on-surface/90 font-bold text-2xl pt-4">
                    You can't afford to waste resources on a dead idea. You need hard market intelligence, not guesses.
                  </p>
                </div>
              </motion.div>

              {/* Right Video Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="lg:w-1/2 w-full relative group"
              >
                {/* Ambient Glow */}
                <div className="absolute -inset-10 bg-[#FF0000]/10 rounded-full blur-[80px] group-hover:bg-[#FF0000]/15 transition-colors duration-1000 pointer-events-none z-0"></div>

                {/* Video Container */}
                <div className="relative rounded-sm overflow-hidden border border-outline-variant/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black z-10 aspect-[4/3] transform transition-transform duration-700 group-hover:-translate-y-1">

                  {/* Blending Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-20 pointer-events-none"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/50 via-transparent to-transparent z-20 pointer-events-none"></div>

                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-80 mix-blend-lighten"
                    src="https://res.cloudinary.com/dqy8yhjlk/video/upload/c_fill,ar_4:3,q_auto,f_auto/v1775912944/Video_Generation_Progress_Update_ltw6af.mp4"
                  >
                    Your browser does not support the video tag.
                  </video>

                  {/* Tactical Badge Overlay */}
                  <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-[#0A0A0A]/80 backdrop-blur-md border border-outline-variant/20 px-3 py-1.5 rounded-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse shadow-[0_0_8px_rgba(255,0,0,1)]"></div>
                      <span className="font-label text-[9px] uppercase tracking-[0.2em] text-[#FF0000] font-bold">
                        Retention Velocity // Critical
                      </span>
                    </div>
                    <div className="font-label text-[8px] text-on-surface/30 tracking-widest uppercase pl-1">
                      SYS_ID: 0X-FLATLINE-DETECTION
                    </div>
                  </div>

                  {/* Tech Grid Overlay */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 z-20 pointer-events-none"></div>
                </div>
              </motion.div>
            </div>

            {/* Who It's For */}
            <div className="mb-16 text-center md:text-left">
              <h2 className="font-headline text-3xl font-black tracking-tight uppercase">Built for creators who treat their channel like a business.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-full"
              >
                <StarBorder as="div" color="#FF0000" speed="6s" className="w-full h-full">
                  <div className="font-label text-[10px] text-[#FF0000] uppercase tracking-widest mb-4">THE RISING CREATOR</div>
                  <p className="text-on-surface/50 text-sm leading-relaxed font-body">You have momentum, but every upload still feels like a risk. You want to scale up, and you need to know exactly what works so you don't lose your growth.</p>
                </StarBorder>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full"
              >
                <StarBorder as="div" color="#FF0000" speed="6s" className="w-full h-full">
                  <div className="font-label text-[10px] text-[#FF0000] uppercase tracking-widest mb-4">THE STRATEGIST</div>
                  <p className="text-on-surface/50 text-sm leading-relaxed font-body">Your quality is already high. Now you want to find the exact gaps your competitors are missing. You want to know an idea will win before you even turn on the camera.</p>
                </StarBorder>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-full"
              >
                <StarBorder as="div" color="#FF0000" speed="6s" className="w-full h-full">
                  <div className="font-label text-[10px] text-[#FF0000] uppercase tracking-widest mb-4">THE STUDIO</div>
                  <p className="text-on-surface/50 text-sm leading-relaxed font-body">Your channel is a company. You have a team and a budget. You do not gamble with production costs. You need hard market data and intelligent insights to protect your time and your money. It automates the brainstorming process for you and your team.</p>
                </StarBorder>
              </motion.div>
            </div>
          </div>
        </section>

        {/* <section className="py-24 md:py-32 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="mb-24">
            <h2 className="font-headline text-4xl sm:text-6xl font-black mb-4 tracking-tighter uppercase">What you walk away with.</h2>
            <div className="w-24 h-1 bg-[#FF0000]"></div>
          </div>

          <div className="space-y-16 md:space-y-24">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
              <div className="md:w-1/3">
                <h3 className="font-headline text-3xl font-bold uppercase text-[#FF0000]">A Verdict.</h3>
              </div>
              <div className="md:w-2/3">
                <p className="text-on-surface/80 text-lg md:text-xl font-body leading-relaxed">
                  Not a maybe. Not a score out of 10. A clear, direct answer on whether your idea is worth filming — and exactly what needs to change if it isn't.
                </p>
              </div>
            </motion.div>

            <div className="w-full h-px bg-outline-variant/10"></div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
              <div className="md:w-1/3">
                <h3 className="font-headline text-3xl font-bold uppercase text-[#FF0000]">A Strategy.</h3>
              </div>
              <div className="md:w-2/3">
                <p className="text-on-surface/80 text-lg md:text-xl font-body leading-relaxed mb-4">
                  The exact title that will compete. The exact hook that holds past 30 seconds. The exact thumbnail concept built to stand out against every competitor in your niche.
                </p>
                <p className="text-on-surface/40 text-sm font-label uppercase tracking-widest">Built from what's actually working right now.</p>
              </div>
            </motion.div>

            <div className="w-full h-px bg-outline-variant/10"></div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
              <div className="md:w-1/3">
                <h3 className="font-headline text-3xl font-bold uppercase text-[#FF0000]">A Blueprint.</h3>
              </div>
              <div className="md:w-2/3">
                <p className="text-on-surface/80 text-lg md:text-xl font-body leading-relaxed">
                  Your video, planned frame by frame before you film a single second. Retention traps identified. Structure mapped. The difference between a video that holds and one that haemorrhages viewers at the 2-minute mark.
                </p>
              </div>
            </motion.div>
          </div>
        </section> */}

        <section className="py-16 md:py-32 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3 sticky top-32 h-fit z-10 bg-surface/90 backdrop-blur-md md:bg-transparent md:backdrop-blur-none px-1 pt-1 pb-3 md:p-0 -mx-1 md:mx-0">
              <h2 className="font-headline text-2xl sm:text-4xl font-black mb-4 tracking-tight">What you walk away with.</h2>
              <div className="w-12 h-0.5 bg-[#FF0000] mb-4"></div>
              <p className="text-on-surface/30 text-xs font-label uppercase tracking-widest leading-relaxed hidden md:block">Three outputs. Zero guesswork.</p>
            </div>
            <div className="md:w-2/3 space-y-6 md:space-y-8">
              <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="flex gap-4 sm:gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-1 transition-all">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                  </div>
                  <div className="w-px h-full bg-outline-variant/20 mt-4 relative overflow-hidden">
                    <div className="pipeline-line-pulse pulse-1"></div>
                  </div>
                </div>
                <div className="pb-8 sm:pb-10 pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-1 transition-all">01 // THE VERDICT</span>
                  <h3 className="font-headline text-xl font-bold mb-3">Clear GO, MODIFY, or ABORT.</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-4">Not a maybe. Not a score out of 10. A clear, direct answer on whether your idea is worth filming — and exactly what needs to change if it isn't.</p>
                  <div className="bg-surface-container-lowest p-3 rounded-sm border border-outline-variant/5 font-label text-[11px] text-on-surface/30"><span className="text-primary-container">LOG:</span> MARKET SCANNED... <span className="text-secondary">VERDICT READY</span><br /><span className="text-primary-container">LOG:</span> ENTRY OPPORTUNITY... <span className="text-secondary">IDENTIFIED</span></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex gap-4 sm:gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-2 transition-all">
                    <span className="material-symbols-outlined text-sm">query_stats</span>
                  </div>
                  <div className="w-px h-full bg-outline-variant/20 mt-4 relative overflow-hidden">
                    <div className="pipeline-line-pulse pulse-2"></div>
                  </div>
                </div>
                <div className="pb-8 sm:pb-10 pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-2 transition-all">02 // A STRATEGY</span>
                  <h3 className="font-headline text-xl font-bold mb-3">The exact title and hook.</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-4">Built from what's actually working right now. You get the exact title, the hook that holds past 30 seconds, and the thumbnail concept built to stand out against every competitor in your niche.</p>
                  <div className="bg-surface-container-lowest p-3 rounded-sm border border-outline-variant/5 font-label text-[11px] text-on-surface/30"><span className="text-primary-container">LOG:</span> CONTENT GAP... <span className="text-secondary">FOUND</span><br /><span className="text-primary-container">LOG:</span> YOUR ANGLE... <span className="text-secondary">LOCKED</span></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="flex gap-4 sm:gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center pipeline-node-3 transition-all">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="inline-block font-label text-[10px] px-2 py-0.5 rounded-sm mb-4 pipeline-tag-3 transition-all">03 // THE BLUEPRINT</span>
                  <h3 className="font-headline text-xl font-bold mb-3">Frame-by-frame structure.</h3>
                  <p className="text-on-surface/50 text-sm font-body leading-relaxed mb-4">Your video, planned before you film a single second. Retention traps identified. Structure mapped. The difference between a video that holds viewers and one that loses them at the 2-minute mark.</p>
                  <div className="bg-surface-container-lowest p-3 rounded-sm border border-outline-variant/5 font-label text-[11px] text-on-surface/30 mb-5"><span className="text-primary-container">LOG:</span> PRODUCTION BRIEF... <span className="text-secondary">COMPLETE</span><br /><span className="text-primary-container">LOG:</span> READY TO FILM... <span className="text-secondary">GO</span></div>
                  <Link to="/analyze" className="inline-block bg-surface-bright text-on-surface px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container-highest transition-colors">TRY IT NOW</Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface-container-low/30 relative">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mb-20 space-y-4">
              <h2 className="font-headline text-3xl sm:text-5xl font-black tracking-tighter">The Growth Engine</h2>
              <p className="text-on-surface/40 uppercase font-label text-[11px] tracking-widest">Professional-grade intelligence built for creators who take growth seriously.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">

              {/* F1 & F2 (Left Box) - Containing the AVOID UI + the F2 bottom bars */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-2 md:row-span-2 bg-surface-container p-4 sm:p-8 border border-outline-variant/10 rounded-sm flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#FF0000]/5 rounded-full blur-3xl group-hover:bg-[#FF0000]/10 transition-colors"></div>

                {/* Restored Icon + Moved F3 Content (AVOID UI) */}
                <div className="flex flex-col gap-4 relative z-10">
                  <span className="material-symbols-outlined text-[#FF0000] mb-2">block</span>

                  <div>
                    <div className="font-label text-[9px] text-primary/40 uppercase tracking-widest mb-2">VERDICT_ENGINE</div>
                    <h3 className="font-headline text-xl sm:text-3xl font-bold mb-1">If it won't work, we say so.</h3>
                  </div>

                  <div className="bg-surface-container-lowest border border-[#FF0000]/15 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000]"></div>
                        <span className="font-label text-[10px] text-[#FF0000] uppercase tracking-widest">VERDICT: AVOID</span>
                      </div>
                      <span className="font-label text-[8px] text-on-surface/20 uppercase">ANALYST_OUTPUT</span>
                    </div>
                    <div className="h-px bg-outline-variant/10 mb-3"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      <div><div className="font-label text-[8px] text-on-surface/30 mb-1">MARKET SAT.</div><div className="text-xs font-semibold text-on-surface/70">89% — Critical</div></div>
                      <div><div className="font-label text-[8px] text-on-surface/30 mb-1">GROWTH VEL.</div><div className="text-xs font-semibold text-on-surface/70">−12% YoY</div></div>
                      <div><div className="font-label text-[8px] text-on-surface/30 mb-1">ENTRY RISK</div><div className="text-xs font-semibold text-[#FF0000]">HIGH</div></div>
                    </div>
                    <div className="text-[10px] font-label text-on-surface/30">REC → <span className="text-on-surface/50">Pivot content angle before investing in production</span></div>
                  </div>

                  <p className="text-on-surface/45 text-[15px] leading-relaxed pr-4">When the market is dead or dominated, the verdict is AVOID. Not "it's a bit competitive." AVOID. You get told to pivot before you waste 40 hours on a video nobody will find. Because your time is worth more than a polite answer.</p>
                </div>

                {/* F2 Content (Red Bars) */}
                <div className="mt-8 flex items-center gap-6 relative z-10">
                  <div className="w-full bg-surface-container-lowest/50 border border-outline-variant/10 rounded-sm p-4 flex flex-row items-center gap-6">
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
                      <p className="text-[15px] leading-relaxed text-on-surface/70 font-body tracking-tight">
                        AI-driven insights that cut research time and surface the exact growth moves that matter — so you spend your energy creating, not second-guessing.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* F3 (Top Right Box) - Explaining time saved */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-2 bg-surface p-6 border border-outline-variant/10 rounded-sm flex flex-col justify-center gap-3 overflow-hidden">
                <div>
                  <div className="font-label text-[9px] text-primary/40 uppercase tracking-widest mb-2">TIME_MULTIPLIER</div>
                  <h3 className="font-headline text-xl font-bold">Skip the research phase.</h3>
                </div>
                <p className="text-on-surface/45 text-[14px] leading-relaxed">
                  Reclaim the hours you spend endlessly brainstorming, manually analyzing competitor channels, and second-guessing trends. We automate the deep market analysis so you get instant clarity on what works. Spend your time actually filming and growing, not trapped in the research phase.
                </p>
              </motion.div>

              {/* F4 (Bottom Right 1) */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-1 bg-surface-container-high p-6 border border-outline-variant/15 rounded-sm flex flex-col justify-center">
                <span className="material-symbols-outlined text-[#FF0000] mb-4">priority_high</span>
                <h3 className="font-headline font-bold text-xl uppercase tracking-wider mb-2">Gap Discovery</h3>
                <p className="text-on-surface/40 text-[13px] leading-relaxed">Find what nobody else is making. Competitor analysis maps what exists. Audience demand signals reveal what's missing. The gap between them is your entry point.</p>
              </motion.div>

              {/* F5 (Bottom Right 2) */}
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 25 } }} className="md:col-span-1 bg-surface-container-lowest p-6 border border-outline-variant/20 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="font-label text-[10px] text-on-surface/30 mb-2">CREATOR_CONTEXT</div>
                  <div className="text-xl font-headline font-bold text-[#FF0000] leading-tight mb-4">Built for your Channel.</div>
                  <p className="text-on-surface/40 text-[15px] leading-relaxed">Generic advice is dangerous. Every single recommendation adapts to your needs and your audience.</p>
                  <p className="text-on-surface/40 text-[15px] leading-relaxed">Intelligence that focuses on your strong suits and helps you grow.</p>
                </div>
                <div className="flex gap-1 mt-4">
                  <div className="w-1 h-4 bg-[#FF0000]/40"></div>
                  <div className="w-1 h-4 bg-[#FF0000]/40"></div>
                  <div className="w-1 h-4 bg-[#FF0000]/40"></div>
                  <div className="w-1 h-4 bg-[#FF0000]"></div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        <section className="py-16 md:py-32 px-4 md:px-8">
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

        <section className="py-32 relative bg-surface-container-lowest border-t border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-4 md:px-8">

            <div className="mb-20 text-center">
              <h2 className="font-headline text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">Choose Your Edge.</h2>
              <p className="text-on-surface/40 font-label text-xs uppercase tracking-widest">Not sure? Start free. You'll know within your first analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free Tier */}
              <div className="bg-surface-container p-8 border border-outline-variant/10 rounded-sm flex flex-col justify-between hover:border-outline-variant/30 transition-colors">
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-4 uppercase">Free</h3>
                  <p className="text-on-surface/50 text-sm mb-12">Test the intelligence. See if it changes how you think about your content.</p>
                </div>
                <div>
                  <div className="text-on-surface/80 text-sm font-bold mb-6 pb-6 border-b border-outline-variant/10">2 analyses per week</div>
                  <Link to="/analyze" className="w-full block text-center bg-surface border border-outline-variant/20 text-on-surface py-4 text-xs font-bold tracking-wider uppercase hover:bg-surface-container-high transition-colors rounded-sm">Start Free</Link>
                </div>
              </div>

              {/* Pro Tier (Highlighted) */}
              <div className="bg-surface-container-high p-8 border border-[#FF0000]/30 rounded-sm flex flex-col justify-between relative shadow-[0_0_40px_rgba(255,0,0,0.05)] transform md:-translate-y-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FF0000]"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-headline text-2xl font-bold uppercase text-[#FF0000]">Pro</h3>
                    <span className="material-symbols-outlined text-[#FF0000] text-sm">star</span>
                  </div>
                  <p className="text-on-surface/70 text-sm mb-12">Your unfair advantage. Full analysis with your channel's DNA baked in.</p>
                </div>
                <div>
                  <div className="text-on-surface/80 text-sm font-bold mb-6 pb-6 border-b border-outline-variant/10">7 analyses per week</div>
                  <Link to="/pricing" className="w-full block text-center bg-[#FF0000] text-white py-4 text-xs font-bold tracking-wider uppercase hover:bg-[#FF0000]/90 transition-colors rounded-sm shadow-lg shadow-[#FF0000]/20">Go Pro</Link>
                </div>
              </div>

              {/* Ultimate Tier */}
              <div className="bg-surface-container p-8 border border-outline-variant/10 rounded-sm flex flex-col justify-between hover:border-outline-variant/30 transition-colors">
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-4 uppercase">Ultimate</h3>
                  <p className="text-on-surface/50 text-sm mb-12">No limits. No compromises. Full access, every day.</p>
                </div>
                <div>
                  <div className="text-on-surface/80 text-sm font-bold mb-6 pb-6 border-b border-outline-variant/10">Unlimited analyses</div>
                  <Link to="/pricing" className="w-full block text-center bg-surface border border-outline-variant/20 text-on-surface py-4 text-xs font-bold tracking-wider uppercase hover:bg-surface-container-high transition-colors rounded-sm">Go Ultimate</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface-container-lowest border-y border-outline-variant/10">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px flex-1 bg-outline-variant/20"></div>
              <h2 className="font-headline text-lg sm:text-2xl font-black tracking-widest uppercase">FREQUENTLY ASKED</h2>
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

        <section className="py-20 md:py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-secondary-container/10 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center relative z-10">
            <h4 className="font-headline text-xl md:text-2xl font-black tracking-tighter mb-6 leading-tight">
              Most creators film first and hope.<br />
              <span className="text-[#FF0000]">You'll know first.</span>
            </h4>
            <motion.h2 initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} className="font-headline text-5xl md:text-7xl font-black tracking-tighter mb-8 text-on-surface uppercase">Ready to Grow?</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="text-on-surface/60 max-w-xl mx-auto mb-12 text-sm leading-relaxed">Early access is limited. No credit card. No commitment. Just your next video idea and two minutes.</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.35 }} className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <input className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-6 py-4 w-full md:w-80 text-xs font-label focus:outline-none focus:border-primary transition-colors text-on-surface" placeholder="ENTER_EMAIL_ADDRESS" type="email" />
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}><Link to="/signup" className="bg-[#970100] hover:bg-[#b50100] px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_40px_rgba(255,0,0,0.4)] transition-all text-white block">Get Early Access</Link></motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 md:py-8 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[#1C1B1B] bg-[#0E0E0E] dark:bg-[#0E0E0E]">
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


      {/* <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline-variant/10 bg-[#000000]">
        <div className="font-headline font-bold text-[#FF0000] uppercase tracking-widest text-xl">
          NIDEON
        </div>
        <div className="flex flex-wrap justify-center gap-8 font-label text-[10px] uppercase tracking-widest text-on-surface/40">
          <Link className="hover:text-[#FF0000] transition-colors" to="/pricing">Pricing</Link>
          <a className="hover:text-[#FF0000] transition-colors" href="#">Security</a>
          <a className="hover:text-[#FF0000] transition-colors" href="#">Terms</a>
          <a className="hover:text-[#FF0000] transition-colors" href="#">Privacy</a>
        </div>
        <div className="font-label text-[10px] uppercase tracking-widest text-on-surface/30 text-center md:text-right">
          © {new Date().getFullYear()} NIDEON. ALL RIGHTS RESERVED.
        </div>
      </footer> */}
    </div>
  );
};

export default LandingPage;
