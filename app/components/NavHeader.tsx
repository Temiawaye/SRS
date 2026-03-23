"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function NavHeader() {
    const { user, signOut, isLoading } = useAuth();

    return (
        <nav className="flex w-full justify-between items-center px-4 md:px-8 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                        PRD Studio
                    </p>
                </Link>
            </div>
            <div>
                {!isLoading && user ? (
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-800">{user.email}</span>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                ) : !isLoading ? (
                    <Link href="/login">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                            Sign In
                        </button>
                    </Link>
                ) : (
                    <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-lg"></div>
                )}
            </div>
        </nav>
    );
}
