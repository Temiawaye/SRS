"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/utils/supabaseClient";
import { useAuth } from "@/app/components/AuthProvider";

// ─── Score badge helper ───────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
    return (
        <span className="inline-flex items-center justify-center font-semibold text-xs px-2.5 py-1 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {score}%
        </span>
    );
}

// ─── Bar chart for average metrics ───────────────────────────────────────────
type MetricAverages = {
    completeness: number;
    consistency: number;
    ambiguity: number;
    traceability: number;
    overall: number;
};

function getScoreColor(_score: number) {
    // Monochrome — same style regardless of score
    return { bar: "#1e293b", text: "#1e293b", bg: "#f8fafc", border: "#e2e8f0" };
}

function MetricsChart({ averages, count }: { averages: MetricAverages; count: number }) {
    const metrics = [
        { label: "Completeness", value: averages.completeness, icon: "M5 13l4 4L19 7" },
        { label: "Consistency", value: averages.consistency, icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" },
        { label: "Ambiguity", value: averages.ambiguity, icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
        { label: "Traceability", value: averages.traceability, icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
    ];

    const chartHeight = 180;
    const barWidth = 52;
    const barGap = 32;
    const totalWidth = metrics.length * (barWidth + barGap) - barGap;
    const padding = { top: 16, bottom: 48, left: 24, right: 24 };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">Average Scores Across All Documents</h2>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium pl-10">Aggregated from {count} evaluated document{count !== 1 ? "s" : ""}</p>
                </div>
                {/* Overall score pill */}
                <div className="flex flex-col items-center shrink-0 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 px-6 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Avg Overall</span>
                    <span
                        className="text-3xl font-extrabold tracking-tighter"
                        style={{ color: getScoreColor(averages.overall).bar }}
                    >
                        {averages.overall}
                        <span className="text-base font-bold text-slate-400 dark:text-slate-500 ml-0.5">%</span>
                    </span>
                </div>
            </div>

            {/* Chart area */}
            <div className="px-6 pt-6 pb-4">
                {/* SVG bar chart */}
                <div className="flex items-end justify-center gap-0 overflow-x-auto pb-2">
                    <svg
                        viewBox={`0 0 ${totalWidth + padding.left + padding.right} ${chartHeight + padding.top + padding.bottom}`}
                        className="w-full max-w-xl mx-auto"
                        style={{ minWidth: 280 }}
                        aria-label="Average metric scores bar chart"
                    >
                        {/* Horizontal guide lines */}
                        {[0, 25, 50, 75, 100].map((tick) => {
                            const y = padding.top + chartHeight - (tick / 100) * chartHeight;
                            return (
                                <g key={tick}>
                                    <line
                                        x1={padding.left}
                                        x2={totalWidth + padding.left}
                                        y1={y}
                                        y2={y}
                                        stroke="currentColor"
                                        strokeOpacity={0.08}
                                        strokeWidth={1}
                                        className="text-slate-900 dark:text-slate-100"
                                    />
                                    <text
                                        x={padding.left - 6}
                                        y={y + 4}
                                        textAnchor="end"
                                        fontSize={9}
                                        fill="currentColor"
                                        className="text-slate-400"
                                        opacity={0.5}
                                    >
                                        {tick}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Bars */}
                        {metrics.map((metric, i) => {
                            const x = padding.left + i * (barWidth + barGap);
                            const barH = Math.max(4, (metric.value / 100) * chartHeight);
                            const y = padding.top + chartHeight - barH;
                            const colors = getScoreColor(metric.value);
                            const labelY = padding.top + chartHeight + 16;

                            return (
                                <g key={metric.label}>
                                    {/* Bar background (track) */}
                                    <rect
                                        x={x}
                                        y={padding.top}
                                        width={barWidth}
                                        height={chartHeight}
                                        rx={8}
                                        fill="currentColor"
                                        className="text-slate-100 dark:text-slate-800"
                                    />
                                    {/* Filled bar */}
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barH}
                                        rx={barH < chartHeight ? 8 : 8}
                                        fill={colors.bar}
                                        opacity={0.9}
                                    />
                                    {/* Value label on top of bar */}
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 6}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight={700}
                                        fill={colors.bar}
                                    >
                                        {metric.value}%
                                    </text>
                                    {/* Metric label below */}
                                    <text
                                        x={x + barWidth / 2}
                                        y={labelY}
                                        textAnchor="middle"
                                        fontSize={9.5}
                                        fontWeight={600}
                                        fill="currentColor"
                                        className="text-slate-500"
                                        opacity={0.7}
                                    >
                                        {metric.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Metric stat cards row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {metrics.map((metric) => {
                        const colors = getScoreColor(metric.value);
                        return (
                            <div
                                key={metric.label}
                                className="rounded-xl p-3.5 border flex flex-col gap-1"
                                style={{
                                    background: `color-mix(in srgb, ${colors.bg} 60%, transparent)`,
                                    borderColor: colors.border,
                                }}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.bar, opacity: 0.8 }}>
                                    {metric.label}
                                </span>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-extrabold tracking-tighter" style={{ color: colors.bar }}>
                                        {metric.value}
                                    </span>
                                    <span className="text-xs font-semibold mb-0.5" style={{ color: colors.bar, opacity: 0.7 }}>
                                        / 100
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full mt-1" style={{ background: `${colors.bar}22` }}>
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-700"
                                        style={{ width: `${metric.value}%`, background: colors.bar }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
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

    // Compute averages from loaded metrics
    const computedAverages: MetricAverages | null = metrics.length > 0
        ? (() => {
            const n = metrics.length;
            const comp = Math.round(metrics.reduce((s, m) => s + (m.completeness_score || 0), 0) / n);
            const cons = Math.round(metrics.reduce((s, m) => s + (m.consistency_score || 0), 0) / n);
            const amb = Math.round(metrics.reduce((s, m) => s + (m.unambiguity_score || 0), 0) / n);
            const trac = Math.round(metrics.reduce((s, m) => s + (m.traceability_score || 0), 0) / n);
            return {
                completeness: comp,
                consistency: cons,
                ambiguity: amb,
                traceability: trac,
                overall: Math.round((comp + cons + amb + trac) / 4),
            };
        })()
        : null;

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

                {/* ── Analytics Chart (shown first, only when data is available) ── */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 font-semibold">Error loading evaluation scores</p>
                        <p className="text-red-500/80 text-sm mt-1">{error}</p>
                    </div>
                ) : computedAverages ? (
                    <>
                        <MetricsChart averages={computedAverages} count={metrics.length} />

                        {/* ── Individual Document Scores Table ── */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Individual Document Scores</h2>
                            </div>
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
                        </div>
                    </>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
                        <div className="text-4xl mb-4">📊</div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No document scores yet</p>
                        <p className="text-slate-400 text-sm mt-1">Evaluated document metrics will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
