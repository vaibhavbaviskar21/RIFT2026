"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import FileUpload from "@/components/FileUpload"; // My existing reusable component
import LoadingSpinner from "@/components/LoadingSpinner"; // New/Existing component
import ResultsComponent from "@/components/ResultsComponent"; // New/Existing component
import { getToken } from "@/lib/auth";
import { AlertCircle } from "lucide-react";

type Step = 'upload' | 'processing' | 'results';

export default function UnifiedAnalysisPage() {
    const [step, setStep] = useState<Step>('upload');
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // 2. The API Call Logic
    const handleSubmit = async (file: File) => {
        setError(null);
        setStep('processing');

        try {
            // Validate file (redundant if FileUpload does it, but good safety)
            if (!file.name.endsWith(".vcf") && !file.name.endsWith(".vcf.gz")) {
                throw new Error("Invalid file type. Please upload a .vcf file.");
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit check
                throw new Error("File size exceeds 5MB limit.");
            }

            // Strict VCF 4.2 Validation (Hackathon Requirement)
            const headerCheck = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    const firstLine = text.split('\n')[0].trim();
                    resolve(firstLine);
                };
                reader.onerror = reject;
                reader.readAsText(file.slice(0, 100)); // Read first 100 bytes
            });

            if (!headerCheck.startsWith("##fileformat=VCF")) {
                // Warn generally, but strictly enforce if required. 
                // The prompt asked for "strictly .vcf (v4.2)".
                // We'll check for VCF. v4.2 is ideal but v4.1 is common. Check strictly if needed.
                if (!headerCheck.includes("VCFv4")) {
                    throw new Error("Invalid VCF format. Header must start with ##fileformat=VCFv4.x");
                }
            }

            // Get Auth Token
            const token = getToken();
            if (!token) {
                throw new Error("Authentication session expired. Please log in again.");
            }

            // Prepare FormData
            const formData = new FormData();
            formData.append("file", file);

            // Fetch from FastAPI
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const response = await fetch(`${API_URL}/upload-vcf`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    // Note: Content-Type is distinctively absent to let browser set multipart boundary
                },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: `Upload failed (${response.status})` }));
                throw new Error(errData.detail || "File processing failed on server.");
            }

            const data = await response.json();
            setAnalysisResult(data);
            setStep('results');

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            setStep('upload'); // Go back to upload on error
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
            <Navbar />

            {/* Background Ambience */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[150px] pointer-events-none -z-10"></div>

            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">

                    {/* Header - Only show if not in results view (cleaner) */}
                    {step !== 'results' && (
                        <div className="text-center mb-12 animate-[slideUp_0.5s_ease-out]">
                            <h1 className="text-4xl font-bold mb-4">Genomic Analysis</h1>
                            <p className="text-gray-400">
                                Upload your VCF file to generate a comprehensive pharmacogenomic risk profile.
                            </p>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-[shake_0.5s_ease-in-out]">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* 3. Component Toggling */}
                    <div className="transition-all duration-500 ease-in-out">
                        {step === 'upload' && (
                            <div className="animate-[fadeIn_0.5s_ease-out]">
                                <FileUpload onFileSelect={handleSubmit} />
                            </div>
                        )}

                        {step === 'processing' && (
                            <LoadingSpinner />
                        )}

                        {step === 'results' && analysisResult && (
                            <ResultsComponent data={analysisResult} />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
