import Link from "next/link";
import { Dna } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-black transition-all duration-300">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                        <Dna className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">PharmaGuard</span>
                </Link>

                {/* Links (Hidden on mobile for now, can be expanded) */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link href="#" className="hover:text-white transition-colors">Solutions</Link>
                    <Link href="#" className="hover:text-white transition-colors">Research</Link>
                    <Link href="#" className="hover:text-white transition-colors">About</Link>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-4">
                    <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white hidden sm:block">Log In</Link>
                    <Link
                        href="/analyze"
                        className="px-6 py-2.5 rounded-full text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]"
                    >
                        Start Analysis
                    </Link>
                </div>
            </div>
        </nav>
    );
}
