import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Loader, Stethoscope, ChevronDown } from 'lucide-react';

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
        } catch {
            setError('Authentication failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClassName = 'w-full rounded-[22px] border border-slate-200 bg-white py-4 pl-14 pr-4 text-lg text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100';
    const iconClassName = 'pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400';

    return (
        <div className="mx-auto w-full max-w-4xl rounded-[40px] border border-white/80 bg-white/92 px-6 py-8 shadow-[0_36px_90px_-46px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-10 sm:py-10">
            <div className="mx-auto max-w-3xl text-center mb-10">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-4 text-lg text-slate-500">
                    {isLogin
                        ? 'Enter your credentials to access your dashboard'
                        : 'Sign up to start analyzing chest X-rays'
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
                {!isLogin && (
                    <div className="relative">
                        <User className={iconClassName} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            className={inputClassName}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                )}

                {!isLogin && (
                    <div className="relative">
                        <Stethoscope className={iconClassName} />
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <select
                            className={`${inputClassName} appearance-none pr-14 text-slate-600`}
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
                    <Mail className={iconClassName} />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className={inputClassName}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className={iconClassName} />
                    <input
                        type="password"
                        placeholder="Password"
                        className={inputClassName}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                {error && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-500">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-3 rounded-[22px] bg-primary-600 px-6 py-5 text-xl font-semibold text-white shadow-[0_24px_60px_-24px_rgba(47,102,246,0.55)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
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

            <div className="mt-8 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-lg font-medium text-slate-500 transition-colors hover:text-primary-600"
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
