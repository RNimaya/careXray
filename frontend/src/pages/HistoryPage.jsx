import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHistory } from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, RefreshCw, FileX2, X, UserRound, HelpCircle, Expand } from 'lucide-react';

export default function HistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [expandedImage, setExpandedImage] = useState(null);
    const MotionDiv = motion.div;

    const loadHistory = useCallback(async () => {
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
    }, [user]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Close modal on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key !== 'Escape') return;
            if (expandedImage) {
                setExpandedImage(null);
                return;
            }
            setSelectedItem(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [expandedImage]);

    const getStatusMeta = (diagnosis) => {
        const normalizedDiagnosis = diagnosis?.toLowerCase() || 'unknown';

        if (normalizedDiagnosis === 'pneumonia') {
            return {
                isPneumonia: true,
                isInconclusive: false,
                label: 'Pneumonia',
                resultLabel: 'Pneumonia Detected',
                badgeClass: 'bg-red-50 text-red-700 border border-red-100',
                progressClass: 'bg-red-500',
                Icon: AlertTriangle,
            };
        }

        if (normalizedDiagnosis === 'inconclusive') {
            return {
                isPneumonia: false,
                isInconclusive: true,
                label: 'Inconclusive',
                resultLabel: 'Inconclusive Analysis',
                badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200',
                progressClass: 'bg-slate-400',
                Icon: HelpCircle,
            };
        }

        return {
            isPneumonia: false,
            isInconclusive: false,
            label: 'Normal',
            resultLabel: 'Normal',
            badgeClass: 'bg-green-50 text-green-700 border border-green-100',
            progressClass: 'bg-green-500',
            Icon: CheckCircle,
        };
    };

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
        const status = getStatusMeta(item.diagnosis);
        const confidence = parseFloat(item.confidence || 0);
        let confidencePercent = parseFloat((confidence * 100).toFixed(1));
        if (confidencePercent > 90) confidencePercent = 90;
        
        const rawProb = parseFloat(item.pneumonia_probability || 0);
        const probPercent = parseFloat((rawProb * 100).toFixed(1));
        
        const patientId = item.patient_id || 'N/A';
        return { ...status, confidencePercent, probPercent, patientId };
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
                <MotionDiv
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center"
                >
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileX2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No analyses yet</h3>
                    <p className="text-slate-400 text-sm">Upload an X-ray on the home page to get started.</p>
                </MotionDiv>
            ) : (
                <div className="space-y-4">
                    {history.map((item, index) => {
                        const { confidencePercent, patientId, label, badgeClass, progressClass, Icon } = getItemDetails(item);

                        return (
                            <MotionDiv
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
                                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${badgeClass}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            {label}
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
                                            className={`h-full rounded-full ${progressClass}`}
                                        />
                                    </div>
                                </div>
                            </MotionDiv>
                        );
                    })}
                </div>
            )}

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {selectedItem && (() => {
                    const { confidencePercent, probPercent, patientId, resultLabel, badgeClass, progressClass, Icon, isInconclusive } = getItemDetails(selectedItem);
                    return (
                        <MotionDiv
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={() => setSelectedItem(null)}
                        >
                            <MotionDiv
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
                                    <button
                                        type="button"
                                        className="flex-1 rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] flex items-center justify-center relative group text-left"
                                        onClick={() => selectedItem.image_url && setExpandedImage({ src: selectedItem.image_url, alt: 'Original chest X-ray', label: 'Original Scan' })}
                                    >
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            Original Scan
                                        </div>
                                        {selectedItem.image_url && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                                <Expand className="w-3.5 h-3.5" />
                                                Expand
                                            </div>
                                        )}
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
                                    </button>

                                    {selectedItem.heatmap_url && (
                                        <button
                                            type="button"
                                            className="flex-1 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 aspect-[4/3] flex items-center justify-center relative group text-left"
                                            onClick={() => setExpandedImage({ src: selectedItem.heatmap_url, alt: 'AI heatmap analysis', label: 'AI Heatmap Analysis' })}
                                        >
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                AI Heatmap Analysis
                                            </div>
                                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                                <Expand className="w-3.5 h-3.5" />
                                                Expand
                                            </div>
                                            <img
                                                src={selectedItem.heatmap_url}
                                                alt="AI Heatmap"
                                                className="w-full h-full object-contain"
                                            />
                                        </button>
                                    )}
                                </div>

                                {/* Info Panel */}
                                <div className="p-6 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-slate-900">Analysis Result</h2>
                                        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold ${badgeClass}`}>
                                            <Icon className="w-4 h-4" />
                                            {resultLabel}
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

                                    {/* Confidence & Raw Prob */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-700">Confidence Score</span>
                                                <span className="text-sm font-bold text-slate-900">{confidencePercent}%</span>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <MotionDiv
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${confidencePercent}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full rounded-full ${progressClass}`}
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-slate-400">
                                                The model is {confidencePercent}% confident in this diagnosis.
                                            </p>
                                        </div>

                                        {isInconclusive && (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                                <div>
                                                    <h3 className="text-sm font-semibold text-amber-800">Low confidence detected</h3>
                                                    <p className="mt-1 text-sm text-amber-700">This result falls into an uncertain range and should be reviewed manually.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-500">Raw Pneumonia Probability</span>
                                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{probPercent}%</span>
                                        </div>
                                    </div>
                                </div>
                            </MotionDiv>
                        </MotionDiv>
                    );
                })()}
            </AnimatePresence>

            <AnimatePresence>
                {expandedImage && (
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setExpandedImage(null)}
                    >
                        <MotionDiv
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between gap-4 text-white">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Image Viewer</p>
                                    <h2 className="mt-1 text-lg font-semibold">{expandedImage.label}</h2>
                                </div>
                                <button
                                    onClick={() => setExpandedImage(null)}
                                    className="rounded-full bg-white/10 p-2 text-slate-200 transition-colors hover:bg-white/20 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center">
                                <img
                                    src={expandedImage.src}
                                    alt={expandedImage.alt}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        </MotionDiv>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
}
