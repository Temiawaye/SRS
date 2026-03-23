import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SrsDocumentProps {
    content: string | undefined | null;
    title?: string;
    documentType?: string;
    version?: string;
    status?: string;
    date?: string;
    targetAudience?: string;
    preparedBy?: string;
    standard?: string;
}

export default function SrsDocument({
    content,
    title = 'Untitled Project',
    documentType = 'Software Requirements Specification (SRS)',
    version = '1.0',
    status = 'Draft — AI Generated',
    date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    targetAudience = 'General',
    preparedBy = 'AI Agents (Planner · Generator · Validator)',
    standard = 'IEEE Std 830-1998'
}: SrsDocumentProps) {
    if (!content) return null;

    return (
        <div className="bg-white text-slate-900 font-sans max-w-[900px] mx-auto shadow-2xl overflow-hidden min-h-[1100px] flex flex-col border border-slate-200">
            {/* Header */}
            <header className="px-12 py-8 flex justify-between items-center text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase border-b border-slate-50">
                <span>AI-SRS STUDIO</span>
                <span className="text-blue-500/80">CONFIDENTIAL DRAFT</span>
            </header>

            <div className="flex-1 px-10 md:px-16 py-8">
                {/* Document Title Section */}
                <div className="mb-10">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">SOFTWARE REQUIREMENTS SPECIFICATION</h2>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight capitalize leading-tight">{title}</h1>
                </div>

                {/* Metadata Table */}
                <div className="mb-10 border-t border-slate-100 font-medium">
                    <table className="w-full text-xs border-collapse">
                        <tbody>
                            {[
                                { label: 'Document Type', value: documentType },
                                { label: 'Version', value: version },
                                { label: 'Status', value: status },
                                { label: 'Date', value: date },
                                { label: 'Target Audience', value: targetAudience },
                                { label: 'Prepared By', value: preparedBy },
                                { label: 'Standard', value: standard }
                            ].map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 group transition-colors hover:bg-slate-50/50">
                                    <td className="py-2.5 w-1/3 text-slate-400 uppercase tracking-wider text-[10px]">{row.label}</td>
                                    <td className="py-2.5 text-slate-700 font-bold">{row.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Main Separator */}
                <div className="h-1 w-full bg-slate-900 mb-10 shadow-sm"></div>

                {/* TOC Section */}
                <div className="mb-12">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-blue-600/70 uppercase mb-6">TABLE OF CONTENTS</h3>
                    <div className="space-y-3">
                        {/* Auto-extracted or static placeholders could go here */}
                        <div className="text-sm font-semibold text-slate-700 space-y-3">
                            <div className="flex items-end gap-2 group cursor-default">
                                <span className="text-slate-500 font-bold shrink-0">1</span>
                                <span className="group-hover:text-blue-600 transition-colors">Software Requirements Specification for {title}</span>
                                <div className="flex-1 border-b border-dotted border-slate-200 mb-1.5 opacity-50"></div>
                            </div>
                            <div className="pl-6 space-y-2.5">
                                {['Purpose', 'Scope', 'Overall Description', 'Features', 'Non-functional Requirements'].map((item, idx) => (
                                    <div key={idx} className="flex items-end gap-2 font-medium group cursor-default">
                                        <span className="text-slate-400 shrink-0">1.{idx + 1}</span>
                                        <span className="text-slate-600 group-hover:text-blue-500 transition-colors">{item}</span>
                                        <div className="flex-1 border-b border-dotted border-slate-200 mb-1.5 opacity-50"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-slate max-w-none w-full text-slate-800
                    prose-headings:text-slate-900 prose-headings:tracking-tight prose-headings:font-bold
                    prose-h1:text-[20px] prose-h1:uppercase prose-h1:tracking-wider prose-h1:border-b prose-h1:border-slate-100 prose-h1:pb-3 prose-h1:mt-12 prose-h1:mb-8 prose-h1:leading-tight
                    prose-h2:text-[16px] prose-h2:text-blue-700/90 prose-h2:mt-10 prose-h2:mb-4 prose-h2:font-bold
                    prose-h3:text-[15px] prose-h3:mt-8 prose-h3:mb-3
                    prose-p:text-sm prose-p:leading-relaxed prose-p:mb-4 prose-p:text-slate-700
                    prose-ul:my-4 prose-li:my-1.5 prose-li:text-slate-700 prose-ul:list-disc
                    prose-strong:font-bold prose-strong:text-slate-900
                    prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
                ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-12 py-10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <span>Generated by AI-SRS Studio</span>
                    <span className="text-slate-200">•</span>
                    <span>{standard}</span>
                </div>
                <div>{date}</div>
            </footer>
        </div>
    );
}

