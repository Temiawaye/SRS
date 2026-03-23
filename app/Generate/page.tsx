"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../utils/supabaseClient";
import Sidebar from "../components/Sidebar";
import SrsDocument from "../components/SrsDocument";

const PARADIGMS = [
    { id: 'SRS', label: 'Software Requirements Specification (SRS)' },
    { id: 'PRD', label: 'Product Requirements Document (PRD)' },
    { id: 'User Stories', label: 'User Stories' }
];

export default function Generate() {
    const { user } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedParadigm, setSelectedParadigm] = useState(PARADIGMS[0]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form inputs
    const [idea, setIdea] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [features, setFeatures] = useState("");
    const [context, setContext] = useState("");

    // Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generated data
    const [srsData, setSrsData] = useState<any>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [srsDocId, setSrsDocId] = useState<string | null>(null);

    // Editing states
    const [isEditingDraft, setIsEditingDraft] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        if (!idea.trim()) {
            setError("Project Outline is required.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // 1. Call your Groq AI Service API
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea: `${idea}\n\nAdditional Context: ${context}`,
                    targetAudience,
                    features
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${res.status}`);
            }

            const data = await res.json();

            // Generate a simple title from the idea
            const projectTitle = idea.split(' ').slice(0, 5).join(' ') + '...';

            // 2. Insert into Supabase (if logged in)
            if (user && data.content) {
                // Create Project
                const { data: projectData, error: projectError } = await supabase
                    .from('projects')
                    .insert([{ user_id: user.id, title: projectTitle, description: idea }])
                    .select('id')
                    .single();

                if (projectError) throw projectError;
                setProjectId(projectData.id);

                // Create SRS Document
                const { data: srsDocData, error: srsError } = await supabase
                    .from('srs_documents')
                    .insert([{
                        project_id: projectData.id,
                        content: data,
                        version: 1
                    }])
                    .select('id')
                    .single();

                if (srsError) throw srsError;
                setSrsDocId(srsDocData.id);

                // Create Evaluation Metrics
                if (data.metrics) {
                    const { error: metricsError } = await supabase
                        .from('evaluation_metrics')
                        .insert([{
                            srs_id: srsDocData.id,
                            completeness_score: data.metrics.completeness,
                            consistency_score: data.metrics.consistency,
                            unambiguity_score: data.metrics.unambiguity,
                            traceability_score: data.metrics.traceability
                        }]);

                    if (metricsError) throw metricsError;
                }
            }

            // 3. Display the result
            setSrsData(data);
            setIsGenerated(true);

        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || "Failed to generate document. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            const updatedData = { ...srsData, content: draftContent };

            // If logged in, update Supabase
            if (user && srsDocId) {
                const { error } = await supabase
                    .from('srs_documents')
                    .update({ content: updatedData })
                    .eq('id', srsDocId);

                if (error) throw error;
            }

            setSrsData(updatedData);
            setIsEditingDraft(false);
        } catch (err) {
            console.error("Failed to save draft:", err);
            alert("Failed to save draft changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">

            <section className="flex flex-1 flex-col md:flex-row min-w-0 pb-10 md:pb-0 relative">

                {/* Mobile Menu Toggle Button Group */}
                <div className="md:hidden px-2 sm:px-6 py-4 z-10 sticky top-[73px]">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Sidebar Component */}
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                {/* Main Content */}
                <div className="flex-1 bg-slate-50/50 p-3 sm:p-6 md:p-10 lg:p-16 flex justify-center min-w-0">
                    <div className="max-w-3xl w-full flex flex-col min-w-0">
                        <div className="mb-6 md:mb-10 text-center md:text-left mt-4 md:mt-0">
                            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">Generate New Document</h1>
                            <p className="text-slate-500 mt-2 md:mt-3 text-sm md:text-lg">Describe your project, and our AI agents will handle the rest.</p>
                        </div>

                        {!isGenerated ? (
                            <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 flex flex-col gap-6 md:gap-8 relative overflow-hidden min-w-0 pb-16">
                                {/* Decorative blur in background */}
                                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-32 h-32 md:w-64 md:h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium z-10 w-full relative">
                                        {error}
                                    </div>
                                )}

                                {!user && (
                                    <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium z-10 w-full relative">
                                        You are currently not signed in. Documents generated won't be saved to your account.
                                    </div>
                                )}

                                {/* Document Type Custom Dropdown */}
                                <div className="relative z-30 min-w-0 w-full">
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Document Paradigm</label>
                                    <div className="relative min-w-0 w-full">
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className={`w-full text-left bg-slate-50/50 border rounded-xl px-4 py-3 sm:py-3.5 pr-10 text-sm md:text-base font-medium transition-all outline-none truncate flex items-center ${isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10 bg-slate-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {selectedParadigm.label}
                                        </button>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                            <svg className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>

                                        {isDropdownOpen && (
                                            <>
                                                {/* Invisible overlay to catch outside clicks */}
                                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>

                                                {/* Dropdown Menu */}
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden transform origin-top">
                                                    <div className="p-1.5 flex flex-col gap-0.5">
                                                        {PARADIGMS.map((paradigm) => (
                                                            <button
                                                                key={paradigm.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedParadigm(paradigm);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`text-left px-3 py-3 rounded-lg text-sm md:text-base transition-colors flex items-center gap-2 group ${selectedParadigm.id === paradigm.id
                                                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                                                    }`}
                                                            >
                                                                <div className="w-5 flex items-center justify-center shrink-0">
                                                                    {selectedParadigm.id === paradigm.id && (
                                                                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <span className="truncate">{paradigm.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Project Description */}
                                <div className="relative z-10 min-w-0 w-full mt-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Project Outline</label>
                                    <textarea
                                        value={idea}
                                        onChange={(e) => setIdea(e.target.value)}
                                        placeholder="Briefly describe what your project is about."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:bg-slate-50 transition-all outline-none min-h-[140px] resize-y"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10 min-w-0 w-full">
                                    {/* Target Audience */}
                                    <div className="min-w-0 w-full">
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 truncate">Target Audience</label>
                                        <input
                                            type="text"
                                            value={targetAudience}
                                            onChange={(e) => setTargetAudience(e.target.value)}
                                            placeholder="e.g. Students"
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:bg-slate-50 transition-all outline-none truncate"
                                        />
                                    </div>
                                    {/* Key Features */}
                                    <div className="min-w-0 w-full">
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 truncate">Key Highlights</label>
                                        <input
                                            type="text"
                                            value={features}
                                            onChange={(e) => setFeatures(e.target.value)}
                                            placeholder="e.g. Authentication"
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:bg-slate-50 transition-all outline-none truncate"
                                        />
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="relative z-10 min-w-0 w-full">
                                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 mb-2 truncate">
                                        Additional Context <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">Optional</span>
                                    </label>
                                    <textarea
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        placeholder="Any technical constraints?"
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:bg-slate-50 transition-all outline-none min-h-[100px] resize-y"
                                    ></textarea>
                                </div>

                                {/* Actions / Submit */}
                                <div className="mt-2 md:mt-4 relative z-10 pt-6 border-t border-slate-100/80 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium">Takes ~30 seconds to generate via LLMs</p>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className={`w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl px-8 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 ${isGenerating ? 'opacity-80 scale-[0.98]' : 'active:scale-[0.98]'}`}>
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin w-5 h-5 text-blue-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Generate Draft
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Success Banner */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 sm:p-5 flex gap-4 text-emerald-800 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-3xl -mt-10 -mr-10 pointer-events-none"></div>
                                    <div className="p-2 bg-emerald-100 rounded-lg shrink-0 h-fit self-start">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="z-10">
                                        <h3 className="font-bold text-emerald-900 text-sm sm:text-base">Generation Complete</h3>
                                        <p className="text-emerald-700/80 text-xs sm:text-sm mt-0.5 leading-relaxed font-medium">The Planner, Generator, and Validator agents have successfully finalized your draft. Review the results below.</p>
                                    </div>
                                </div>

                                {/* Generated Document Display */}
                                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden min-w-0">

                                    {/* Tab bar */}
                                    <div className="flex border-b border-slate-100 px-4 pt-2 shrink-0">
                                        <div className="px-4 py-4 flex items-center gap-2 font-bold text-sm text-slate-800 border-b-2 border-emerald-500 -mb-[1px]">
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            SRS Output
                                        </div>
                                    </div>

                                    {/* Scrollable document body */}
                                    <div className="overflow-y-auto max-h-[700px]">
                                        {isEditingDraft ? (
                                            <div className="p-6 h-full min-h-[500px] flex flex-col">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Edit Mode Active</span>
                                                    <span className="text-xs text-slate-400">Markdown Supported</span>
                                                </div>
                                                <textarea
                                                    className="w-full flex-1 p-6 text-sm leading-relaxed text-slate-700 bg-slate-50 border border-slate-200 outline-none resize-y font-mono focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 min-h-[600px] shadow-inner rounded-xl"
                                                    value={draftContent}
                                                    onChange={(e) => setDraftContent(e.target.value)}
                                                ></textarea>
                                            </div>
                                        ) : (
                                            <div className="p-4 sm:p-6 bg-slate-50/50">
                                                <SrsDocument
                                                    content={srsData?.content}
                                                    title={idea.split(' ').slice(0, 6).join(' ')}
                                                    documentType={selectedParadigm.label}
                                                    targetAudience={targetAudience || 'General'}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Issues Section */}
                                    <div className="p-6 md:p-8 bg-white border-t border-slate-100">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="bg-orange-50 p-1.5 rounded-lg">
                                                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold text-slate-800">Auto-Detected Issues by Reviewer Agent</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {srsData?.issues?.map((issue: any, index: number) => (
                                                <div key={index} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-5 hover:border-slate-200 transition-colors shadow-sm">
                                                    <div className="bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex w-fit mb-3">
                                                        {issue.type || 'ISSUE'}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
                                                        {issue.text}
                                                    </p>
                                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                                        <p className="text-xs text-slate-500 italic">
                                                            Suggestion: {issue.suggestion}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {(!srsData?.issues || srsData.issues.length === 0) && (
                                                <div className="col-span-full border border-emerald-100 bg-emerald-50/50 rounded-2xl p-5">
                                                    <p className="text-sm font-medium text-emerald-700">No major issues found. The requirements look solid!</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                                            {isEditingDraft ? (
                                                <>
                                                    <button
                                                        onClick={() => setIsEditingDraft(false)}
                                                        disabled={isSaving}
                                                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveDraft}
                                                        disabled={isSaving}
                                                        className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                                                        {isSaving ? "Saving..." : "Save Changes"}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setDraftContent(srsData?.content || '');
                                                            setIsEditingDraft(true);
                                                        }}
                                                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                                        Edit Draft
                                                    </button>
                                                    <Link href={projectId ? `/Evaluate?projectId=${projectId}` : "/Evaluate"}>
                                                        <button className="px-5 py-2.5 bg-teal-600 text-white font-semibold text-sm rounded-xl shadow-sm shadow-teal-600/20 hover:bg-teal-700 transition-colors flex items-center gap-2">
                                                            View Evaluation Metrics
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                            </svg>
                                                        </button>
                                                    </Link>
                                                </>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}