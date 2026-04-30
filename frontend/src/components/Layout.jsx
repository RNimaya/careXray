import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, Settings, ChevronDown, History, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileModal from './ProfileModal';

export default function Layout() {
    const { user, userData, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isHomePage = pathname === '/';
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navLinkClass = ({ isActive }) =>
        `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isActive
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
            : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
        }`;
    const MotionDiv = motion.div;

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* ── Full-bleed gradient — home page only ── */}
            {isHomePage && (
                <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{
                        height: '52%',
                        minHeight: '420px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #7c3aed 100%)',
                        borderBottomLeftRadius: '50% 36px',
                        borderBottomRightRadius: '50% 36px',
                        overflow: 'hidden',
                        zIndex: 0,
                    }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.22),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.14),transparent_38%)]" />
                    <div className="absolute -left-20 top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute right-10 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                </div>
            )}

            <header className="relative z-40 sticky top-0 px-4 pt-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between rounded-[28px] border border-white/70 bg-white/80 px-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-7">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-white to-violet-100 shadow-inner shadow-white/70 ring-1 ring-primary-100">
                                <Activity className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <span className="block text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                                    CareXray
                                </span>
                                <span className="hidden text-xs font-medium text-slate-400 sm:block">
                                    AI-assisted chest screening
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-2 rounded-full bg-slate-100/80 p-1.5 sm:flex">
                            <NavLink to="/" end className={navLinkClass}>
                                <ScanLine className="w-4 h-4" />
                                Scan
                            </NavLink>
                            <NavLink to="/history" className={navLinkClass}>
                                <History className="w-4 h-4" />
                                History
                            </NavLink>
                        </nav>
                    </div>

                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 rounded-full border border-transparent bg-slate-50/90 px-2 py-2 transition-all hover:border-slate-200 hover:bg-white"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100 text-sm font-bold text-primary-700 ring-4 ring-white">
                                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden text-left md:block">
                                    <p className="text-sm font-semibold text-slate-800 leading-none">
                                        {user.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {userData?.specialization || 'General Practitioner'}
                                    </p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <MotionDiv
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-white/70 bg-white/95 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
                                    >
                                        <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                                            <p className="text-sm font-semibold text-slate-900">{user.displayName}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>

                                        <div className="px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Account</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-800">{user.displayName || 'User'}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setIsProfileOpen(true);
                                            }}
                                            className="mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                                        >
                                            <Settings className="w-4 h-4" />
                                            My Profile
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="mx-2 mt-1 flex w-[calc(100%-1rem)] items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Log Out
                                        </button>
                                    </MotionDiv>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </header>

            <main className="relative flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-7xl">
                    <Outlet />
                </div>
            </main>

            <footer className="px-4 pb-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 rounded-[28px] border border-white/70 bg-white/75 px-6 py-5 text-center shadow-[0_18px_48px_-36px_rgba(15,23,42,0.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:text-left">
                    <p className="text-sm font-medium text-slate-500">
                        CareXray - Automatic Pneumonia Detection
                    </p>
                    <p className="text-sm text-slate-400">
                        © {new Date().getFullYear()} CareXray
                    </p>
                </div>
            </footer>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    );
}
