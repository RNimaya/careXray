import { useRef, useState } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadZone({ onFileSelect, isProcessing }) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const MotionDiv = motion.div;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid image file (JPEG or PNG)');
            return false;
        }
        setError('');
        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                handleFile(file);
            }
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                handleFile(file);
            }
        }
    };

    const handleFile = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            onFileSelect(file, reader.result);
        };
        reader.readAsDataURL(file);
    };

    const clearFile = () => {
        setPreview(null);
        onFileSelect(null, null);
        setError('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <AnimatePresence>
                {preview ? (
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] group"
                    >
                        <div className="aspect-[4/3] overflow-hidden">
                            <img src={preview} alt="X-ray preview" className="w-full h-full object-contain bg-slate-100" />
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                                    <FileImage className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">Image ready for analysis</p>
                                    <p className="text-xs text-slate-500">Review the X-ray preview, then continue below.</p>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button
                                    onClick={clearFile}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </MotionDiv>
                ) : (
                    <div
                        className={`relative rounded-[32px] border p-10 text-center transition-all duration-300 ease-in-out sm:p-14 ${dragActive
                            ? 'border-primary-300 bg-primary-50/70 shadow-[0_26px_60px_-34px_rgba(47,102,246,0.38)] scale-[1.01]'
                            : 'border-slate-200 bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.22)] hover:border-primary-200 hover:shadow-[0_30px_80px_-44px_rgba(47,102,246,0.22)]'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !isProcessing && inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                            accept="image/jpeg, image/png"
                            disabled={isProcessing}
                        />

                        <div className="flex min-h-[290px] flex-col items-center justify-center gap-6 text-slate-500">
                            <div className={`flex h-20 w-20 items-center justify-center rounded-full border ${dragActive
                                ? 'border-primary-200 bg-white text-primary-600'
                                : 'border-white bg-white/90 text-slate-500'
                                } shadow-lg shadow-slate-200/60`}>
                                <Upload className="w-9 h-9" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">Click to upload or drag and drop</p>
                                <p className="mt-2 text-base text-slate-500">Chest X-ray images (JPEG, PNG)</p>
                            </div>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    inputRef.current?.click();
                                }}
                                disabled={isProcessing}
                                className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Browse Files
                            </button>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Fast analysis • Secure upload</p>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {error && (
                <MotionDiv
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600"
                >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </MotionDiv>
            )}
        </div>
    );
}
