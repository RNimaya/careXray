import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHistory } from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, RefreshCw, FileX2, X, UserRound } from 'lucide-react';

export default function HistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const loadHistory = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchHistory(user.uid);
            setHistory(data.history || []);
        } catch (err) {
            console.error("Failed to load history", err);
            setError("Failed to load analysis history. Please ensure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [user]);

    // Close modal on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') setSelectedItem(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const getItemDetails = (item) => {
        const isPneumonia = item.diagnosis?.toLowerCase() === 'pneumonia';
        const confidence = parseFloat(item.confidence);
        const confidencePercent = Math.min(Math.round(confidence * 100), 90);
        const patientId = item.patient_id || 'N/A';
        return { isPneumonia, confidencePercent, patientId };
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading your analysis history…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-20">
                    <div className="bg-red-50 text-red-700 p-6 rounded-2xl inline-block">
                        <p className="font-semibold">{error}</p>
                        <button
                            onClick={loadHistory}
                            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">Analysis History</h1>
                    <p className="text-slate-500">View your past X-ray analyses</p>
                </div>
                <button
                    onClick={loadHistory}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {history.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center"
                >
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileX2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No analyses yet</h3>
                    <p className="text-slate-400 text-sm">Upload an X-ray on the home page to get started.</p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {history.map((item, index) => {
                        const { isPneumonia, confidencePercent, patientId } = getItemDetails(item);

                        return (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center cursor-pointer hover:shadow-md hover:border-primary-100 transition-all"
                                onClick={() => setSelectedItem(item)}
                            >
                                {/* X-ray Thumbnail */}
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt="X-ray"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <FileX2 className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${isPneumonia
                                            ? 'bg-red-50 text-red-700 border border-red-100'
                                            : 'bg-green-50 text-green-700 border border-green-100'
                                            }`}>
                                            {isPneumonia ? (
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                            ) : (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            )}
                                            {isPneumonia ? 'Pneumonia' : 'Normal'}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <UserRound className="w-3.5 h-3.5" />
                                            ID: <span className="font-semibold text-slate-700">{patientId}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDate(item.date)}
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            Confidence: {confidencePercent}%
                                        </span>
                                    </div>

                                    {/* Confidence bar */}
                                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${confidencePercent}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                                            className={`h-full rounded-full ${isPneumonia ? 'bg-red-500' : 'bg-green-500'}`}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {selectedItem && (() => {
                    const { isPneumonia, confidencePercent, patientId } = getItemDetails(selectedItem);
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={() => setSelectedItem(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <div className="flex justify-end p-4 pb-0">
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Image */}
                                <div className="px-6 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] flex items-center justify-center relative group">
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            Original Scan
                                        </div>
                                        {selectedItem.image_url ? (
                                            <img
                                                src={selectedItem.image_url}
                                                alt="X-ray full view"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <FileX2 className="w-12 h-12 mb-2" />
                                                <p className="text-sm">Image unavailable</p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedItem.heatmap_url && (
                                        <div className="flex-1 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 aspect-[4/3] flex items-center justify-center relative group">
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                AI Heatmap Analysis
                                            </div>
                                            <img
                                                src={selectedItem.heatmap_url}
                                                alt="AI Heatmap"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Info Panel */}
                                <div className="p-6 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-slate-900">Analysis Result</h2>
                                        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold ${isPneumonia
                                            ? 'bg-red-50 text-red-700 border border-red-100'
                                            : 'bg-green-50 text-green-700 border border-green-100'
                                            }`}>
                                            {isPneumonia ? (
                                                <AlertTriangle className="w-4 h-4" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            {isPneumonia ? 'Pneumonia Detected' : 'Normal'}
                                        </div>
                                    </div>

                                    {/* Patient ID & Date */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <UserRound className="w-4 h-4" />
                                            <span>Patient ID: <span className="font-semibold text-slate-700">{patientId}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {formatDate(selectedItem.date)}
                                        </div>
                                    </div>

                                    {/* Confidence */}
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Confidence Score</span>
                                            <span className="text-sm font-bold text-slate-900">{confidencePercent}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${confidencePercent}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${isPneumonia ? 'bg-red-500' : 'bg-green-500'}`}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-400">
                                            The model is {confidencePercent}% confident in this diagnosis.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
