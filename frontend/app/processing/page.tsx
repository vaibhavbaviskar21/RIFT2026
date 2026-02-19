"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dna, Loader2 } from "lucide-react";

export default function ProcessingPage() {
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => router.push("/analyze"), 500);
                    return 100;
                }

                // Update status based on progress
                if (prev === 20) setStatus("Parsing VCF File...");
                if (prev === 45) setStatus("Analyzing Variants...");
                if (prev === 70) setStatus("Matching CPIC Guidelines...");
                if (prev === 90) setStatus("Generating Report...");

                return prev + 1;
            });
        }, 50); // 50ms * 100 = 5 seconds total

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-950 text-white relative overflow-hidden">

            {/* Background Pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] animate-pulse-slow"></div>
            </div>

            <div className="relative z-10 text-center">
                <div className="mb-12 relative flex justify-center">
                    {/* DNA Spinner */}
                    <div className="absolute inset-0 animate-spin-slow opacity-30">
                        <div className="w-40 h-40 border border-dashed border-primary rounded-full"></div>
                    </div>

                    <div className="w-40 h-40 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)]">
                        <Dna className="w-20 h-20 text-white animate-pulse" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-4 tracking-tight">Processing Genome</h2>
                <p className="text-primary font-mono mb-8 h-6">{status}</p>

                {/* Progress Bar */}
                <div className="w-80 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 mx-auto">
                    <div
                        className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-100 ease-out shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="mt-2 text-right text-xs text-gray-500 font-mono w-80 mx-auto">{progress}%</p>
            </div>
        </div>
    );
}
