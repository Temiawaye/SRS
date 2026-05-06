"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";

interface Feedback {
    id: string;
    rating: number;
    issues: boolean;
    comment: string;
    role: string;
    experience_level: string;
    created_at: string;
}

// ─── Mini bar chart (rating distribution) ───────────────────────────────────
function RatingBarChart({ feedbacks }: { feedbacks: Feedback[] }) {
    const counts = [1, 2, 3, 4, 5].map((star) => ({
        star,
        count: feedbacks.filter((f) => f.rating === star).length,
    }));
    const max = Math.max(...counts.map((c) => c.count), 1);
    const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981"];

    return (
        <div className="space-y-2">
            {counts.reverse().map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-4">{star}★</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${(count / max) * 100}%`,
                                backgroundColor: colors[star - 1],
                            }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-5 text-right">{count}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Donut chart (role breakdown) ────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    let cumulative = 0;
    const radius = 40;
    const cx = 60;
    const cy = 60;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="flex items-center gap-6">
            <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
                {data.map((segment, i) => {
                    const pct = segment.count / total;
                    const strokeDash = circumference * pct;
                    const offset = circumference - circumference * cumulative;
                    cumulative += pct;
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="18"
                            strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 60 60)"
                            className="transition-all duration-700"
                        />
                    );
                })}
                <text x="60" y="64" textAnchor="middle" className="fill-slate-700 dark:fill-white" fontSize="18" fontWeight="bold">
                    {total}
                </text>
            </svg>
            <div className="space-y-2">
                {data.map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{d.label}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto pl-4">{d.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Horizontal bar chart (experience breakdown) ─────────────────────────────
function ExperienceChart({ feedbacks }: { feedbacks: Feedback[] }) {
    const levels = ["< 1 year", "1-3 years", "3-5 years", "5+ years"];
    const counts = levels.map((l) => ({
        label: l,
        count: feedbacks.filter((f) => f.experience_level === l).length,
    }));
    const max = Math.max(...counts.map((c) => c.count), 1);

    return (
        <div className="space-y-3">
            {counts.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-16 shrink-0">{label}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                            style={{ width: `${(count / max) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-5 text-right">{count}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-4 h-4 ${rating >= star ? "text-emerald-500" : "text-slate-200 dark:text-slate-700"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ─── Role badge colours ───────────────────────────────────────────────────────
const roleMeta: Record<string, { bg: string; text: string }> = {
    Developer: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    "Project Manager": { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-600 dark:text-violet-400" },
    Other: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("feedbacks")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) setError(error.message);
            else setFeedbacks(data || []);
            setIsLoading(false);
        };
        fetchFeedbacks();
    }, []);

    const avgRating = feedbacks.length
        ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
        : "—";
    const issueCount = feedbacks.filter((f) => f.issues).length;
    const satisfiedPct = feedbacks.length
        ? Math.round((feedbacks.filter((f) => f.rating >= 4).length / feedbacks.length) * 100)
        : 0;

    const roleData = [
        { label: "Developer", count: feedbacks.filter((f) => f.role === "Developer").length, color: "#3b82f6" },
        { label: "Project Manager", count: feedbacks.filter((f) => f.role === "Project Manager").length, color: "#8b5cf6" },
        { label: "Other", count: feedbacks.filter((f) => f.role === "Other").length, color: "#94a3b8" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                            Feedback Dashboard
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            All user feedback submissions from PRD Studio.
                        </p>
                    </div>
                    <div className="shrink-0 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                        {feedbacks.length} total
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Responses", value: feedbacks.length, color: "text-slate-900 dark:text-white" },
                        { label: "Avg Rating", value: `${avgRating} ⭐`, color: "text-emerald-500" },
                        { label: "Reported Issues", value: issueCount, color: "text-red-500" },
                        { label: "Satisfied (4–5★)", value: `${satisfiedPct}%`, color: "text-teal-500" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 text-center shadow-sm">
                            <div className={`text-3xl font-bold ${color}`}>{value}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                {feedbacks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Rating distribution */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm md:col-span-1">
                            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Rating Distribution</h2>
                            <RatingBarChart feedbacks={feedbacks} />
                        </div>

                        {/* Role breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Role Breakdown</h2>
                            <DonutChart data={roleData} />
                        </div>

                        {/* Experience breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Years of Experience</h2>
                            <ExperienceChart feedbacks={feedbacks} />
                        </div>
                    </div>
                )}

                {/* Feedback list */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 font-semibold">Error loading feedbacks</p>
                        <p className="text-red-500/80 text-sm mt-1">{error}</p>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No feedback yet</p>
                        <p className="text-slate-400 text-sm mt-1">Feedback submitted by users will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
                            All Submissions
                        </h2>
                        {feedbacks.map((feedback) => {
                            const role = feedback.role || "Other";
                            const rm = roleMeta[role] ?? roleMeta["Other"];
                            return (
                                <div
                                    key={feedback.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Top row */}
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <Stars rating={feedback.rating} />

                                        {/* Role badge */}
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rm.bg} ${rm.text}`}>
                                            {role}
                                        </span>

                                        {/* Experience badge */}
                                        {feedback.experience_level && (
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                                                {feedback.experience_level}
                                            </span>
                                        )}

                                        {/* Issues badge */}
                                        {feedback.issues && (
                                            <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full">
                                                ⚠ Issues
                                            </span>
                                        )}

                                        {/* Date — pushed right */}
                                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                                            {new Date(feedback.created_at).toLocaleDateString("en-GB", {
                                                day: "numeric", month: "short", year: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </span>
                                    </div>

                                    {/* Comment */}
                                    {feedback.comment ? (
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-3 mt-1">
                                            &ldquo;{feedback.comment}&rdquo;
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic border-t border-slate-50 dark:border-slate-800 pt-3 mt-1">
                                            No comment provided.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
