import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Loader, Stethoscope } from 'lucide-react';

export default function AuthForms() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', specialization: 'General Practitioner' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                // Password Validation
                if (formData.password.length < 8 || !/\d/.test(formData.password)) {
                    setError('Password must be at least 8 characters long and include at least one number.');
                    setIsSubmitting(false);
                    return;
                }
                await register(formData.name, formData.email, formData.password, formData.specialization);
            }
            navigate('/');
        } catch (err) {
            setError('Authentication failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-500">
                    {isLogin
                        ? 'Enter your credentials to access your dashboard'
                        : 'Sign up to start analyzing chest X-rays'
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-slate-400"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                )}

                {!isLogin && (
                    <div className="relative">
                        <Stethoscope className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-600 bg-white"
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        >
                            <option value="General Practitioner">General Practitioner</option>
                            <option value="Radiologist">Radiologist</option>
                            <option value="Pulmonologist">Pulmonologist</option>
                            <option value="Medical Student">Medical Student</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-slate-400"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-slate-400"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {isLogin ? 'Log In' : 'Create Account'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-slate-500 hover:text-primary-600 font-medium transition-colors text-sm"
                >
                    {isLogin
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Sign in"
                    }
                </button>
            </div>
        </div>
    );
}
