import React, { useMemo } from 'react';
import { TimeDirection } from '../types';

interface AnimatedBackgroundProps {
  timeDirection?: TimeDirection;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ timeDirection = 'none' }) => {
  // Memoize all particle properties to prevent re-randomization on re-renders
  const distantStars = useMemo(() => 
    [...Array(400)].map((_, i) => ({
      id: i,
      size: 0.3 + Math.random() * 0.8,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 12,
      animationDuration: 3 + Math.random() * 6,
      color: i % 5 === 0 ? 'bg-white/40' : 
             i % 5 === 1 ? 'bg-blue-200/30' : 
             i % 5 === 2 ? 'bg-yellow-200/25' : 
             i % 5 === 3 ? 'bg-purple-200/20' :
             'bg-cyan-200/25'
    })), []
  );

  const mediumStars = useMemo(() => 
    [...Array(150)].map((_, i) => ({
      id: i,
      size: 0.8 + Math.random() * 1.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 8,
      animationDuration: 2 + Math.random() * 4,
      boxShadow: 1.5 + Math.random() * 3,
      color: i % 4 === 0 ? 'bg-white/60' : 
             i % 4 === 1 ? 'bg-cyan-200/50' : 
             i % 4 === 2 ? 'bg-yellow-100/50' :
             'bg-blue-100/45'
    })), []
  );

  const brightStars = useMemo(() => 
    [...Array(80)].map((_, i) => ({
      id: i,
      size: 1.5 + Math.random() * 2.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 6,
      animationDuration: 1.5 + Math.random() * 3,
      boxShadow1: 3 + Math.random() * 6,
      boxShadow2: 6 + Math.random() * 12,
      color: i % 3 === 0 ? 'bg-white/80' : 
             i % 3 === 1 ? 'bg-blue-100/70' :
             'bg-cyan-100/70'
    })), []
  );

  // New galactic dust layer for fine cosmic particles
  const galacticDust = useMemo(() => 
    [...Array(300)].map((_, i) => ({
      id: i,
      size: 0.2 + Math.random() * 0.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 20,
      animationDuration: 8 + Math.random() * 12,
      color: i % 6 === 0 ? 'bg-purple-300/15' :
             i % 6 === 1 ? 'bg-blue-300/15' :
             i % 6 === 2 ? 'bg-cyan-300/15' :
             i % 6 === 3 ? 'bg-indigo-300/15' :
             i % 6 === 4 ? 'bg-violet-300/15' :
             'bg-pink-300/10'
    })), []
  );

  const nebulaClouds = useMemo(() => 
    [...Array(18)].map((_, i) => ({
      id: i,
      width: 250 + Math.random() * 500,
      height: 250 + Math.random() * 500,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 30,
      animationDuration: 25 + Math.random() * 40,
      gradient: i % 6 === 0 ? 'bg-gradient-to-r from-red-500/12 to-orange-500/12' :
                i % 6 === 1 ? 'bg-gradient-to-r from-green-500/12 to-teal-500/12' :
                i % 6 === 2 ? 'bg-gradient-to-r from-yellow-500/12 to-amber-500/12' :
                i % 6 === 3 ? 'bg-gradient-to-r from-blue-500/12 to-purple-500/12' :
                i % 6 === 4 ? 'bg-gradient-to-r from-pink-500/12 to-red-500/12' :
                'bg-gradient-to-r from-cyan-500/12 to-green-500/12'
    })), []
  );

  const mediumNebula = useMemo(() => 
    [...Array(35)].map((_, i) => ({
      id: i,
      width: 120 + Math.random() * 250,
      height: 120 + Math.random() * 250,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 25,
      animationDuration: 20 + Math.random() * 30,
      gradient: i % 5 === 0 ? 'bg-gradient-to-r from-orange-400/8 to-red-400/8' :
                i % 5 === 1 ? 'bg-gradient-to-r from-teal-400/8 to-green-400/8' :
                i % 5 === 2 ? 'bg-gradient-to-r from-amber-400/8 to-yellow-400/8' :
                i % 5 === 3 ? 'bg-gradient-to-r from-purple-400/8 to-blue-400/8' :
                'bg-gradient-to-r from-red-400/8 to-pink-400/8'
    })), []
  );

  const gasClouds = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      width: 60 + Math.random() * 120,
      height: 60 + Math.random() * 120,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 15,
      animationDuration: 15 + Math.random() * 25,
      gradient: i % 4 === 0 ? 'bg-gradient-to-r from-red-300/6 to-orange-300/6' :
                i % 4 === 1 ? 'bg-gradient-to-r from-green-300/6 to-teal-300/6' :
                i % 4 === 2 ? 'bg-gradient-to-r from-yellow-300/6 to-amber-300/6' :
                'bg-gradient-to-r from-blue-300/6 to-purple-300/6'
    })), []
  );

  const cosmicDust = useMemo(() => 
    [...Array(25)].map((_, i) => ({
      id: i,
      width: 400 + Math.random() * 600,
      height: 1.5 + Math.random() * 3,
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotation: Math.random() * 360,
      animationDelay: Math.random() * 35,
      animationDuration: 30 + Math.random() * 50,
      gradient: i % 4 === 0 ? 'bg-gradient-to-r from-transparent via-red-400/4 to-transparent' :
                i % 4 === 1 ? 'bg-gradient-to-r from-transparent via-green-400/4 to-transparent' :
                i % 4 === 2 ? 'bg-gradient-to-r from-transparent via-yellow-400/4 to-transparent' :
                'bg-gradient-to-r from-transparent via-blue-400/4 to-transparent'
    })), []
  );

  // Pulsing cosmic energy waves
  const energyWaves = useMemo(() => 
    [...Array(8)].map((_, i) => ({
      id: i,
      size: 300 + Math.random() * 400,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 20,
      animationDuration: 15 + Math.random() * 25,
      gradient: i % 3 === 0 ? 'bg-gradient-radial from-red-500/3 via-red-500/1 to-transparent' :
                i % 3 === 1 ? 'bg-gradient-radial from-green-500/3 via-green-500/1 to-transparent' :
                'bg-gradient-radial from-yellow-500/3 via-yellow-500/1 to-transparent'
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep space gradient background with more depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-indigo-950/40 to-purple-950/50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-950/20 to-violet-950/30" />
      
      {/* All animated particles */}
      <div className="absolute inset-0">
        {/* Galactic dust - finest particles */}
        <div className="absolute inset-0">
          {galacticDust.map((dust) => (
            <div
              key={dust.id}
              className={`absolute rounded-full animate-slow-drift ${dust.color}`}
              style={{
                width: `${dust.size}px`,
                height: `${dust.size}px`,
                left: `${dust.left}%`,
                top: `${dust.top}%`,
                animationDelay: `${dust.animationDelay}s`,
                animationDuration: `${dust.animationDuration}s`
              }}
            />
          ))}
        </div>

        {/* Distant stars layer - very small and subtle with gentle twinkling */}
        <div className="absolute inset-0">
          {distantStars.map((star) => (
            <div
              key={star.id}
              className={`absolute rounded-full animate-subtle-twinkle ${star.color}`}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`
              }}
            />
          ))}
        </div>
        
        {/* Medium stars with gentle twinkling */}
        <div className="absolute inset-0">
          {mediumStars.map((star) => (
            <div
              key={star.id}
              className={`absolute rounded-full animate-gentle-twinkle ${star.color}`}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
                boxShadow: `0 0 ${star.boxShadow}px currentColor`
              }}
            />
          ))}
        </div>
        
        {/* Bright prominent stars with soft twinkling and diffused glow */}
        <div className="absolute inset-0">
          {brightStars.map((star) => (
            <div
              key={star.id}
              className={`absolute rounded-full animate-soft-twinkle ${star.color}`}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
                boxShadow: `0 0 ${star.boxShadow1}px currentColor, 0 0 ${star.boxShadow2}px currentColor`
              }}
            />
          ))}
        </div>

        {/* Energy waves for cosmic atmosphere */}
        <div className="absolute inset-0">
          {energyWaves.map((wave) => (
            <div
              key={wave.id}
              className={`absolute rounded-full blur-3xl animate-pulse ${wave.gradient}`}
              style={{
                width: `${wave.size}px`,
                height: `${wave.size}px`,
                left: `${wave.left}%`,
                top: `${wave.top}%`,
                animationDelay: `${wave.animationDelay}s`,
                animationDuration: `${wave.animationDuration}s`
              }}
            />
          ))}
        </div>
        
        {/* Large nebula clouds */}
        <div className="absolute inset-0">
          {nebulaClouds.map((cloud) => (
            <div
              key={cloud.id}
              className={`absolute rounded-full blur-3xl animate-float ${cloud.gradient}`}
              style={{
                width: `${cloud.width}px`,
                height: `${cloud.height}px`,
                left: `${cloud.left}%`,
                top: `${cloud.top}%`,
                animationDelay: `${cloud.animationDelay}s`,
                animationDuration: `${cloud.animationDuration}s`
              }}
            />
          ))}
        </div>
        
        {/* Medium nebula formations */}
        <div className="absolute inset-0">
          {mediumNebula.map((nebula) => (
            <div
              key={nebula.id}
              className={`absolute rounded-full blur-2xl animate-float ${nebula.gradient}`}
              style={{
                width: `${nebula.width}px`,
                height: `${nebula.height}px`,
                left: `${nebula.left}%`,
                top: `${nebula.top}%`,
                animationDelay: `${nebula.animationDelay}s`,
                animationDuration: `${nebula.animationDuration}s`
              }}
            />
          ))}
        </div>
        
        {/* Small gas clouds */}
        <div className="absolute inset-0">
          {gasClouds.map((cloud) => (
            <div
              key={cloud.id}
              className={`absolute rounded-full blur-xl animate-float ${cloud.gradient}`}
              style={{
                width: `${cloud.width}px`,
                height: `${cloud.height}px`,
                left: `${cloud.left}%`,
                top: `${cloud.top}%`,
                animationDelay: `${cloud.animationDelay}s`,
                animationDuration: `${cloud.animationDuration}s`
              }}
            />
          ))}
        </div>
        
        {/* Cosmic dust streams */}
        <div className="absolute inset-0">
          {cosmicDust.map((dust) => (
            <div
              key={dust.id}
              className={`absolute blur-sm animate-float ${dust.gradient}`}
              style={{
                width: `${dust.width}px`,
                height: `${dust.height}px`,
                left: `${dust.left}%`,
                top: `${dust.top}%`,
                transform: `rotate(${dust.rotation}deg)`,
                animationDelay: `${dust.animationDelay}s`,
                animationDuration: `${dust.animationDuration}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Subtle cosmic grid pattern with depth */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px'
        }}
      />
      
      {/* Additional depth layer */}
      <div 
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
};

export default AnimatedBackground;