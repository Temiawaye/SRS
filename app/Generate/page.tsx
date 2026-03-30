"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/app/utils/supabaseClient";
import Sidebar from "@/app/components/Sidebar";
import SrsDocument from "@/app/components/SrsDocument";

export default function Generate() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form inputs
    const [projectName, setProjectName] = useState("");
    const [idea, setIdea] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [features, setFeatures] = useState("");
    const [techStack, setTechStack] = useState("");
    const [context, setContext] = useState("");
    const [activeInfo, setActiveInfo] = useState<string | null>(null);

    // Auto-resize textarea refs
    const projectNameRef = useRef<HTMLTextAreaElement>(null);
    const ideaRef = useRef<HTMLTextAreaElement>(null);
    const targetAudienceRef = useRef<HTMLTextAreaElement>(null);
    const featuresRef = useRef<HTMLTextAreaElement>(null);
    const techStackRef = useRef<HTMLTextAreaElement>(null);
    const contextRef = useRef<HTMLTextAreaElement>(null);

    const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }, []);

    useEffect(() => { autoResize(projectNameRef.current); }, [projectName, autoResize]);
    useEffect(() => { autoResize(ideaRef.current); }, [idea, autoResize]);
    useEffect(() => { autoResize(targetAudienceRef.current); }, [targetAudience, autoResize]);
    useEffect(() => { autoResize(featuresRef.current); }, [features, autoResize]);
    useEffect(() => { autoResize(techStackRef.current); }, [techStack, autoResize]);
    useEffect(() => { autoResize(contextRef.current); }, [context, autoResize]);

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
        if (!projectName.trim()) {
            setError("Project Name is required.");
            return;
        }
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
                    idea,
                    targetAudience,
                    features,
                    techStack,
                    context
                })

            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${res.status}`);
            }

            const data = await res.json();

            // Use the user-provided project name as the title
            const projectTitle = projectName.trim();

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
        <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">

            <section className="flex flex-1 flex-col md:flex-row min-w-0 pb-10 md:pb-0 relative">

                {/* Mobile Menu Toggle Button Group */}
                <div className="md:hidden px-2 sm:px-6 py-4 z-10 sticky top-[73px]">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Sidebar Component */}
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                {/* Main Content */}
                <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/50 p-3 sm:p-6 md:p-10 lg:p-16 flex justify-center min-w-0">
                    <div className="max-w-3xl w-full flex flex-col min-w-0">
                        <div className="mb-6 md:mb-10 text-center md:text-left mt-4 md:mt-0">
                            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Generate New Document</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 md:mt-3 text-sm md:text-lg">Describe your project, and our AI agents will handle the rest.</p>
                        </div>

                        {!isGenerated ? (
                            <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col gap-6 md:gap-8 relative overflow-hidden min-w-0 pb-16">
                                {/* Decorative blur in background */}
                                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-32 h-32 md:w-64 md:h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium z-10 w-full relative">
                                        {error}
                                    </div>
                                )}

                                {!user && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm font-medium z-10 w-full relative">
                                        You are currently not signed in. Documents generated won't be saved to your account.
                                    </div>
                                )}

                                {/* Document Type Removed – no longer needed */}

                                {/* Project Name */}
                                <div className="relative z-10 min-w-0 w-full mt-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Project Name</label>
                                    <div className="absolute right-0 top-0">
                                        <button type="button" onClick={() => setActiveInfo(activeInfo === 'projectName' ? null : 'projectName')} onMouseEnter={() => setActiveInfo('projectName')} onMouseLeave={() => setActiveInfo(null)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Info">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </button>
                                        {activeInfo === 'projectName' && (
                                            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-slate-100 rounded-xl text-xs leading-relaxed shadow-xl animate-in fade-in zoom-in-95 z-[60] pointer-events-none">
                                                The official name or working title of your software project.
                                                <div className="absolute -top-1 right-2 w-3 h-3 bg-slate-800 dark:bg-slate-700 transform rotate-45 rounded-sm"></div>
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        ref={projectNameRef}
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="Enter a name for your project."
                                        rows={1}
                                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 dark:text-slate-200 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all outline-none max-h-[56px] resize-none overflow-hidden"
                                    ></textarea>
                                </div>

                                {/* Project Outline */}
                                <div className="relative z-10 min-w-0 w-full">
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Project Outline</label>
                                    <div className="absolute right-0 top-0">
                                        <button type="button" onClick={() => setActiveInfo(activeInfo === 'idea' ? null : 'idea')} onMouseEnter={() => setActiveInfo('idea')} onMouseLeave={() => setActiveInfo(null)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Info">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </button>
                                        {activeInfo === 'idea' && (
                                            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-slate-100 rounded-xl text-xs leading-relaxed shadow-xl animate-in fade-in zoom-in-95 z-[60] pointer-events-none">
                                                A high-level summary of what your software aims to do and the core problems it solves.
                                                <div className="absolute -top-1 right-2 w-3 h-3 bg-slate-800 dark:bg-slate-700 transform rotate-45 rounded-sm"></div>
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        ref={ideaRef}
                                        value={idea}
                                        onChange={(e) => setIdea(e.target.value)}
                                        placeholder="Briefly describe what your project is about."
                                        rows={1}
                                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 dark:text-slate-200 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all outline-none max-h-[400px] resize-none overflow-hidden"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10 min-w-0 w-full">
                                    {/* Target Audience */}
                                    <div className="relative min-w-0 w-full">
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
                                        <div className="absolute right-0 top-0">
                                            <button type="button" onClick={() => setActiveInfo(activeInfo === 'audience' ? null : 'audience')} onMouseEnter={() => setActiveInfo('audience')} onMouseLeave={() => setActiveInfo(null)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Info">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                            {activeInfo === 'audience' && (
                                                <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-slate-100 rounded-xl text-xs leading-relaxed shadow-xl animate-in fade-in zoom-in-95 z-[60] pointer-events-none">
                                                    Who will be using this software? E.g., students, internal employees, or general consumers.
                                                    <div className="absolute -top-1 right-2 w-3 h-3 bg-slate-800 dark:bg-slate-700 transform rotate-45 rounded-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                        <textarea
                                            ref={targetAudienceRef}
                                            value={targetAudience}
                                            onChange={(e) => setTargetAudience(e.target.value)}
                                            placeholder="e.g. Students"
                                            rows={1}
                                            className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 dark:text-slate-200 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all outline-none max-h-[270px] resize-none overflow-hidden"
                                        ></textarea>
                                    </div>
                                    {/* Key Features */}
                                    <div className="relative min-w-0 w-full">
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Key Highlights</label>
                                        <div className="absolute right-0 top-0">
                                            <button type="button" onClick={() => setActiveInfo(activeInfo === 'features' ? null : 'features')} onMouseEnter={() => setActiveInfo('features')} onMouseLeave={() => setActiveInfo(null)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Info">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                            {activeInfo === 'features' && (
                                                <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-slate-100 rounded-xl text-xs leading-relaxed shadow-xl animate-in fade-in zoom-in-95 z-[60] pointer-events-none">
                                                    The most important features, modules, or unique selling points of your application.
                                                    <div className="absolute -top-1 right-2 w-3 h-3 bg-slate-800 dark:bg-slate-700 transform rotate-45 rounded-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                        <textarea
                                            ref={featuresRef}
                                            value={features}
                                            onChange={(e) => setFeatures(e.target.value)}
                                            placeholder="e.g. Authentication"
                                            rows={1}
                                            className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 dark:text-slate-200 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all outline-none max-h-[270px] resize-none overflow-hidden"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Tech Stack */}
                                <div className="relative z-10 min-w-0 w-full">
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tech Stack</label>
                                    <div className="absolute right-0 top-0">
                                        <button type="button" onClick={() => setActiveInfo(activeInfo === 'techStack' ? null : 'techStack')} onMouseEnter={() => setActiveInfo('techStack')} onMouseLeave={() => setActiveInfo(null)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Info">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </button>
                                        {activeInfo === 'techStack' && (
                                            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-slate-100 rounded-xl text-xs leading-relaxed shadow-xl animate-in fade-in zoom-in-95 z-[60] pointer-events-none">
                                                Specific programming languages, frameworks, databases, and tools you plan to use.
                                                <div className="absolute -top-1 right-2 w-3 h-3 bg-slate-800 dark:bg-slate-700 transform rotate-45 rounded-sm"></div>
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        ref={techStackRef}
                                        value={techStack}
                                        onChange={(e) => setTechStack(e.target.value)}
                                        placeholder="e.g. Next.js, PostgreSQL, TypeScript, AWS"
                                        rows={1}
                                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 dark:text-slate-200 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all outline-none max-h-[270px] resize-none overflow-hidden"
                                    ></textarea>
                                </div>

                                {/* Additional Information */}
                                <div className="relative z-10 min-w-0 w-full">
                                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 truncate">
                                        Additional Context <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md hidden sm:inline-block">Optional</span>
                                    </label>
                                    <div className="absolute right-0 top-0">
                                        <button type="button" onClick={() => setActiveInfo(activeInfo === 'context' ? null : 'context')} onMouseEnter={() => setActiveInfo('context')} onMouseLeave={() => setActiveInfo(null)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Info">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </button>
                                        {activeInfo === 'context' && (
                                            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-slate-100 rounded-xl text-xs leading-relaxed shadow-xl animate-in fade-in zoom-in-95 z-[60] pointer-events-none">
                                                Any other constraints, security guidelines, design preferences, or business rules the AI should know.
                                                <div className="absolute -top-1 right-2 w-3 h-3 bg-slate-800 dark:bg-slate-700 transform rotate-45 rounded-sm"></div>
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        ref={contextRef}
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        placeholder="Any technical constraints?"
                                        rows={1}
                                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-700 dark:text-slate-200 text-sm md:text-base placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all outline-none max-h-[400px] resize-none overflow-hidden"
                                    ></textarea>
                                </div>

                                {/* Actions / Submit */}
                                <div className="mt-2 md:mt-4 relative z-10 pt-6 border-t border-slate-100/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Takes ~30 seconds to generate via LLMs</p>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className={`w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl px-8 py-3.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 ${isGenerating ? 'opacity-80 scale-[0.98]' : 'active:scale-[0.98]'}`}>
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin w-5 h-5 text-emerald-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 sm:p-5 flex gap-4 text-emerald-800 dark:text-emerald-400 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 dark:bg-emerald-800/20 rounded-full blur-3xl -mt-10 -mr-10 pointer-events-none"></div>
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shrink-0 h-fit self-start">
                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="z-10">
                                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm sm:text-base">Generation Complete</h3>
                                        <p className="text-emerald-700/80 dark:text-emerald-400/80 text-xs sm:text-sm mt-0.5 leading-relaxed font-medium">The Planner, Generator, and Validator agents have successfully finalized your draft. Review the results below.</p>
                                    </div>
                                </div>

                                {/* Generated Document Display */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col overflow-hidden min-w-0">

                                    {/* Tab bar */}
                                    <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 shrink-0">
                                        <div className="px-4 py-4 flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 border-b-2 border-emerald-500 -mb-[1px]">
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
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded">Edit Mode Active</span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500">Markdown Supported</span>
                                                </div>
                                                <textarea
                                                    className="w-full flex-1 p-6 text-sm leading-relaxed text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none resize-y font-mono focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 min-h-[600px] shadow-inner rounded-xl"
                                                    value={draftContent}
                                                    onChange={(e) => setDraftContent(e.target.value)}
                                                ></textarea>
                                            </div>
                                        ) : (
                                            <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                                <SrsDocument
                                                    content={srsData?.content}
                                                    title={projectName.trim() || idea.split(' ').slice(0, 6).join(' ')}
                                                    documentType="Software Requirements Specification (SRS)"
                                                    targetAudience={targetAudience || 'General'}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Issues Section */}
                                    <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded-lg">
                                                <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200">Auto-Detected Issues by Reviewer Agent</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {srsData?.issues?.map((issue: any, index: number) => (
                                                <div key={index} className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors shadow-sm">
                                                    <div className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex w-fit mb-3">
                                                        {issue.type || 'ISSUE'}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                                        {issue.text}
                                                    </p>
                                                    <div className="bg-white dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
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
                                        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                            {isEditingDraft ? (
                                                <>
                                                    <button
                                                        onClick={() => setIsEditingDraft(false)}
                                                        disabled={isSaving}
                                                        className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveDraft}
                                                        disabled={isSaving}
                                                        className="px-5 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50">
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
                                                        className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
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