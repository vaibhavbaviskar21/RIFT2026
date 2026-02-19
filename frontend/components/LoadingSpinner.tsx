"use client";

import { Dna } from "lucide-react";

export default function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-[fadeIn_0.5s_ease-out]">
            <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 border-2 border-emerald-500/15 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Dna className="w-8 h-8 text-emerald-400/50 animate-pulse" />
                </div>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">
                Processing Genomic Data
            </h2>
            <p className="text-gray-500 text-sm text-center max-w-sm leading-relaxed">
                Parsing VCF variants, determining diplotypes, and cross-referencing CPIC clinical annotations...
            </p>
        </div>
    );
}
