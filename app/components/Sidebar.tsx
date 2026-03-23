"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../utils/supabaseClient';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        async function fetchProjects() {
            if (!user) return;
            const { data, error } = await supabase
                .from('projects')
                .select('id, title, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data && !error) {
                setProjects(data);
            }
        }
        fetchProjects();
    }, [user]);

    const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setProjectToDelete(projectId);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectToDelete);

            if (error) throw error;

            setProjects(prev => prev.filter(p => p.id !== projectToDelete));
            setProjectToDelete(null);
        } catch (err) {
            console.error("Failed to delete project:", err);
            alert("Failed to delete project. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Sidebar Background Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col p-4 
                shadow-2xl transition-transform duration-300 ease-in-out
                md:shadow-[1px_0_20px_rgba(0,0,0,0.02)] md:border-r md:border-slate-200 md:z-10 shrink-0
                md:sticky md:top-[73px] md:h-[calc(100vh-73px)] md:overflow-hidden md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Mobile Close Button Container */}
                <div className="flex justify-between items-center md:hidden mb-6 px-2 mt-2">
                    <span className="font-bold text-slate-800 text-lg tracking-tight">Menu</span>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-1.5 mb-8 md:mt-2 text-sm shrink-0">
                    <Link href="/Generate" className="block" onClick={() => setIsOpen(false)}>
                        <button className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-colors ${pathname === '/Generate' ? 'text-blue-700 bg-blue-50 border border-blue-100/50 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'}`}>
                            <span className={`${pathname === '/Generate' ? 'bg-blue-100/80 text-blue-700' : 'text-slate-400'} p-1.5 rounded-lg`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </span>
                            New Document
                        </button>
                    </Link>
                    <Link href="/Evaluate" className="block" onClick={() => setIsOpen(false)}>
                        <button className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors border ${pathname === '/Evaluate' ? 'text-blue-700 bg-blue-50 border-blue-100/50 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'}`}>
                            <span className={`${pathname === '/Evaluate' ? 'bg-blue-100/80 text-blue-700' : 'text-slate-400'} p-1.5 rounded-lg`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            Evaluate Document
                        </button>
                    </Link>
                </div>

                {/* Previous Prompts List */}
                {user && projects.length > 0 && (
                    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col pr-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                        <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 shrink-0">Previous Prompts</h3>
                        <div className="space-y-1">
                            {projects.map(p => (
                                <div key={p.id} className="relative group px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 flex items-center justify-between overflow-hidden">
                                    <Link href={`/Evaluate?projectId=${p.id}`} className="block flex-1 min-w-0" onClick={() => setIsOpen(false)}>
                                        <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors capitalize pr-2">{p.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                                    </Link>
                                    <button
                                        onClick={(e) => handleDeleteProject(e, p.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0"
                                        title="Delete Prompt"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {user && projects.length === 0 && (
                    <div className="px-3 py-4 text-center border border-slate-100 bg-slate-50/50 rounded-xl">
                        <p className="text-xs text-slate-500 font-medium">No previous prompts yet.</p>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {projectToDelete && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all" onClick={() => setProjectToDelete(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Prompt?</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">Are you sure you want to delete this prompt? This action cannot be undone and will delete all associated evaluations.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setProjectToDelete(null)}
                                disabled={isDeleting}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors min-w-[100px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center min-w-[100px] shadow-sm shadow-red-600/20"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
