"use client";
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let error;
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                error = signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({ email, password });
                error = signUpError;
                if (!error) {
                    setIsLogin(true);
                    setError("Account created successfully. You can now sign in.");
                    setIsLoading(false);
                    return;
                }
            }

            if (error) {
                setError(error.message);
            } else {
                router.push("/Generate");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-slate-50 text-slate-800 font-sans items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Welcome to PRD Studio</h1>
                <p className="text-slate-500 text-sm mb-8 text-center">Sign in to orchestrate AI agents and manage your Software Requirements Specifications.</p>

                {error && (
                    <div className={`w-full p-3 mb-6 rounded-xl text-sm font-medium ${error.includes('successfully') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {error}
                    </div>
                )}

                <form className="w-full flex flex-col gap-4" onSubmit={handleAuth}>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            placeholder="you@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl px-4 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? 'Processing...' : (isLogin ? 'Sign In required' : 'Create Account')}
                    </button>
                </form>

                <p className="mt-8 text-sm text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="ml-1.5 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        {isLogin ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </div>
        </main>
    );
}
