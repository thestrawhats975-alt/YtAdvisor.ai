import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const activeStyle = "font-['Space_Grotesk'] tracking-tight uppercase text-xs font-bold text-[#FF0000] border-b border-[#FF0000] pb-1 transition-all";
  const inactiveStyle = "font-['Space_Grotesk'] tracking-tight uppercase text-xs font-bold text-[#E5E2E1]/60 hover:text-[#E5E2E1] transition-all";

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#131313]/40 backdrop-blur-xl border-b border-[#603E39]/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto h-[72px]">
        <Link to="/" className="text-xl font-bold tracking-tighter text-[#E5E2E1] font-['Space_Grotesk']">
            STRAT_ENGN
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/pricing" className={({ isActive }) =>  isActive ? activeStyle : inactiveStyle}>PRICING</NavLink>
          <NavLink to="/analyze" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>ANALYSIS</NavLink>
          <NavLink to="/login" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>LOGIN</NavLink>
        </div>
        <button 
          onClick={() => navigate('/signup')}
          className="bg-[#b30000] text-white px-5 py-2 rounded-[2px] font-['Space_Grotesk'] tracking-widest uppercase text-xs font-bold hover:bg-[#d60000] hover:shadow-[0_0_20px_rgba(200,0,0,0.6)] transition-all duration-300 active:scale-95 border border-[#ff0000]/20"
        >
            GET EARLY ACCESS
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
