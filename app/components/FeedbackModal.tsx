"use client";

import { useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { useAuth } from "@/app/components/AuthProvider";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    title = "We value your feedback!",
    message = "How is your experience with SRS Studio so far? Your feedback helps us improve."
}: FeedbackModalProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState<number>(0);
    const [issues, setIssues] = useState(false);
    const [comment, setComment] = useState("");
    const [role, setRole] = useState<string>("");
    const [experienceLevel, setExperienceLevel] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [insertError, setInsertError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInsertError(null);

        const { error } = await supabase
            .from("feedbacks")
            .insert([{ rating, issues, comment, role, experience_level: experienceLevel, user_id: user?.id ?? null }]);

        if (error) {
            console.error("Failed to save feedback:", error);
            setInsertError(error.message);
            return; // Stop here so the user sees the error
        }

        console.log("Feedback submitted successfully:", { rating, comment, issues });
        setIsSubmitted(true);
        setTimeout(() => {
            onClose();
            setIsSubmitted(false);
            setRating(0);
            setIssues(false);
            setComment("");
            setRole("");
            setExperienceLevel("");
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 ease-out">
            <div className="p-8 md:p-10">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mt-16 -mr-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -mb-12 -ml-12 pointer-events-none"></div>

                {!isSubmitted ? (
                    <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-6 mx-auto">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center tracking-tight mb-3">
                            {title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-medium leading-relaxed">
                            {message}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${rating >= star
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">What best describes your role?</label>
                                <div className="flex gap-2">
                                    {["Developer", "Project Manager", "Other"].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`flex-1 py-2.5 px-2 rounded-2xl text-sm font-semibold transition-all duration-200 border ${
                                                role === r
                                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-105"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Experience Level — years based */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Years of Experience</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["< 1 year", "1-3 years", "3-5 years", "5+ years"].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setExperienceLevel(level)}
                                            className={`py-2.5 px-3 rounded-2xl text-sm font-semibold transition-all duration-200 border ${
                                                experienceLevel === level
                                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-105"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Encountered any issues so far?</span>
                                <div className="flex gap-2 items-center">
                                    <input type="radio" name="issues" className="rounded-full w-4 h-4" id="yes" checked={issues === true} onChange={() => setIssues(true)} />
                                    <label htmlFor="yes">Yes</label>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input type="radio" name="issues" className="rounded-full w-4 h-4" id="no" checked={issues === false} onChange={() => setIssues(false)} />
                                    <label htmlFor="no">No</label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Additional Comments</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What can we do better?"
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none min-h-[120px] resize-none"
                                />
                            </div>

                            {insertError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
                                    ⚠ Could not save feedback: {insertError}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all"
                                >
                                    Skip
                                </button>
                                <button
                                    type="submit"
                                    disabled={rating === 0 || role === "" || experienceLevel === ""}
                                    className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    Send Feedback
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="relative z-10 py-12 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Your feedback has been received.</p>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
