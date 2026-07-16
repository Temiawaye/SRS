'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Markdown } from 'tiptap-markdown';
import { useEffect } from 'react';
import './tiptap-editor.css';

interface TiptapEditorProps {
    content: string;
    editable?: boolean;
    onChange?: (markdown: string) => void;
    // Document metadata for the header (view mode only)
    title?: string;
    documentType?: string;
    targetAudience?: string;
    version?: string;
    status?: string;
    date?: string;
}

// Minimal formatting toolbar shown only in edit mode
function Toolbar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    const btn = (active: boolean, onClick: () => void, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={label}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                active
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
            {icon}
        </button>
    );

    return (
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex-wrap bg-slate-50/80 dark:bg-slate-900/80">
            {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <b>B</b>)}
            {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <i>I</i>)}
            {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Heading 1', <span>H1</span>)}
            {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', <span>H2</span>)}
            {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', <span>H3</span>)}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet List',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
            )}
            {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Ordered List',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="10" fontSize="9" fill="currentColor" stroke="none">1.</text><text x="2" y="22" fontSize="9" fill="currentColor" stroke="none">2.</text></svg>
            )}
            {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            )}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), 'Inline Code',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            )}
            {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), 'Code Block',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 10l-3 2 3 2M16 10l3 2-3 2M12 8l-2 8"/></svg>
            )}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            {btn(false, () => editor.chain().focus().undo().run(), 'Undo',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            )}
            {btn(false, () => editor.chain().focus().redo().run(), 'Redo',
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
            )}
        </div>
    );
}

export default function TiptapEditor({
    content,
    editable = false,
    onChange,
    title = 'Untitled Project',
    documentType = 'Software Requirements Specification (SRS)',
    targetAudience = 'Stakeholders',
    version = '1.0',
    status = 'Draft',
    date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
}: TiptapEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit,
            Typography,
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({ placeholder: 'Start editing your document…' }),
            Markdown.configure({
                html: false,
                transformCopiedText: true,
                transformPastedText: true,
            }),
        ],
        content: content || '',
        editable,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content focus:outline-none',
            },
        },
        onUpdate({ editor }) {
            if (onChange) {
                const md = (editor.storage as any).markdown?.getMarkdown?.() ?? '';
                onChange(md);
            }
        },
    });

    // Sync content when it changes externally (e.g., new generation)
    useEffect(() => {
        if (!editor) return;
        const currentMd = (editor.storage as any).markdown?.getMarkdown?.() ?? '';
        if (content !== currentMd) {
            editor.commands.setContent(content || '');
        }
    }, [content, editor]);

    // Sync editable flag
    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editable, editor]);

    const standard = 'IEEE Std 830-1998';

    return (
        <div className="tiptap-wrapper bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans max-w-[900px] mx-auto shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">

            {/* Document header — always shown */}
            <header className="px-12 py-8 flex justify-between items-center text-[11px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <span>PRD STUDIO</span>
                {editable
                    ? <span className="text-slate-600 dark:text-slate-400">EDIT MODE</span>
                    : <span className="text-slate-500 dark:text-slate-400">CONFIDENTIAL DRAFT</span>
                }
            </header>

            {!editable && (
                <div className="flex-1 px-10 md:px-16 py-8">
                    {/* Document title */}
                    <div className="mb-10">
                        <h2 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase mb-2">
                            {documentType.replace(/\s*\(.*\)$/g, '')}
                        </h2>
                        <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight capitalize leading-tight">{title}</p>
                    </div>

                    {/* Metadata table */}
                    <div className="mb-10 border-t border-slate-100 dark:border-slate-800 font-medium">
                        <table className="w-full text-xs border-collapse">
                            <tbody>
                                {[
                                    { label: 'Document Type', value: documentType },
                                    { label: 'Version', value: version },
                                    { label: 'Status', value: status },
                                    { label: 'Date', value: date },
                                    { label: 'Target Audience', value: targetAudience },
                                    { label: 'Prepared By', value: 'Generated by PRD Studio' },
                                    { label: 'Standard', value: standard },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <td className="py-2.5 w-1/3 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">{row.label}</td>
                                        <td className="py-2.5 text-slate-700 dark:text-slate-300 font-bold">{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="h-px w-full bg-black dark:bg-slate-300 mb-10" />
                </div>
            )}

            {/* Edit mode toolbar */}
            {editable && <Toolbar editor={editor} />}

            {/* Tiptap content area */}
            <div className={editable
                ? 'px-6 py-4 min-h-[600px]'
                : '-mt-4 px-10 md:px-16 pb-8'
            }>
                <EditorContent editor={editor} />
            </div>

            {/* Footer — view mode only */}
            {!editable && (
                <footer className="px-12 py-10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex items-center gap-3">
                        <span>Generated by AI-PRD Studio</span>
                        <span className="text-slate-200 dark:text-slate-700">•</span>
                        <span>{standard}</span>
                    </div>
                    <div>{date}</div>
                </footer>
            )}
        </div>
    );
}
