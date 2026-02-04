import { CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultCard({ result }) {
    if (!result) return null;

    const isPneumonia = result.diagnosis === 'pneumonia';
    const confidencePercent = Math.min(Math.round(result.confidence * 100), 90);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 w-full max-w-2xl mx-auto mt-8"
        >
            <div className="flex items-start md:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Analysis Result</h3>
                    <p className="text-slate-500 text-sm">Based on the provided X-ray scan</p>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${isPneumonia
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                    {isPneumonia ? (
                        <AlertTriangle className="w-5 h-5" />
                    ) : (
                        <CheckCircle className="w-5 h-5" />
                    )}
                    {isPneumonia ? 'Pneumonia Detected' : 'Normal'}
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Confidence Score</span>
                        <span className="text-sm font-bold text-slate-900">{confidencePercent}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidencePercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${isPneumonia ? 'bg-red-500' : 'bg-green-500'
                                }`}
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                        This model is {confidencePercent}% confident in this diagnosis.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
