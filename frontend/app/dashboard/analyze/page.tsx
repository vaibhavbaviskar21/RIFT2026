"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import FileUpload from "@/components/FileUpload";
import LoadingSpinner from "@/components/LoadingSpinner";
import ResultsComponent from "@/components/ResultsComponent";
import { getToken } from "@/lib/auth";
import { AlertCircle, ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";

type Step = "upload" | "processing" | "results";

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
        <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
            <Navbar />

            <div className="container mx-auto px-6 pt-24 pb-20">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    {step !== "results" && (
                        <div className="mb-10 pt-4 animate-[fadeIn_0.5s_ease-out]">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-3">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Genomic Profiling
                            </div>
                            <h1 className="text-2xl font-bold mb-1.5 text-white">Upload &amp; Analyze</h1>
                            <p className="text-sm text-gray-500">
                                Upload a patient VCF file to generate a comprehensive pharmacogenomic risk profile.
                            </p>
                        </div>
                    )}

                    {/* Results Header with Reset */}
                    {step === "results" && (
                        <div className="flex items-center justify-between mb-6 pt-4 animate-[fadeIn_0.3s_ease-out]">
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
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15 text-red-400 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Step Views */}
                    <div className="transition-all duration-300">
                        {step === "upload" && (
                            <div className="animate-[fadeIn_0.5s_ease-out]">
                                <FileUpload onFileSelect={handleSubmit} />
                            </div>
                        )}

                        {step === "processing" && (
                            <div className="animate-[fadeIn_0.3s_ease-out]">
                                <LoadingSpinner />
                            </div>
                        )}

                        {step === "results" && analysisResult && (
                            <div className="animate-[fadeIn_0.5s_ease-out]">
                                <ResultsComponent data={analysisResult} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
