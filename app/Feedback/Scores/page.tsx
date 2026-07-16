"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/utils/supabaseClient";
import { useAuth } from "@/app/components/AuthProvider";

// ─── Score badge helper ───────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
    let colorClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50";
    if (score >= 80) {
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50";
    } else if (score >= 50) {
        colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50";
    }

    return (
        <span className={`inline-flex items-center justify-center font-semibold text-xs px-2.5 py-1 rounded-lg border ${colorClass}`}>
            {score}%
        </span>
    );
}

export default function ScoresPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [metrics, setMetrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = user && (user.email?.toLowerCase().includes("admin") || user.user_metadata?.is_admin === true);

    useEffect(() => {
        if (!isAdmin) return;
        const fetchMetrics = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("evaluation_metrics")
                .select(`
                    id,
                    completeness_score,
                    consistency_score,
                    unambiguity_score,
                    traceability_score,
                    created_at,
                    srs_documents (
                        id,
                        projects (
                            title,
                            user_id
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching metrics:", error);
                setError(error.message);
            } else {
                setMetrics(data || []);
            }
            setIsLoading(false);
        };

        fetchMetrics();
    }, [isAdmin]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 text-center shadow-xl shadow-slate-100 dark:shadow-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mt-16 -mr-16 pointer-events-none"></div>
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 flex items-center justify-center rounded-2xl mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Access Denied</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                        This dashboard is restricted to administrator accounts only. If you believe this is an error, please contact your administrator.
                    </p>
                    <Link href="/">
                        <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all shadow-sm">
                            Return Home
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/Feedback">
                                <button className="flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm text-slate-500 dark:text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </Link>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Feedback Dashboard
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                            Document Evaluation Scores
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Historical evaluation metrics generated by all users.
                        </p>
                    </div>
                    <div className="shrink-0 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                        {metrics.length} documents
                    </div>
                </div>

                {/* Table Container */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                            <p className="text-red-600 dark:text-red-400 font-semibold">Error loading evaluation scores</p>
                            <p className="text-red-500/80 text-sm mt-1">{error}</p>
                        </div>
                    ) : metrics.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
                            <div className="text-4xl mb-4">📊</div>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No document scores yet</p>
                            <p className="text-slate-400 text-sm mt-1">Evaluated document metrics will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800">Document</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-center border border-slate-200 dark:border-slate-800">Completeness</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-center border border-slate-200 dark:border-slate-800">Consistency</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-center border border-slate-200 dark:border-slate-800">Ambiguity</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-center border border-slate-200 dark:border-slate-800">Traceability</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-center border border-slate-200 dark:border-slate-800">Overall Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {metrics.map((metric) => {
                                            const srsDoc = metric.srs_documents;
                                            const project = Array.isArray(srsDoc) 
                                                ? srsDoc[0]?.projects 
                                                : srsDoc?.projects;
                                            const docTitle = (Array.isArray(project) ? project[0]?.title : project?.title) || "Untitled Document";
                                            
                                            const comp = Math.round(metric.completeness_score || 0);
                                            const cons = Math.round(metric.consistency_score || 0);
                                            const amb = Math.round(metric.unambiguity_score || 0);
                                            const trac = Math.round(metric.traceability_score || 0);
                                            const overallScore = Math.round((comp + cons + amb + trac) / 4);

                                            return (
                                                <tr key={metric.id} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="p-4 align-middle border border-slate-200 dark:border-slate-800">
                                                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                                            {docTitle}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {new Date(metric.created_at).toLocaleDateString("en-GB", {
                                                                day: "numeric", month: "short", year: "numeric",
                                                                hour: "2-digit", minute: "2-digit"
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center align-middle border border-slate-200 dark:border-slate-800">
                                                        <ScoreBadge score={comp} />
                                                    </td>
                                                    <td className="p-4 text-center align-middle border border-slate-200 dark:border-slate-800">
                                                        <ScoreBadge score={cons} />
                                                    </td>
                                                    <td className="p-4 text-center align-middle border border-slate-200 dark:border-slate-800">
                                                        <ScoreBadge score={amb} />
                                                    </td>
                                                    <td className="p-4 text-center align-middle border border-slate-200 dark:border-slate-800">
                                                        <ScoreBadge score={trac} />
                                                    </td>
                                                    <td className="p-4 text-center align-middle border border-slate-200 dark:border-slate-800">
                                                        <span className="inline-flex items-center justify-center font-bold text-xs px-3 py-1.5 rounded-lg border bg-slate-900 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-slate-200 shadow-sm">
                                                            {overallScore}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
