import AuthForms from '../components/AuthForms';
import { Activity } from 'lucide-react';

export default function AuthPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-2xl mb-4">
                    <Activity className="w-10 h-10 text-primary-600" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">CareXray</h1>
                <p className="text-slate-500 mt-2">Automatic Pneumonia Detection System</p>
            </div>
            <AuthForms />
        </div>
    );
}
