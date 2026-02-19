"use client";

import { Dna } from "lucide-react";

export default function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-[fadeIn_0.5s_ease-out]">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Dna className="w-10 h-10 text-primary/50 animate-pulse" />
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Processing Genome
            </h2>
            <p className="text-gray-400 text-center max-w-md">
                Parsing VCF data, identifying variants, and cross-referencing with CPIC guidelines...
            </p>
        </div>
    );
}
