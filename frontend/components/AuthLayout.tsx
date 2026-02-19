import Link from "next/link";
import { Dna } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden auth-bg bg-gray-950">

            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] animate-pulse-slow delay-1000"></div>

            {/* Navbar Minimal */}
            <nav className="absolute top-0 left-0 w-full p-6 z-50">
                <div className="container mx-auto">
                    <Link href="/" className="flex items-center gap-2 group w-fit">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors backdrop-blur-sm">
                            <Dna className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">PharmaGuard</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <div className="w-full max-w-md p-6 relative z-10">
                <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
                    {children}
                </div>
            </div>

        </div>
    );
}
