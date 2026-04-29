import AuthForms from '../components/AuthForms';
import { Activity } from 'lucide-react';

export default function AuthPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,124,255,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(180deg,rgba(255,255,255,0.7),transparent_92%)]" />

            <div className="relative w-full max-w-3xl text-center">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center rounded-3xl bg-white/85 p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] ring-1 ring-white/70 backdrop-blur">
                        <Activity className="w-9 h-9 text-primary-600" />
                    </div>
                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
                        Automatic Pneumonia Detection System
                    </p>
                    <h1 className="mt-4 inline-block bg-gradient-to-r from-sky-500 via-blue-600 to-violet-500 bg-clip-text pb-1 text-4xl font-extrabold leading-[1.15] tracking-tight text-transparent drop-shadow-sm sm:text-5xl">
                        CareXray
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-base text-slate-500 sm:text-lg">
                        A cleaner sign-in experience for clinicians reviewing chest X-ray analyses.
                    </p>
                </div>

                <AuthForms />
            </div>
        </div>
    );
}
