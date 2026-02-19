"use client";

import { useState, useCallback, useRef } from "react";
import {
    UploadCloud, File as FileIcon, X, CheckCircle,
    AlertTriangle, Lock, Dna, FileCheck2
} from "lucide-react";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface FileUploadProps {
    onFileSelect?: (file: File) => void;
}

interface Toast {
    id: number;
    message: string;
    type: "error" | "success";
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const toastId = useRef(0);

    const showToast = (message: string, type: "error" | "success" = "error") => {
        const id = ++toastId.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const validateFile = (f: File): boolean => {
        if (!f.name.endsWith(".vcf")) {
            showToast("Invalid file format. Only VCF (.vcf) files are accepted.", "error");
            return false;
        }
        if (f.size > MAX_FILE_SIZE_BYTES) {
            showToast(`File exceeds ${MAX_FILE_SIZE_MB}MB size limit (${(f.size / 1024 / 1024).toFixed(1)}MB).`, "error");
            return false;
        }
        if (f.size === 0) {
            showToast("The selected file is empty.", "error");
            return false;
        }
        return true;
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                setFile(droppedFile);
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleUpload = () => {
        if (!file || isUploading) return;
        setIsUploading(true);
        if (onFileSelect) {
            onFileSelect(file);
        }
    };

    const sizePercent = file ? Math.min((file.size / MAX_FILE_SIZE_BYTES) * 100, 100) : 0;
    const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : "0";

    return (
        <div className="w-full max-w-2xl mx-auto relative">
            {/* Toast Notifications */}
            <div className="fixed top-20 right-6 z-[100] space-y-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium shadow-2xl border animate-[slideIn_0.3s_ease-out] ${toast.type === "error"
                                ? "bg-gray-900/95 border-red-500/20 text-red-300"
                                : "bg-gray-900/95 border-emerald-500/20 text-emerald-300"
                            }`}
                        style={{ backdropFilter: "blur(16px)" }}
                    >
                        {toast.type === "error"
                            ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            : <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        }
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Processing State */}
            {isUploading ? (
                <div className="rounded-2xl p-14 text-center animate-[fadeIn_0.3s_ease-out] border border-white/[0.06] bg-white/[0.02]">
                    <div className="relative mx-auto w-16 h-16 mb-8">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin"></div>
                        <div className="absolute inset-2.5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Dna className="w-6 h-6 text-emerald-400 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Parsing Genomic Profile</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                        Extracting pharmacogenomic variants and mapping to CPIC-annotated gene panels...
                    </p>
                </div>
            ) : !file ? (
                /* Upload Drop Zone */
                <div>
                    <div
                        className={`relative rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer border-2 border-dashed ${isDragging
                                ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                                : "border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.02]"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                            accept=".vcf"
                            id="vcf-file-input"
                        />

                        <div className={`mb-5 w-14 h-14 rounded-xl mx-auto flex items-center justify-center transition-colors ${isDragging
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : "bg-white/[0.04] border border-white/[0.08]"
                            }`}>
                            <UploadCloud className={`w-7 h-7 transition-colors ${isDragging ? "text-emerald-400" : "text-gray-400"
                                }`} />
                        </div>

                        <h3 className="text-base font-semibold mb-1.5 text-white">
                            Upload Patient VCF File
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
                            Drop your Variant Call Format file here or click to browse.
                            <br />
                            Supports VCF v4.x specification.
                        </p>

                        <div className="inline-flex items-center gap-4 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
                                <FileCheck2 className="w-3 h-3" />
                                .vcf format
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
                                Max {MAX_FILE_SIZE_MB}MB
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
                                <Lock className="w-3 h-3" />
                                Encrypted
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                /* File Selected / Review State */
                <div className="rounded-2xl p-6 animate-[fadeIn_0.3s_ease-out] border border-white/[0.08] bg-white/[0.02]">
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                <FileIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-semibold text-white text-sm truncate max-w-[260px]">{file.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {fileSizeMB} MB &middot; Variant Call Format
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                            title="Remove file"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Size Meter */}
                    <div className="mb-5">
                        <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1.5">
                            <span>File size</span>
                            <span className="font-mono">{fileSizeMB} / {MAX_FILE_SIZE_MB}.00 MB</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${sizePercent > 90 ? "bg-red-500" : sizePercent > 70 ? "bg-amber-500" : "bg-emerald-500"
                                    }`}
                                style={{ width: `${sizePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Validation Badge */}
                    <div className="flex items-center gap-2 text-[12px] text-emerald-400/80 mb-5 px-3 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>File validated — ready for genomic parsing</span>
                    </div>

                    <button
                        onClick={handleUpload}
                        className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2.5 transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25"
                        id="submit-vcf-btn"
                    >
                        <Dna className="w-4 h-4" />
                        Begin Genomic Analysis
                    </button>
                </div>
            )}
        </div>
    );
}
