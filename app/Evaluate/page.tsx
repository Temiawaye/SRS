"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabaseClient';
import { useAuth } from '@/app/components/AuthProvider';
import Sidebar from '@/app/components/Sidebar';
import SrsDocument from '@/app/components/SrsDocument';
import { useFeedback } from '@/app/components/FeedbackProvider';
import mammoth from 'mammoth';

function EvaluateContent() {
    const { user, isLoading: authLoading } = useAuth();
    const { triggerFeedback } = useFeedback();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('action-items'); // 'detailed', 'action-items'

    const [documentData, setDocumentData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleExport = () => {
        const titleToSave = isExternalMode ? "External Document Evaluation" : (documentData?.projects?.title || "Untitled Project");
        const originalTitle = document.title;
        document.title = titleToSave;

        window.print();

        // Restore title after print dialog closes
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const [isExternalMode, setIsExternalMode] = useState(false);
    const [externalContent, setExternalContent] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showPasteFallback, setShowPasteFallback] = useState(false);
    const [importedFileName, setImportedFileName] = useState<string | null>(null);
    const [isParsingDocx, setIsParsingDocx] = useState(false);
    const [isParsingPdf, setIsParsingPdf] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfjsRef = useRef<any>(null);

    // Dynamically load PDF.js (legacy build) on the client only
    useEffect(() => {
        async function loadPdfJs() {
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf' as any);
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
            pdfjsRef.current = pdfjs;
        }
        loadPdfJs();
    }, []);

    const handleFileImport = useCallback(async (file: File) => {
        const isDocx = file.name.endsWith('.docx') ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';
        const isText = file.name.endsWith('.md') || file.name.endsWith('.txt') ||
            file.name.endsWith('.markdown') ||
            ['text/plain', 'text/markdown', 'text/x-markdown'].includes(file.type);

        if (!isDocx && !isText && !isPdf) {
            alert('Unsupported file type. Please upload a .docx, .pdf, .txt, or .md file.');
            return;
        }

        setImportedFileName(file.name);
        setShowPasteFallback(false);

        if (isDocx) {
            setIsParsingDocx(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                setExternalContent(result.value);
            } catch (err) {
                console.error('Failed to parse .docx:', err);
                alert('Could not read the Word document. Please try saving it as .txt or .md instead.');
                setImportedFileName(null);
            } finally {
                setIsParsingDocx(false);
            }
        } else if (isPdf) {
            setIsParsingPdf(true);
            try {
                const pdfjs = pdfjsRef.current;
                if (!pdfjs) throw new Error('PDF.js has not loaded yet. Please try again.');
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                let extractedText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items
                        .map((item: any) => item.str || '')
                        .join(' ');
                    extractedText += pageText + '\n\n';
                }

                setExternalContent(extractedText.trim());
            } catch (err) {
                console.error('Failed to parse .pdf:', err);
                alert('Could not read the PDF file. Please try copy-pasting or saving as text/Word format instead.');
                setImportedFileName(null);
            } finally {
                setIsParsingPdf(false);
            }
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                setExternalContent(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    }, []);

    useEffect(() => {
        const handleOpenSidebar = () => setIsSidebarOpen(true);
        window.addEventListener('open-sidebar', handleOpenSidebar);
        return () => window.removeEventListener('open-sidebar', handleOpenSidebar);
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (!projectId) {
            setIsExternalMode(true);
            setDocumentData(null);
            setIsLoading(false);
            return;
        }

        setIsExternalMode(false);

        async function fetchLatestDocument() {
            try {
                let query = supabase
                    .from('srs_documents')
                    .select(`
                        id,
                        created_at,
                        content,
                        projects!inner (
                            title,
                            description
                        ),
                        evaluation_metrics (
                            completeness_score,
                            consistency_score,
                            unambiguity_score,
                            traceability_score
                        )
                    `)
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false })
                    .limit(1);

                const { data, error } = await query.single();

                if (error && error.code !== 'PGRST116') { // PGRST116 means 0 rows
                    console.error("Error fetching documents:", error);
                } else if (data) {
                    setDocumentData(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchLatestDocument();
    }, [user, authLoading, projectId]);

    const handleEvaluateExternal = async () => {
        if (!externalContent.trim()) return;

        if (!user) {
            return;
        }

        setIsEvaluating(true);
        try {
            const response = await fetch('/api/chat/Evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentContent: externalContent })
            });

            if (!response.ok) throw new Error('Failed to evaluate document');

            const data = await response.json();

            setDocumentData({
                projects: { title: "External Document Evaluation" },
                created_at: new Date().toISOString(),
                content: { content: externalContent, metrics: data.metrics, issues: data.issues },
                evaluation_metrics: []
            });

            // Trigger feedback modal
            setTimeout(() => {
                triggerFeedback(
                    "Evaluation Complete!",
                    "We've analyzed your document. Was this evaluation helpful?"
                );
            }, 2000);
        } catch (error) {
            console.error("Evaluation error:", error);
            alert("Failed to evaluate document. Please try again.");
        } finally {
            setIsEvaluating(false);
        }
    };

    if (isLoading || authLoading) {
        return (
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin w-8 h-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Evaluation Metrics...</p>
                </div>
            </main>
        );
    }

    if (!documentData && !isExternalMode) {
        return (
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-md">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Documents Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">You haven't generated any SRS documents yet. Head over to the generator to create your first draft.</p>
                    <Link href="/Generate">
                        <button className="bg-emerald-600 text-white font-medium rounded-xl px-6 py-2.5 hover:bg-emerald-700 transition-colors">
                            Generate Document
                        </button>
                    </Link>
                </div>
            </main>
        );
    }

    const projectTitle = isExternalMode ? "External Document Evaluation" : (documentData?.projects?.title || "Untitled Project");
    const evaluation_metrics = documentData?.evaluation_metrics;
    const content = documentData?.content;
    const created_at = documentData?.created_at || new Date().toISOString();

    // Fallback to parsed content metrics if the table wasn't joined or is explicitly empty
    const metricsResult = (evaluation_metrics && evaluation_metrics.length > 0) ? evaluation_metrics[0] : content?.metrics;
    const completeness = metricsResult?.completeness_score || metricsResult?.completeness || 0;
    const consistency = metricsResult?.consistency_score || metricsResult?.consistency || 0;
    const unambiguity = metricsResult?.unambiguity_score || metricsResult?.unambiguity || 0;
    const traceability = metricsResult?.traceability_score || metricsResult?.traceability || 0;

    const overall = metricsResult?.overall || (documentData ? Math.round((completeness + consistency + unambiguity + traceability) / 4) : 0);

    const issues = content?.issues || [];

    const isPRD = content?.content?.toLowerCase().includes('product requirements') || content?.content?.includes('Product Vision');
    const displayDocumentType = isPRD ? 'Product Requirements Document (PRD)' : 'Software Requirements Specification (SRS)';
    const displayTargetAudience = isPRD ? 'Stakeholders' : 'Development Team';

    return (
        <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
            <section className="flex flex-1 flex-col md:flex-row min-w-0 pb-10 md:pb-0 relative">

                {/* Sidebar Component */}
                <div className="no-print">
                    <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 flex justify-center min-w-0">
                    <div className="max-w-[1400px] w-full flex flex-col gap-6">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="no-print print:hidden">
                                    <Link href="/Generate">
                                        <button className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm text-slate-500 dark:text-slate-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </Link>
                                </div>
                                <div className="no-print print:hidden">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">{projectTitle}</h1>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                            Completed
                                        </span>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {!isExternalMode && (
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm no-print print:hidden"
                                >
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export PDF
                                </button>
                            )}
                        </div>

                        {/* Main Content Split: Left (SRS Output), Right (Metrics + Tabs) */}
                        <div className="flex flex-col lg:flex-row gap-6 items-start">

                            {/* Left Column: SRS Output */}
                            <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 lg:sticky lg:top-24 min-h-[400px] lg:min-h-[calc(100vh-8rem)] relative overflow-hidden srs-print-column">
                                <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 no-print print:hidden">
                                    <div className="px-4 py-4 flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 border-b-2 border-emerald-500 -mb-[1px]">
                                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {isPRD ? 'PRD Output' : 'SRS Output'}
                                    </div>
                                </div>
                                <div className="p-0 flex-1 overflow-y-auto relative srs-print-scroll">
                                    {isExternalMode ? (
                                        <div className="p-5 h-full flex flex-col gap-4">

                                            {/* Hidden native file input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".txt,.md,.markdown,.docx,.pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileImport(file);
                                                    e.target.value = '';
                                                }}
                                            />

                                            {/* Drop zone or file loaded state */}
                                            {!externalContent ? (
                                                <div
                                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                    onDragLeave={() => setIsDragging(false)}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        setIsDragging(false);
                                                        const file = e.dataTransfer.files[0];
                                                        if (file) handleFileImport(file);
                                                    }}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[320px] ${isDragging
                                                            ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/10 scale-[1.01]'
                                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/40 dark:hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${isDragging ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'
                                                        }`}>
                                                        <svg className={`w-8 h-8 transition-colors ${isDragging ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-base mb-1">
                                                        {isDragging ? 'Drop your file here' : 'Upload your document'}
                                                    </p>
                                                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Drag & drop or click to browse</p>
                                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.PDF</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.DOCX</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.TXT</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.MD</span>
                                                    </div>
                                                    {(isParsingDocx || isParsingPdf) && (
                                                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                                            {isParsingDocx ? 'Reading Word document…' : 'Reading PDF document…'}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* File loaded preview */
                                                <div className="flex-1 flex flex-col gap-3">
                                                    <div className="flex items-center justify-between gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center shrink-0">
                                                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 truncate">{importedFileName ?? 'Document loaded'}</p>
                                                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{(externalContent.length / 1024).toFixed(1)} KB · {externalContent.split('\n').length} lines</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => { setExternalContent(''); setImportedFileName(null); }}
                                                            className="shrink-0 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Remove file"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* Preview of first ~30 lines */}
                                                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[340px]">
                                                        <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">{externalContent.split('\n').slice(0, 60).join('\n')}{externalContent.split('\n').length > 60 ? '\n…' : ''}</pre>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Paste fallback toggle */}
                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => setShowPasteFallback(p => !p)}
                                                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1.5"
                                                >
                                                    <svg className={`w-3.5 h-3.5 transition-transform ${showPasteFallback ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    {showPasteFallback ? 'Hide' : 'Or paste text manually'}
                                                </button>
                                                {showPasteFallback && (
                                                    <textarea
                                                        className="w-full mt-2 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none font-mono shadow-inner min-h-[160px]"
                                                        placeholder="Paste your SRS or PRD content here…"
                                                        value={externalContent}
                                                        onChange={(e) => { setExternalContent(e.target.value); setImportedFileName(null); }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-0 sm:p-4 pb-24 dark:bg-slate-900/50 srs-print-container">
                                            <SrsDocument
                                                content={content?.content}
                                                title={projectTitle}
                                                date={new Date(created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                documentType={displayDocumentType}
                                                targetAudience={displayTargetAudience}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Floating Edit Button */}
                                <div className="absolute bottom-6 right-6 z-10 flex gap-3">
                                    {isExternalMode ? (
                                        <button
                                            onClick={handleEvaluateExternal}
                                            disabled={isEvaluating || !externalContent.trim()}
                                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-full px-6 py-3.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isEvaluating ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Evaluating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 text-emerald-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                    Evaluate Document
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        // <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-full px-6 py-3.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]">
                                        //     <svg className="w-4 h-4 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        //     </svg>
                                        //     Edit Document
                                        // </button>
                                        <div> </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: The Rest */}
                            <div className="w-full lg:w-1/2 flex flex-col gap-6 metrics-panel no-print print:hidden">
                                {/* Score & Metrics Top Cards */}
                                <div className="flex flex-col gap-6">
                                    {/* Overall Score Card */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                        <div className="relative flex items-center justify-center w-40 h-40 mb-4 z-10">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" className="text-slate-100 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="none" />
                                                <circle
                                                    cx="50" cy="50" r="40"
                                                    className="text-emerald-500"
                                                    strokeWidth="8" stroke="currentColor" fill="none"
                                                    strokeLinecap="round"
                                                    strokeDasharray="251.2"
                                                    strokeDashoffset={251.2 - (251.2 * overall / 100)}
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center mt-1 text-center">
                                                <span className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tighter">{overall}</span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-widest text-center">/ 100</span>
                                            </div>
                                        </div>
                                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 z-10">Overall Quality Score</h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium z-10">Based on requirements heuristics</p>
                                    </div>

                                    {/* Metric Breakdown Card */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col">
                                        <div className="flex items-center gap-2.5 mb-6">
                                            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">Metric Breakdown</h2>
                                        </div>

                                        <div className="flex flex-col gap-6 flex-1 justify-center px-2">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Completeness</span>
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{completeness}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completeness}%` }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Consistency</span>
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{consistency}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${consistency}%` }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ambiguity</span>
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{unambiguity}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${unambiguity}%` }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Traceability</span>
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{traceability}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${traceability}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Tabs Section */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mt-2 flex flex-col min-h-[400px] tabs-panel no-print print:hidden">
                                    {/* Tabs Header */}
                                    <div className="flex flex-wrap border-b border-slate-100 dark:border-slate-800 px-4 pt-2">
                                        <button
                                            onClick={() => setActiveTab('detailed')}
                                            className={`px-4 md:px-6 py-4 flex items-center gap-2 font-semibold text-sm transition-all border-b-2 -mb-[1px] ${activeTab === 'detailed' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Detailed Analysis
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('action-items')}
                                            className={`px-4 md:px-6 py-4 flex items-center gap-2 font-semibold text-sm transition-all border-b-2 -mb-[1px] ${activeTab === 'action-items' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Action Items
                                            <span className={`flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 ${activeTab === 'action-items' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{issues.length}</span>
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-6 md:p-8 flex-1">
                                        {activeTab === 'action-items' && (
                                            <div className="flex flex-col gap-4">
                                                {issues.length > 0 ? issues.map((issue: any, index: number) => (
                                                    <div key={index} className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
                                                        <div className="flex gap-3">
                                                            <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <div className="flex flex-col">
                                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">{issue.type || 'Reviewer Note'}</h3>
                                                                <div className="mt-2.5 border-l-2 border-amber-300 dark:border-amber-700/50 pl-3">
                                                                    <p className="text-slate-600 dark:text-slate-400 text-sm italic">"{issue.text}"</p>
                                                                </div>
                                                                <p className="text-slate-700 dark:text-slate-300 text-sm mt-3 font-medium">Suggestion: {issue.suggestion}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-center text-slate-500 py-10">
                                                        <svg className="w-12 h-12 text-emerald-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                        </svg>
                                                        No issues detected. Your document meets pristine requirements standards!
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'detailed' && (
                                            <div className="flex flex-col gap-6">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                    The generated {isPRD ? 'PRD' : 'SRS'} meets the standard threshold across most key metrics based on our AI heuristics. Below is a detailed breakdown of each quality dimension.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                                                    <div className="border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 md:p-6 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow transition-all group">
                                                        <div className="flex items-center justify-between mb-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                </span>
                                                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Completeness</h3>
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-md">{completeness}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${completeness}%` }}></div></div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-auto">All required sections and elements are present.</p>
                                                    </div>

                                                    <div className="border border-teal-100 dark:border-teal-900/30 rounded-xl p-5 md:p-6 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col hover:border-teal-200 dark:hover:border-teal-800 hover:shadow transition-all group">
                                                        <div className="flex items-center justify-between mb-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1.5 bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-md group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                </span>
                                                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Consistency</h3>
                                                            </div>
                                                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-2 py-1 rounded-md">{consistency}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5"><div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${consistency}%` }}></div></div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-auto">Requirements do not contradict each other.</p>
                                                    </div>

                                                    <div className="border border-orange-100 dark:border-orange-900/30 rounded-xl p-5 md:p-6 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col hover:border-orange-200 dark:hover:border-orange-800 hover:shadow transition-all group">
                                                        <div className="flex items-center justify-between mb-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1.5 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-md group-hover:bg-orange-100 dark:group-hover:bg-orange-900/60 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                </span>
                                                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Ambiguity</h3>
                                                            </div>
                                                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/40 px-2 py-1 rounded-md">{unambiguity}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5"><div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${unambiguity}%` }}></div></div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-auto">Each requirement has one clear interpretation.</p>
                                                    </div>

                                                    <div className="border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 md:p-6 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow transition-all group">
                                                        <div className="flex items-center justify-between mb-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                </span>
                                                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Traceability</h3>
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-md">{traceability}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${traceability}%` }}></div></div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-auto">Requirements are testable and measurable.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Sign In Modal Removed as page is now protected */}
        </main>
    );
}

export default function Evaluate() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin w-8 h-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
                </div>
            </main>
        }>
            <EvaluateContent />
        </Suspense>
    );
}