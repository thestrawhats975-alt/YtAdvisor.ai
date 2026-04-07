import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const InputPage = () => {
  const [formData, setFormData] = useState({
    videoIdea: ''
  });

  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        video_idea: formData.videoIdea
      };

      const baseUrl = import.meta.env.BACKEND_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the analysis response instantly to endure browser page reloads!
      localStorage.setItem('dimenziq_analysis', JSON.stringify(data));
      setSuccess(true);
      
      // Navigate to the results dashboard generically
      navigate('/results');
    } catch (err) {
      console.error('Failed to submit analysis:', err);
      setError(err.message || 'Failed to connect to the analysis engine.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] font-body min-h-screen selection:bg-spectre-red/30 selection:text-on-primary">
      <Navbar />

      <main className="flex min-h-[calc(100vh-72px)] pt-[72px]">
        {/* Side Navigation Shell */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-[72px] h-[calc(100vh-72px)] w-64 z-40 bg-[#0E0E0E] border-r border-[#603E39]/15 font-['Inter'] text-[0.6875rem] uppercase tracking-[0.05em]">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center border border-white/5">
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <div>
                <div className="text-[#E5E2E1] font-bold">Spectre v1.0</div>
                <div className="text-[#E5E2E1]/40 text-[10px]">Elite Intelligence</div>
              </div>
            </div>
            <nav className="space-y-1">
              <Link className="bg-[#1C1B1B] text-[#FFB4A8] border-l-2 border-[#FFB4A8] flex items-center px-4 py-3 hover:translate-x-1 duration-200" to="/analyze">
                <span className="material-symbols-outlined mr-3 text-sm">dashboard</span> Dashboard
              </Link>
              <Link className="text-[#E5E2E1]/50 hover:bg-[#1C1B1B]/50 flex items-center px-4 py-3 transition-all hover:translate-x-1 duration-200" to="/analyze">
                <span className="material-symbols-outlined mr-3 text-sm">videocam</span> Video Intel
              </Link>
              <Link className="text-[#E5E2E1]/50 hover:bg-[#1C1B1B]/50 flex items-center px-4 py-3 transition-all hover:translate-x-1 duration-200" to="/analyze">
                <span className="material-symbols-outlined mr-3 text-sm">analytics</span> Channel Ops
              </Link>
              <Link className="text-[#E5E2E1]/50 hover:bg-[#1C1B1B]/50 flex items-center px-4 py-3 transition-all hover:translate-x-1 duration-200" to="/analyze">
                <span className="material-symbols-outlined mr-3 text-sm">monitoring</span> Market Pulse
              </Link>
              <Link className="text-[#E5E2E1]/50 hover:bg-[#1C1B1B]/50 flex items-center px-4 py-3 transition-all hover:translate-x-1 duration-200" to="/analyze">
                <span className="material-symbols-outlined mr-3 text-sm">settings</span> Settings
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-6">
            <button className="w-full bg-secondary-container text-white py-4 font-bold tracking-[0.1em] hover:bg-[#B30000] transition-colors border border-white/10">
              Upgrade to Pro
            </button>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <section className="flex-1 lg:ml-64 flex flex-col items-center p-8 bg-[#0A0A0A] relative overflow-hidden">
          {/* Background Decor */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(255,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-[0.3]"></div>
          
          <div className="w-full max-w-[768px] mx-auto space-y-12 py-12 relative z-10">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter uppercase text-on-surface">
                Analysis <span className="text-spectre-red">Input</span>
              </h1>
              <p className="font-body text-on-surface/40 text-[10px] tracking-[0.4em] uppercase">Initialize Market Penetration Scan</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Primary Input: Video Idea */}
              <div className="space-y-4">
                <label className="block font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-spectre-red/70 ml-1">Video Objective</label>
                <div className="bg-white/[0.02] backdrop-blur-[10px] border border-white/5 relative corner-accent group transition-all duration-300 focus-within:border-spectre-red/30">
                  <textarea 
                    className="w-full bg-transparent border-none text-on-surface p-6 text-xl font-light placeholder:text-on-surface/10 focus:ring-0 transition-all resize-none font-headline leading-relaxed" 
                    name="videoIdea" 
                    placeholder="Enter objective or title hypothesis..." 
                    rows="4"
                    value={formData.videoIdea}
                    onChange={handleChange}
                    required
                  ></textarea>
                  <div className="absolute bottom-0 left-0 h-[1px] bg-spectre-red w-0 group-focus-within:w-full transition-all duration-500"></div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex flex-col items-center pt-8 border-t border-white/5 mt-10">
                <div className="mb-4 text-center">
                  <p className="font-mono text-[8px] text-on-surface/30 uppercase tracking-[0.2em] mb-2">Request Payload Preparation</p>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-[9px] font-mono text-spectre-red">{'{'}</span>
                    <span className="text-[9px] font-mono text-on-surface/60">video_idea</span>
                    <span className="text-[9px] font-mono text-spectre-red">{'}'}</span>
                  </div>
                </div>
                
                {error && (
                  <div className="mb-4 px-4 py-2 border border-red-500/50 bg-red-500/10 text-red-500 font-label text-xs rounded-sm">
                    [ERROR] {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 px-4 py-2 border border-green-500/50 bg-green-500/10 text-green-500 font-label text-xs rounded-sm">
                    [SUCCESS] Engine received payload. Awaiting further processing UI.
                  </div>
                )}
                
                <button 
                  disabled={isLoading}
                  className="group relative w-full md:w-auto md:min-w-[280px] bg-spectre-red text-white py-4 px-8 font-headline font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-[#FF0000] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]" 
                  type="submit"
                >
                  {isLoading ? 'Processing...' : 'Analyze Market'}
                  {!isLoading && <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">bolt</span>}
                </button>
                
                <div className="mt-6 flex flex-col items-center gap-2">
                  <p className="font-label text-[9px] text-on-surface/20 uppercase tracking-[0.4em]">
                    {isLoading ? 'Neural Compute Engaged...' : 'Neural Compute Requirement: 4-8s'}
                  </p>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-spectre-red/40 rounded-full animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                    <div className="w-1 h-1 bg-spectre-red/40 rounded-full animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ animationDelay: '1s' }}></div>
                    <div className="w-1 h-1 bg-spectre-red/40 rounded-full animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ animationDelay: '2s' }}></div>
                  </div>
                </div>
              </div>
            </form>

            <style dangerouslySetInnerHTML={{__html: `
              .corner-accent::before, .corner-accent::after {
                content: '';
                position: absolute;
                width: 4px;
                height: 4px;
                border-color: rgba(255, 255, 255, 0.2);
                pointer-events: none;
              }
              .corner-accent::before {
                top: 0;
                left: 0;
                border-top: 1px solid;
                border-left: 1px solid;
              }
              .corner-accent::after {
                bottom: 0;
                right: 0;
                border-bottom: 1px solid;
                border-right: 1px solid;
              }
            `}} />

            {/* Creative Signal Integrity Visual */}
            <div className="pt-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-white/5"></div>
                <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-on-surface/20">System Diagnostics</span>
                <div className="flex-1 h-[1px] bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Integrity */}
                <div className="bg-white/[0.02] border border-white/5 p-4 relative overflow-hidden">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[8px] text-on-surface/40 uppercase tracking-widest font-bold">Signal Integrity</span>
                    <span className="text-[8px] text-spectre-red font-mono">92.4%</span>
                  </div>
                  <div className="h-[2px] bg-white/5 w-full">
                    <div className="h-full bg-spectre-red/40 w-[92%] relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-spectre-red shadow-[0_0_8px_#FF0000]"></div>
                    </div>
                  </div>
                </div>
                {/* Latency */}
                <div className="bg-white/[0.02] border border-white/5 p-4 relative overflow-hidden">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[8px] text-on-surface/40 uppercase tracking-widest font-bold">Market Latency</span>
                    <span className="text-[8px] text-primary/60 font-mono">14ms</span>
                  </div>
                  <div className="h-[2px] bg-white/5 w-full">
                    <div className="h-full bg-primary/40 w-[14%]"></div>
                  </div>
                </div>
                {/* Node Load */}
                <div className="bg-white/[0.02] border border-white/5 p-4 relative overflow-hidden">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[8px] text-on-surface/40 uppercase tracking-widest font-bold">Compute Load</span>
                    <span className="text-[8px] text-primary/60 font-mono">0.38 t/FLOP</span>
                  </div>
                  <div className="h-[2px] bg-white/5 w-full">
                    <div className="h-full bg-primary/40 w-[38%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Visual Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-spectre-red/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-secondary-container/5 blur-[100px] rounded-full"></div>
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLHJtvBiY-acMNMuqq7zWi-P8OKKX7hXM5u4L3GKkpivQoTJHx0UZ3U-5FOG91n4yKzrBsDcNFFB6bi8aQ78wuqpbWBdur2M9Dk73CEMJBwcVJ_2DU7kfl-mnHWSQiOgraxyhJsW5KOkDy23v9BAKjjUIPAk1Ebu7iKQInMHyyn9oxOSFEXg7c1SoUhFpwJBlTgtRnMl9-eqFccp4mZP-05ghKDbAbs5ABM2HZ_AQ_C97gG7p6Y1tfsrJ3RR4qdM2QfnYwjUbQlUY')"}}
        ></div>
      </div>
    </div>
  );
};

export default InputPage;
