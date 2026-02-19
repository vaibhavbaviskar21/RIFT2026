"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import FileUpload from "@/components/FileUpload";
import LoadingSpinner from "@/components/LoadingSpinner";
import ResultsComponent from "@/components/ResultsComponent";
import { getToken } from "@/lib/auth";
import { AlertCircle, ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";

type Step = "upload" | "processing" | "results";

/* ── Animated DNA Helix ── */
function DnaHelixAnimation() {
    const pairs = 14;
    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none pointer-events-none">
            {/* Soft glow backdrop */}
            <div className="absolute w-64 h-64 rounded-full bg-primary/8 blur-[80px]"></div>
            <div className="absolute w-40 h-40 rounded-full bg-emerald-500/6 blur-[60px] translate-y-20"></div>

            {/* Helix */}
            <div className="relative" style={{ width: 160, height: 420 }}>
                {Array.from({ length: pairs }).map((_, i) => {
                    const delay = i * 0.18;
                    const yPos = i * 30;
                    return (
                        <div
                            key={i}
                            className="absolute left-0 right-0"
                            style={{
                                top: yPos,
                                animation: `helixRotate 3s ease-in-out ${delay}s infinite alternate`,
                            }}
                        >
                            {/* Left nucleotide */}
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 10,
                                    height: 10,
                                    left: 0,
                                    top: 0,
                                    background: i % 2 === 0 ? "rgba(168, 85, 247, 0.7)" : "rgba(16, 185, 129, 0.7)",
                                    boxShadow: i % 2 === 0
                                        ? "0 0 12px rgba(168, 85, 247, 0.4)"
                                        : "0 0 12px rgba(16, 185, 129, 0.4)",
                                }}
                            />
                            {/* Bridge / base pair line */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2"
                                style={{
                                    left: 10,
                                    right: 10,
                                    height: 1.5,
                                    background: `linear-gradient(90deg, 
                                        ${i % 2 === 0 ? "rgba(168,85,247,0.3)" : "rgba(16,185,129,0.3)"}, 
                                        rgba(255,255,255,0.08), 
                                        ${i % 2 === 0 ? "rgba(16,185,129,0.3)" : "rgba(168,85,247,0.3)"})`,
                                    top: 4,
                                }}
                            />
                            {/* Right nucleotide */}
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 10,
                                    height: 10,
                                    right: 0,
                                    top: 0,
                                    background: i % 2 === 0 ? "rgba(16, 185, 129, 0.7)" : "rgba(168, 85, 247, 0.7)",
                                    boxShadow: i % 2 === 0
                                        ? "0 0 12px rgba(16, 185, 129, 0.4)"
                                        : "0 0 12px rgba(168, 85, 247, 0.4)",
                                }}
                            />
                        </div>
                    );
                })}

                {/* Backbone strands (left + right) */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 420" fill="none" style={{ opacity: 0.15 }}>
                    <path
                        d={Array.from({ length: pairs }).map((_, i) => {
                            const y = i * 30 + 5;
                            const x = 5 + Math.sin(i * 0.8) * 20;
                            return `${i === 0 ? "M" : "S"} ${x},${y} ${x},${y}`;
                        }).join(" ")}
                        stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round"
                    />
                    <path
                        d={Array.from({ length: pairs }).map((_, i) => {
                            const y = i * 30 + 5;
                            const x = 155 - Math.sin(i * 0.8) * 20;
                            return `${i === 0 ? "M" : "S"} ${x},${y} ${x},${y}`;
                        }).join(" ")}
                        stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Floating labels */}
            <div className="absolute top-12 right-8 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-500 font-mono animate-float">
                CYP2D6 · *1/*2
            </div>
            <div className="absolute bottom-16 left-6 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-500 font-mono animate-float" style={{ animationDelay: "2s" }}>
                VKORC1 · A/G
            </div>
            <div className="absolute top-1/2 right-4 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-primary/60 font-mono animate-float" style={{ animationDelay: "3.5s" }}>
                rs1065852
            </div>
        </div>
    );
}

export default function UnifiedAnalysisPage() {
    const [step, setStep] = useState<Step>("upload");
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (file: File) => {
        setError(null);
        setStep("processing");

        try {
            if (!file.name.endsWith(".vcf")) {
                throw new Error("Invalid file type. Please upload a .vcf file.");
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("File size exceeds 5MB limit.");
            }

            const headerCheck = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    const firstLine = text.split("\n")[0].trim();
                    resolve(firstLine);
                };
                reader.onerror = reject;
                reader.readAsText(file.slice(0, 200));
            });

            if (!headerCheck.includes("VCFv4")) {
                throw new Error("Invalid VCF format. File must contain VCFv4.x header.");
            }

            const token = getToken();
            if (!token) {
                throw new Error("Session expired. Please sign in again.");
            }

            const formData = new FormData();
            formData.append("file", file);

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const response = await fetch(`${API_URL}/upload-vcf`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: `Upload failed (${response.status})` }));
                throw new Error(errData.detail || "File processing failed.");
            }

            const data = await response.json();
            setAnalysisResult(data);
            setStep("results");
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            setStep("upload");
        }
    };

    const handleReset = () => {
        setStep("upload");
        setAnalysisResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
            <Navbar />

            <div className="container mx-auto px-6 pt-24 pb-20">

                {/* Upload step — Split layout */}
                {step === "upload" && (
                    <div className="flex items-center min-h-[calc(100vh-12rem)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full max-w-6xl mx-auto">

                            {/* Left: Upload form */}
                            <div className="animate-[fadeIn_0.5s_ease-out]">
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-3">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Genomic Profiling
                                    </div>
                                    <h1 className="text-3xl font-bold mb-2 text-white">Upload Genomic Data</h1>
                                    <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                                        Upload a patient VCF file to extract pharmacogenomic variants and generate
                                        a comprehensive drug interaction risk profile powered by CPIC guidelines.
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15 text-red-400 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <FileUpload onFileSelect={handleSubmit} />

                                {/* Trust signals */}
                                <div className="mt-6 flex items-center gap-4 text-[10px] text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
                                        HIPAA Compliant
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
                                        AES-256 Encrypted
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
                                        CPIC v4.0
                                    </span>
                                </div>
                            </div>

                            {/* Right: DNA Helix Animation */}
                            <div className="hidden lg:block h-[520px] relative">
                                <DnaHelixAnimation />
                            </div>
                        </div>
                    </div>
                )}

                {/* Processing step — Centered */}
                {step === "processing" && (
                    <div className="max-w-4xl mx-auto pt-12 animate-[fadeIn_0.3s_ease-out]">
                        <LoadingSpinner />
                    </div>
                )}

                {/* Results step — Full width */}
                {step === "results" && analysisResult && (
                    <div className="max-w-4xl mx-auto pt-4">
                        <div className="flex items-center justify-between mb-6 animate-[fadeIn_0.3s_ease-out]">
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-sm text-emerald-400/80 hover:text-emerald-300 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                New Analysis
                            </button>
                        </div>
                        <div className="animate-[fadeIn_0.5s_ease-out]">
                            <ResultsComponent data={analysisResult} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
