import React from 'react';

const StarBorder = ({
  as: Component = 'div',
  className = '',
  color = '#FF0000',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}) => {
  const glow = color;
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...rest.style
      }}
      {...rest}
    >
      {/* Sweeping neon glow blobs — blurred for bloom effect */}
      <div
        className="absolute w-[300%] h-[80%] bottom-[-20px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${glow} 0%, transparent 60%)`,
          opacity: 0.85,
          filter: 'blur(14px)',
          animationDuration: speed
        }}
      />
      <div
        className="absolute w-[300%] h-[80%] top-[-20px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${glow} 0%, transparent 60%)`,
          opacity: 0.85,
          filter: 'blur(14px)',
          animationDuration: speed
        }}
      />
      {/* Inner card — no static border, only the animated sweep shows */}
      <div className="relative z-1 bg-gradient-to-b from-[#0e0e0e] to-[#1c1b1b] text-white py-[16px] px-[26px] rounded-[20px] h-full">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
