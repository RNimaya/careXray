import { useState } from 'react';
import UploadZone from '../components/UploadZone.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { analyzeImage } from '../services/api.js';
import { useAuth } from '../context/AuthContext';
import { Scan, RefreshCw, UserRound } from 'lucide-react';

export default function HomePage() {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [patientId, setPatientId] = useState('');

    const handleFileSelect = (selectedFile, preview) => {
        setFile(selectedFile);
        setFilePreview(preview);
        setResult(null); // Reset result on new file
    };

    const handleScan = async () => {
        if (!file || !patientId.trim()) return;

        setIsProcessing(true);
        try {
            const apiResult = await analyzeImage(file, user.uid, patientId.trim());

            // Map API response to Component state format
            // API: { score: 0.9091, label: "Pneumonia", threshold: 0.5 }
            // Component: { diagnosis: 'pneumonia' | 'normal', confidence: 0.0-1.0 }

            const diagnosis = apiResult.label.toLowerCase(); // "pneumonia" or "normal"
            const confidence = apiResult.score;
            const heatmap_url = apiResult.heatmap_url;

            setResult({
                diagnosis,
                confidence,
                heatmap_url
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
                    <div className="mt-8 flex flex-col items-center gap-4">
                        {/* Patient ID Input */}
                        <div className="w-full max-w-md">
                            <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Patient ID
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserRound className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    id="patientId"
                                    type="text"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    placeholder="Enter patient ID"
                                    disabled={isProcessing}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-60"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={isProcessing || !patientId.trim()}
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
