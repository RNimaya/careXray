import { useState } from 'react';
import UploadZone from '../components/UploadZone.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { analyzeImage } from '../services/api.js';
import { Scan, RefreshCw } from 'lucide-react';

export default function HomePage() {
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = (selectedFile, preview) => {
        setFile(selectedFile);
        setFilePreview(preview);
        setResult(null); // Reset result on new file
    };

    const handleScan = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const apiResult = await analyzeImage(file);

            // Map API response to Component state format
            // API: { score: 0.9091, label: "Pneumonia", threshold: 0.5 }
            // Component: { diagnosis: 'pneumonia' | 'normal', confidence: 0.0-1.0 }

            const diagnosis = apiResult.label.toLowerCase(); // "pneumonia" or "normal"
            const confidence = apiResult.score;

            setResult({
                diagnosis,
                confidence
            });
        } catch (error) {
            console.error("Detection failed", error);
            // Optionally set an error state here to show in UI
            alert("Failed to analyze image. Please try again. Ensure backend is running.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Pneumonia Detection</h1>
                <p className="text-slate-500">Upload a chest X-ray image to get an instant analysis</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
                <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

                {file && !result && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleScan}
                            disabled={isProcessing}
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed min-w-[200px] justify-center text-lg"
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Scan className="w-5 h-5" />
                                    Start Scanning
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {result && <ResultCard result={result} />}
        </div>
    );
}
