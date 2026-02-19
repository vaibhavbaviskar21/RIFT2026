"use client";

import { useState, useCallback } from "react";
import { UploadCloud, File, X, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function FileUpload() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            if (droppedFile.name.endsWith(".vcf") || droppedFile.name.endsWith(".vcf.gz")) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError("Please upload a valid .vcf file");
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authFetch("/upload-vcf", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: "Upload failed" }));
                throw new Error(err.detail || "Upload failed");
            }

            router.push("/analyze");
        } catch (err: any) {
            setError(err.message || "Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            {!file ? (
                <div
                    className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${isDragging
                            ? "border-primary bg-primary/10 scale-[1.02]"
                            : "border-white/20 hover:border-white/40 hover:bg-white/5"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                        accept=".vcf,.vcf.gz"
                    />
                    <div className="mb-4 p-4 rounded-full bg-white/5 w-fit mx-auto border border-white/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]">
                        <UploadCloud className={`w-10 h-10 ${isDragging ? "text-primary" : "text-gray-400"} transition-colors`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Upload Genome File</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Drag & drop your VCF file here, or click to browse.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500 font-mono">.vcf</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500 font-mono">.vcf.gz</span>
                    </div>
                </div>
            ) : (
                <div className="glass-card rounded-2xl p-6 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <File className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white max-w-[200px] truncate">{file.name}</h4>
                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={removeFile} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-success">
                            <CheckCircle className="w-4 h-4" />
                            <span>File validated successfully</span>
                        </div>
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            variant="glow"
                            size="lg"
                            className="w-full"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Process Genome"
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
