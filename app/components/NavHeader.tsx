"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

export default function NavHeader() {
    const { user, signOut, isLoading } = useAuth();

    return (
        <nav className="flex w-full justify-between items-center px-4 md:px-8 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-all">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                        SRS Studio
                    </p>
                </Link>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
                {/* <ThemeToggle /> */}
                {!isLoading && user ? (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px] md:max-w-[200px]">
                                {user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </span>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                ) : !isLoading ? (
                    <Link href="/login">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
                            Sign In
                        </button>
                    </Link>
                ) : (
                    <div className="w-24 h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                )}
            </div>
        </nav>
    );
}
