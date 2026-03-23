"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">


      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">AI-Powered Requirements Engineering</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
                Turn Ideas into <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">High-Quality</span> Specifications
              </h1>

              <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
                Generate professional SRS documents in seconds. Built-in deterministic evaluation ensures your requirements are consistent, unambiguous, and testable.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/Generate">
                  <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-1 flex items-center justify-center gap-2 group">
                    <span>Get Started for Free</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href="/Evaluate">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:border-slate-300 transition-all hover:bg-slate-50 flex items-center justify-center gap-2">
                    Evaluate Existing Projects
                  </button>
                </Link>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative max-w-5xl mx-auto animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent blur-[100px] -z-10 rounded-[40px]"></div>
              <div className="bg-white rounded-[24px] md:rounded-[32px] p-2 shadow-2xl border border-white/50 backdrop-blur-sm overflow-hidden ring-1 ring-slate-200/50">
                <div className="bg-slate-50 rounded-[18px] md:rounded-[26px] overflow-hidden border border-slate-100">
                  <Image
                    src="/hero_preview.png"
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
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 content-center flex items-center justify-center text-emerald-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verifiability</p>
                    <p className="text-xl font-extrabold text-slate-800">98%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col gap-4 p-8 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all hover:shadow-xl group">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Instant Generation</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Convert rough ideas into structured, professional SRS documents using Llama 3.3 in seconds.</p>
              </div>

              <div className="flex flex-col gap-4 p-8 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all hover:shadow-xl group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Deterministic Evaluation</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Our 4-metric system strictly measures Ambiguity, Atomicity, Completeness, and Verifiability.</p>
              </div>

              <div className="flex flex-col gap-4 p-8 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all hover:shadow-xl group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Engineering Precision</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Built for engineering teams who value technical accuracy over vague descriptions.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-200 bg-white">
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
