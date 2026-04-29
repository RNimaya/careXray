import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultCard({ result, embedded = false }) {
    if (!result) return null;

    const isPneumonia = result.diagnosis === 'pneumonia';
    const isNormal = result.diagnosis === 'normal';
    const displayDiagnosis = result.diagnosis ? `${result.diagnosis.charAt(0).toUpperCase()}${result.diagnosis.slice(1)}` : 'Unknown';

    let confidencePercent = parseFloat((result.confidence * 100).toFixed(1));
    if (confidencePercent > 90) confidencePercent = 90.0;
    const probPercent = parseFloat(((result.pneumonia_probability || 0) * 100).toFixed(1));
    const MotionDiv = motion.div;

    let badgeClass = 'bg-slate-50 text-slate-700 border border-slate-200';
    let badgeText = 'Inconclusive';
    let progressColor = 'bg-slate-400';
    
    if (isPneumonia) {
        badgeClass = 'bg-red-50 text-red-700 border border-red-100';
        badgeText = 'Pneumonia Detected';
        progressColor = 'bg-red-500';
    } else if (isNormal) {
        badgeClass = 'bg-green-50 text-green-700 border border-green-100';
        badgeText = 'Normal';
        progressColor = 'bg-green-500';
    }

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={embedded
                ? "relative w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.24)] md:p-8"
                : "relative mx-auto mt-10 w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-8"
            }
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,124,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.12),transparent_24%)]" />

            <div className="relative flex flex-col gap-8 lg:flex-row">
                <div className="flex-1">
                    <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 xl:max-w-[34rem]">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">Analysis Result</p>
                            <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">AI interpretation complete</h3>
                            <p className="mt-2 text-sm text-slate-500">Based on the provided chest X-ray and current model confidence.</p>
                        </div>
                        <div className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-4 py-2 font-semibold ${badgeClass}`}>
                            {isPneumonia ? (
                                <AlertTriangle className="w-5 h-5" />
                            ) : isNormal ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <HelpCircle className="w-5 h-5" />
                            )}
                            {badgeText}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                            <p className="text-sm font-medium text-slate-500">Confidence Score</p>
                            <div className="mt-4">
                                <p className="text-4xl font-bold leading-none tracking-tight text-slate-900">{confidencePercent}%</p>
                                <div className={`mt-3 w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                    {isPneumonia ? 'Flagged' : isNormal ? 'Clear' : 'Review'}
                                </div>
                            </div>
                            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                                <MotionDiv
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidencePercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${progressColor}`}
                                />
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                This score reflects how strongly the model supports the predicted class.
                            </p>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Pneumonia Probability</p>
                            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{probPercent}%</p>
                            <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Model Output</span>
                                <span className="text-sm font-semibold text-slate-700 sm:text-right">{displayDiagnosis}</span>
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                Use this value alongside the clinical context and radiologist review.
                            </p>
                        </div>
                    </div>

                    {result.low_confidence && (
                        <div className="mt-4 flex items-start gap-3 rounded-[28px] border border-amber-200 bg-amber-50/80 p-5">
                            <AlertTriangle className="mt-0.5 w-5 h-5 text-amber-600" />
                            <div>
                                <h4 className="text-sm font-semibold text-amber-800">Low confidence detected</h4>
                                <p className="mt-1 text-sm text-amber-700">The model output falls into an uncertain range, so a manual review is recommended.</p>
                            </div>
                        </div>
                    )}
                </div>

                {result.heatmap_url && (
                    <div className="relative lg:w-[360px] lg:flex-shrink-0">
                        <div className="sticky top-28 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">AI Heatmap</h4>
                            <p className="mt-2 text-sm text-slate-600">Highlighted regions indicate where the model focused most strongly.</p>
                            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                                <img
                                    src={result.heatmap_url}
                                    alt="Grad-CAM Analysis Overlay"
                                    className="w-full h-auto object-contain max-h-[400px]"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!result.heatmap_url && (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-6 lg:w-[320px] lg:flex-shrink-0">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">AI Heatmap</h4>
                        <p className="mt-3 text-sm text-slate-500">
                            A Grad-CAM overlay was not returned for this scan, but the diagnosis metrics above are still available.
                        </p>
                    </div>
                )}
            </div>
        </MotionDiv>
    );
}
