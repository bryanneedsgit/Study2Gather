"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"

export default function LoginPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  // Generate particles once on mount
  const particles = useMemo(() => 
    [...Array(15)].map((_, i) => ({
      id: i,
      width: 2 + (i % 3),
      left: (i * 6.5) % 100,
      top: (i * 8) % 100,
      color: ['#4ade80', '#22d3ee', '#fbbf24', '#a78bfa', '#f472b6'][i % 5],
      delay: (i * 0.3) % 5,
      duration: 4 + (i % 3),
    })), []
  )

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0f1a]">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/25 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[15%] right-[20%] w-[350px] h-[350px] bg-gradient-to-br from-emerald-500/15 to-teal-600/15 rounded-full blur-[100px] animate-orb-1" />
        <div className="absolute bottom-[25%] left-[15%] w-[300px] h-[300px] bg-gradient-to-br from-amber-400/15 to-orange-500/15 rounded-full blur-[80px] animate-orb-2" />
        <div className="absolute top-[40%] right-[40%] w-[250px] h-[250px] bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-[70px] animate-orb-3" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

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
        className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div 
          className={`w-full max-w-md transition-all duration-700 delay-100 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Logo and brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {/* Pulsing glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-full blur-xl opacity-25 animate-glow-pulse" />
              
              {/* Logo SVG */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-2xl">
                  <defs>
                    <linearGradient id="loginCommunityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="50%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="loginFocusGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                    <filter id="loginGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <radialGradient id="loginInnerBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1a2332" />
                      <stop offset="100%" stopColor="#0f1623" />
                    </radialGradient>
                  </defs>
                  
                  <circle cx="70" cy="70" r="65" fill="url(#loginInnerBg)" stroke="url(#loginCommunityGrad)" strokeWidth="2.5" opacity="0.9" />
                  
                  {/* Three connected people */}
                  <circle cx="40" cy="50" r="10" fill="#4ade80" filter="url(#loginGlow)" />
                  <ellipse cx="40" cy="72" rx="8" ry="12" fill="#4ade80" opacity="0.8" />
                  
                  <circle cx="70" cy="42" r="12" fill="#22d3ee" filter="url(#loginGlow)" />
                  <ellipse cx="70" cy="68" rx="10" ry="14" fill="#22d3ee" opacity="0.8" />
                  
                  <circle cx="100" cy="50" r="10" fill="#fbbf24" filter="url(#loginGlow)" />
                  <ellipse cx="100" cy="72" rx="8" ry="12" fill="#fbbf24" opacity="0.8" />
                  
                  {/* Connection lines */}
                  <path d="M48 55 Q59 48 62 52" stroke="url(#loginCommunityGrad)" strokeWidth="2.5" fill="none" opacity="0.7" />
                  <path d="M78 52 Q81 48 92 55" stroke="url(#loginCommunityGrad)" strokeWidth="2.5" fill="none" opacity="0.7" />
                  <path d="M50 68 Q70 60 90 68" stroke="url(#loginCommunityGrad)" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="4 3" />
                  
                  {/* Focus arc */}
                  <path
                    d="M30 100 Q70 115 110 100"
                    stroke="url(#loginFocusGrad)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    filter="url(#loginGlow)"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
                Study2Gather
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-1">Beat burnout. Study together.</p>
          </div>

          {/* Login card */}
          <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-2xl shadow-emerald-500/5">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-white">Welcome Back</CardTitle>
              <CardDescription className="text-white/50">
                Ready to lock in with your squad?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field>
                <FieldLabel htmlFor="email" className="text-white/70 text-sm">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@school.edu"
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-emerald-400/20 transition-all duration-300"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="text-white/70 text-sm">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-emerald-400/20 transition-all duration-300"
                />
              </Field>
              <div className="flex items-center justify-end">
                <a href="#" className="text-sm text-cyan-400/80 hover:text-cyan-300 transition-colors duration-300">
                  Forgot password?
                </a>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-500 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Lock In
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
              
              {/* Divider */}
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="text-white/40 text-xs uppercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Social login */}
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02]">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02]">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  School Email
                </Button>
              </div>

              <p className="text-sm text-white/40 text-center mt-2">
                {"New here? "}
                <a href="#" className="text-emerald-400/80 hover:text-emerald-300 transition-colors duration-300 font-medium">
                  Join the squad
                </a>
              </p>
            </CardFooter>
          </Card>

          {/* Features preview */}
          <div className="flex justify-center gap-6 mt-6">
            {[
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Focus Sessions", color: "#4ade80" },
              { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", label: "Study Groups", color: "#22d3ee" },
              { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Rewards", color: "#fbbf24" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110"
                  style={{ background: `${item.color}15` }}
                >
                  <svg className="w-5 h-5" fill="none" stroke={item.color} viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/40">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-white/25 text-xs mt-6">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>

      {/* Decorative corners */}
      <svg className="absolute top-5 left-5 w-14 h-14 text-emerald-500/20" viewBox="0 0 80 80">
        <path d="M0 40 L0 10 Q0 0 10 0 L40 0" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute top-5 right-5 w-14 h-14 text-cyan-500/20" viewBox="0 0 80 80">
        <path d="M40 0 L70 0 Q80 0 80 10 L80 40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute bottom-5 left-5 w-14 h-14 text-amber-500/20" viewBox="0 0 80 80">
        <path d="M0 40 L0 70 Q0 80 10 80 L40 80" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="absolute bottom-5 right-5 w-14 h-14 text-violet-500/20" viewBox="0 0 80 80">
        <path d="M40 80 L70 80 Q80 80 80 70 L80 40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </main>
  )
}
