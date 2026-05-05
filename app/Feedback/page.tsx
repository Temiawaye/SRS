"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";

interface Feedback {
    id: string;
    rating: number;
    issues: boolean;
    comment: string;
    created_at: string;
}

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

            if (error) {
                setError(error.message);
            } else {
                setFeedbacks(data || []);
            }
            setIsLoading(false);
        };

        fetchFeedbacks();
    }, []);

    const avgRating = feedbacks.length
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : "—";

    const issueCount = feedbacks.filter((f) => f.issues).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                        Feedback Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        All user feedback submissions from SRS Studio.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{feedbacks.length}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Total Responses</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-emerald-500">{avgRating} ⭐</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Average Rating</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-red-500">{issueCount}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Reported Issues</div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 font-semibold">Error loading feedbacks</p>
                        <p className="text-red-500/80 text-sm mt-1">{error}</p>
                        <p className="text-slate-500 text-sm mt-3">Make sure the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">feedbacks</code> table exists in Supabase.</p>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No feedback yet</p>
                        <p className="text-slate-400 text-sm mt-1">Feedback submitted by users will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((feedback) => (
                            <div
                                key={feedback.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                className={`w-5 h-5 ${feedback.rating >= star ? "text-emerald-500" : "text-slate-200 dark:text-slate-700"}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {feedback.issues && (
                                            <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full">
                                                ⚠ Reported Issues
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                            {new Date(feedback.created_at).toLocaleDateString("en-GB", {
                                                day: "numeric", month: "short", year: "numeric",
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                </div>
                                {feedback.comment ? (
                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                        "{feedback.comment}"
                                    </p>
                                ) : (
                                    <p className="text-slate-400 text-sm italic">No comment provided.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
