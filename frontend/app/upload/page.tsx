import AuthLayout from "@/components/AuthLayout";
import FileUpload from "@/components/FileUpload";

export default function UploadPage() {
    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Upload Genomic Data</h1>
                <p className="text-gray-400 text-sm">
                    Please upload your patient's VCF file to begin analysis.
                </p>
            </div>

            <FileUpload />

            <p className="mt-8 text-center text-xs text-gray-500 max-w-xs mx-auto">
                Your data is encrypted and processed securely in compliance with HIPAA regulations.
            </p>
        </AuthLayout>
    );
}
