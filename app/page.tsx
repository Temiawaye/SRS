"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">


      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">AI-Powered Requirements Engineering</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-8 transition-colors">
                Turn Ideas into <span className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">High-Quality</span> Specifications
              </h1>

              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10 transition-colors">
                Generate professional <span className="font-bold text-slate-900 dark:text-white">Requirement Documents</span> in seconds. Built-in deterministic evaluation ensures your requirements are consistent, unambiguous, and testable.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-2 sm:px-0">
                <Link href={user ? "/Generate" : "/login"} className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:shadow-slate-900/20 hover:-translate-y-1 flex items-center justify-center gap-2 group">
                    <span>Get Started for Free</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href={user ? "/Evaluate" : "/login"} className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                    Evaluate Existing Projects
                  </button>
                </Link>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative max-w-5xl mx-auto animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent blur-[100px] -z-10 rounded-[40px]"></div>
              <div className="bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] p-2 shadow-2xl border border-white/50 dark:border-slate-800/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/50">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[18px] md:rounded-[26px] overflow-hidden border border-slate-100 dark:border-slate-800">
                  <Image
                    src={mounted && resolvedTheme === 'dark' ? '/hero_dark.png' : '/heroli.png'}
                    alt="PRD Studio Evaluation Preview"
                    width={1400}
                    height={800}
                    className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
                    priority
                  />
                </div>
              </div>

              {/* Floating Stat Components (Visual Interest) */}
              <div className="absolute -top-6 -right-6 hidden lg:block animate-bounce-subtle">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 dark:border-slate-700/50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 content-center flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Verifiability</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-white">98%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white dark:bg-slate-950 transition-colors border-t border-slate-100 dark:border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">How The Studio Works</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">A streamlined workflow to transform your ideas into engineering-ready documentation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connection lines for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent -translate-y-1/2 -z-10"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold mb-6 ring-8 ring-white dark:ring-slate-950">1</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Input Your Vision</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Provide a high-level overview of your application, target audience, and key features. No technical jargon required.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-2xl font-bold mb-6 ring-8 ring-white dark:ring-slate-950">2</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">AI Generation</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Our advanced language models instantly draft a comprehensive, structured Software Requirements Specification (SRS) or Product Requirements Document (PRD).</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold mb-6 ring-8 ring-white dark:ring-slate-950">3</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Evaluate & Refine</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Every requirement is rigorously evaluated against our 4-metric system, highlighting ambiguities and missing edge cases.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Metrics Section */}
        <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
              <div className="w-full lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Strict Quality Control</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                  Deterministic Evaluation Metrics
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Unlike standard AI tools that produce generic text, PRD Studio enforces rigorous engineering standards. We evaluate every single requirement against four objective metrics to guarantee development-ready specifications.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 sm:mb-4 text-blue-600 dark:text-blue-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">Ambiguity</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Detects vague terms and enforces precise, measurable definitions.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3 sm:mb-4 text-purple-600 dark:text-purple-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">Atomicity</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Ensures each requirement describes exactly one feature or constraint.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3 sm:mb-4 text-emerald-600 dark:text-emerald-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">Completeness</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Identifies missing prerequisites and overlooked architectural dependencies.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-3 sm:mb-4 text-orange-600 dark:text-orange-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">Verifiability</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Confirms that QA teams can write deterministic test cases easily.</p>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2 relative mt-4 lg:mt-0">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 blur-[80px] -z-10 rounded-full"></div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                   {/* Abstract visualization of the metrics */}
                   <div className="space-y-5 sm:space-y-6">
                      {[
                        { name: 'Ambiguity', score: 98, color: 'bg-blue-500' },
                        { name: 'Atomicity', score: 95, color: 'bg-purple-500' },
                        { name: 'Completeness', score: 92, color: 'bg-emerald-500' },
                        { name: 'Verifiability', score: 96, color: 'bg-orange-500' },
                      ].map((metric) => (
                        <div key={metric.name}>
                          <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm sm:text-base">{metric.name} Score</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{metric.score}%</span>
                          </div>
                          <div className="h-2 sm:h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${metric.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${metric.score}%` }}></div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-emerald-500/10 blur-[120px] rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            
            <div className="inline-flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Engineering Precision</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 tracking-tight leading-tight px-2">
              Ready to stop shipping <br className="hidden sm:block" />
              <span className="text-slate-500 line-through decoration-red-500/50">ambiguous</span> requirements?
            </h2>
            
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Built for engineering teams who value technical accuracy over vague descriptions. Generate deterministic, testable specifications in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full px-2 sm:px-0">
               <Link href={user ? "/Generate" : "/login"} className="w-full sm:w-auto">
                  <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1 flex items-center justify-center gap-3 w-full sm:w-auto text-lg group">
                    <span>Start Generating</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href={user ? "/Evaluate" : "/login"} className="w-full sm:w-auto">
                  <button className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-500 text-white font-bold rounded-2xl transition-all backdrop-blur-sm flex items-center justify-center gap-3 w-full sm:w-auto text-lg hover:-translate-y-1">
                    Try the Evaluator
                  </button>
                </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm font-medium">© 2026 PRD Studio. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <span className="text-slate-400 text-sm hover:text-slate-600 cursor-not-allowed transition-colors">Privacy Policy</span>
            <span className="text-slate-400 text-sm hover:text-slate-600 cursor-not-allowed transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
