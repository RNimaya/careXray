import { useCallback, useState } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadZone({ onFileSelect, isProcessing }) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const validateFile = (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid image file (JPEG or PNG)');
            return false;
        }
        setError('');
        return true;
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                handleFile(file);
            }
        }
    }, []);

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
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <AnimatePresence>
                {preview ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-2xl overflow-hidden shadow-lg bg-black/5 aspect-[4/3] group"
                    >
                        <img src={preview} alt="X-ray preview" className="w-full h-full object-contain" />
                        {!isProcessing && (
                            <button
                                onClick={clearFile}
                                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out text-center ${dragActive
                            ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                            : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleChange}
                            accept="image/jpeg, image/png"
                            disabled={isProcessing}
                        />

                        <div className="flex flex-col items-center justify-center gap-4 text-slate-500">
                            <div className={`p-4 rounded-full ${dragActive ? 'bg-primary-100 text-primary-600' : 'bg-slate-100'}`}>
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg text-slate-700">Click to upload or drag and drop</p>
                                <p className="text-sm mt-1">Chest X-ray images (JPEG, PNG)</p>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-4 text-sm font-medium"
                >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </motion.div>
            )}
        </div>
    );
}
