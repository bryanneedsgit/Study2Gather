"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"

export default function SplashScreen() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(0)

  // Generate particles once on mount
  const particles = useMemo(() => 
    [...Array(25)].map((_, i) => ({
      id: i,
      width: 2 + (i % 4),
      left: (i * 4) % 100,
      top: (i * 7) % 100,
      color: ['#4ade80', '#22d3ee', '#fbbf24', '#a78bfa', '#f472b6'][i % 5],
      delay: (i * 0.2) % 5,
      duration: 4 + (i % 3),
    })), []
  )

  useEffect(() => {
    const loadTimer = setTimeout(() => setIsLoaded(true), 100)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 40)

    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 2400)

    const redirectTimer = setTimeout(() => {
      router.push("/login")
    }, 3000)

    return () => {
      clearTimeout(loadTimer)
      clearTimeout(exitTimer)
      clearTimeout(redirectTimer)
      clearInterval(progressInterval)
    }
  }, [router])

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0f1a]">
      {/* Deep gradient background - warm study night vibes */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/25 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      </div>

      {/* Floating focus orbs - representing concentration zones */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[15%] w-[450px] h-[450px] bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-[100px] animate-orb-2" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-br from-cyan-400/15 to-blue-500/15 rounded-full blur-[80px] animate-orb-3" />
      </div>

      {/* Subtle grid pattern - study desk aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-particle"
            style={{
              width: `${particle.width}px`,
              height: `${particle.width}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: particle.color,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div 
        className={`relative z-10 min-h-screen flex flex-col items-center justify-center transition-all duration-700 ease-out ${
          isExiting ? 'scale-105 opacity-0 blur-md' : ''
        }`}
      >
        <div 
          className={`flex flex-col items-center gap-8 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
          }`}
        >
          {/* Logo container */}
          <div className="relative">
            {/* Outer ring - represents the "lock-in" focus mode */}
            <div className="absolute -inset-10 rounded-full">
              <svg className="w-full h-full animate-spin-ring" viewBox="0 0 220 220">
                <defs>
                  <linearGradient id="focusRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
                <circle
                  cx="110"
                  cy="110"
                  r="105"
                  fill="none"
                  stroke="url(#focusRing)"
                  strokeWidth="2"
                  strokeDasharray="200 80"
                  className="opacity-50"
                />
              </svg>
            </div>

            {/* Inner pulsing glow */}
            <div className="absolute -inset-6 bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-full blur-2xl opacity-30 animate-glow-pulse" />
            
            {/* Main Logo SVG */}
            <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center animate-logo-float">
              <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-2xl">
                <defs>
                  {/* Community gradient - warm and inviting */}
                  <linearGradient id="communityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                  {/* Focus gradient */}
                  <linearGradient id="focusGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                  {/* Glow effect */}
                  <filter id="softGlow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  {/* Inner shadow */}
                  <radialGradient id="innerBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1a2332" />
                    <stop offset="100%" stopColor="#0f1623" />
                  </radialGradient>
                </defs>
                
                {/* Background circle with subtle border */}
                <circle cx="70" cy="70" r="65" fill="url(#innerBg)" stroke="url(#communityGrad)" strokeWidth="2.5" opacity="0.9" />
                
                {/* Three connected people - representing gathering */}
                {/* Person 1 - Left */}
                <circle cx="40" cy="50" r="10" fill="#4ade80" filter="url(#softGlow)" />
                <ellipse cx="40" cy="72" rx="8" ry="12" fill="#4ade80" opacity="0.8" />
                
                {/* Person 2 - Center (slightly larger - host) */}
                <circle cx="70" cy="42" r="12" fill="#22d3ee" filter="url(#softGlow)" />
                <ellipse cx="70" cy="68" rx="10" ry="14" fill="#22d3ee" opacity="0.8" />
                
                {/* Person 3 - Right */}
                <circle cx="100" cy="50" r="10" fill="#fbbf24" filter="url(#softGlow)" />
                <ellipse cx="100" cy="72" rx="8" ry="12" fill="#fbbf24" opacity="0.8" />
                
                {/* Connection lines - representing "gather" */}
                <path d="M48 55 Q59 48 62 52" stroke="url(#communityGrad)" strokeWidth="2.5" fill="none" opacity="0.7" />
                <path d="M78 52 Q81 48 92 55" stroke="url(#communityGrad)" strokeWidth="2.5" fill="none" opacity="0.7" />
                <path d="M50 68 Q70 60 90 68" stroke="url(#communityGrad)" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="4 3" />
                
                {/* Focus timer arc at bottom - represents "lock-in" */}
                <path
                  d="M30 100 Q70 115 110 100"
                  stroke="url(#focusGrad)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                />
                
                {/* Small sparkles representing rewards/achievements */}
                <circle cx="25" cy="35" r="3" fill="#fbbf24" opacity="0.8" className="animate-pulse" />
                <circle cx="115" cy="35" r="3" fill="#f472b6" opacity="0.8" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                <circle cx="70" cy="108" r="2.5" fill="#a78bfa" opacity="0.8" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              </svg>
            </div>
          </div>

          {/* Brand name */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                Study2Gather
              </span>
            </h1>
            
            {/* Tagline - focus, connect, reward */}
            <div className="flex items-center justify-center gap-3 text-lg md:text-xl font-semibold">
              <span 
                className="text-emerald-400 transition-all duration-500"
                style={{ 
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transitionDelay: '0.4s'
                }}
              >
                focus
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span 
                className="text-cyan-400 transition-all duration-500"
                style={{ 
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transitionDelay: '0.6s'
                }}
              >
                connect
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span 
                className="text-amber-400 transition-all duration-500"
                style={{ 
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transitionDelay: '0.8s'
                }}
              >
                reward
              </span>
            </div>

            {/* Sub tagline */}
            <p 
              className="text-white/40 text-sm transition-all duration-500"
              style={{ 
                opacity: isLoaded ? 1 : 0,
                transitionDelay: '1s'
              }}
            >
              Beat burnout. Study together.
            </p>
          </div>

          {/* Progress section */}
          <div 
            className="w-72 space-y-4 transition-all duration-500"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transitionDelay: '1.2s'
            }}
          >
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Animated icons representing features */}
            <div className="flex justify-center gap-4">
              {[
                { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "#4ade80", label: "Focus" },
                { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "#22d3ee", label: "Connect" },
                { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "#fbbf24", label: "Rewards" },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex flex-col items-center gap-1 animate-bounce-stagger"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ 
                      background: `${item.color}20`,
                      boxShadow: `0 0 15px ${item.color}30`
                    }}
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke={item.color} 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-[10px] text-white/40">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative corners */}
      <svg className="absolute top-5 left-5 w-16 h-16 text-emerald-500/20" viewBox="0 0 80 80">
        <path d="M0 40 L0 10 Q0 0 10 0 L40 0" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute top-5 right-5 w-16 h-16 text-cyan-500/20" viewBox="0 0 80 80">
        <path d="M40 0 L70 0 Q80 0 80 10 L80 40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute bottom-5 left-5 w-16 h-16 text-amber-500/20" viewBox="0 0 80 80">
        <path d="M0 40 L0 70 Q0 80 10 80 L40 80" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute bottom-5 right-5 w-16 h-16 text-violet-500/20" viewBox="0 0 80 80">
        <path d="M40 80 L70 80 Q80 80 80 70 L80 40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </main>
  )
}
