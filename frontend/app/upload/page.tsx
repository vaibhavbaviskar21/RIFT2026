"use client";

import AuthLayout from "@/components/AuthLayout";
import FileUpload from "@/components/FileUpload";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

export default function UploadPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (file: File) => {
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error("Please log in to upload files.");
            }

            const formData = new FormData();
            formData.append("file", file);

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const response = await fetch(`${API_URL}/upload-profile`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: "Upload failed" }));
                throw new Error(errData.detail || "Upload failed");
            }

            // Success — redirect to dashboard
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "An error occurred");
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Upload Genomic Data</h1>
                <p className="text-gray-400 text-sm">
                    Upload your patient&apos;s VCF file to create a genomic profile.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <FileUpload onFileSelect={handleFileSelect} />

            <p className="mt-8 text-center text-xs text-gray-500 max-w-xs mx-auto">
                Your data is encrypted and processed securely in compliance with HIPAA regulations.
            </p>
        </AuthLayout>
    );
}
