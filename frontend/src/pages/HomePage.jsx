import { useState } from 'react';
import UploadZone from '../components/UploadZone.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { analyzeImage } from '../services/api.js';
import { useAuth } from '../context/AuthContext';
import { Scan, RefreshCw, UserRound, ShieldCheck, BrainCircuit, Clock3, BadgeCheck } from 'lucide-react';

export default function HomePage() {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [patientId, setPatientId] = useState('');

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
    };

    const handleScan = async () => {
        if (!file || !patientId.trim()) return;

        setIsProcessing(true);
        try {
            const apiResult = await analyzeImage(file, user.uid, patientId.trim());

            // Map API response to Component state format
            // API: { score: 0.9091, label: "Pneumonia", threshold: 0.5 }
            // Component: { diagnosis: 'pneumonia' | 'normal', confidence: 0.0-1.0 }

            const diagnosis = apiResult.label ? apiResult.label.toLowerCase() : 'unknown';
            const confidence = apiResult.confidence || 0;
            const pneumonia_probability = apiResult.pneumonia_probability || 0;
            const low_confidence = apiResult.low_confidence || false;
            const heatmap_url = apiResult.heatmap_url;

            setResult({
                diagnosis,
                confidence,
                pneumonia_probability,
                low_confidence,
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

    const stats = [
        { value: '10K+', label: 'Analyses Done', icon: BrainCircuit },
        { value: '98.5%', label: 'Accuracy', icon: BadgeCheck },
        { value: '24/7', label: 'Available', icon: Clock3 },
        { value: 'Secure', label: 'HIPAA Ready', icon: ShieldCheck },
    ];

    return (
        <div className="relative mx-auto max-w-[980px] pb-12 pt-8 sm:pt-10">
            {/* Hero text — sits on the gradient section */}
            <div className="mx-auto max-w-3xl text-center text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur">
                    AI-assisted radiology workflow
                </div>
                <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Pneumonia Detection
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 sm:text-base">
                    Upload a chest X-ray image for fast, modern screening support with a cleaner workflow for clinicians.
                </p>
            </div>

            {/* Upload card — bridges the split boundary */}
            <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
                <div className="rounded-[34px] bg-white p-5 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.28),0_0_0_1px_rgba(15,23,42,0.04)] sm:p-7 md:p-8">
                    <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

                    <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                        <div className="w-full">
                            <label htmlFor="patientId" className="mb-2 block text-sm font-semibold text-slate-700">
                                Patient ID
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <UserRound className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    id="patientId"
                                    type="text"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    placeholder="Enter patient ID"
                                    disabled={isProcessing}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={isProcessing || !file || !patientId.trim()}
                            className="inline-flex min-h-[58px] min-w-[220px] items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                </div>
            </div>

            {result && (
                <div className="mt-8">
                    <ResultCard result={result} embedded />
                </div>
            )}

            <div className="mt-8 grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:p-2">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="flex items-center gap-4 rounded-[22px] bg-white px-5 py-4 shadow-sm lg:rounded-none lg:bg-transparent lg:px-6 lg:py-5 lg:shadow-none lg:border-r lg:border-slate-200 lg:last:border-r-0"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold tracking-tight text-primary-600">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

}
