import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Lock, Trash2, Save, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileModal({ isOpen, onClose }) {
    const { user, userData, updateUserProfile, changePassword, deleteAccount } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        specialization: ''
    });
    const [passData, setPassData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user && userData) {
            setFormData({
                name: user.displayName || '',
                username: userData.username || '',
                specialization: userData.specialization || ''
            });
        }
    }, [user, userData, isOpen]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await updateUserProfile(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await changePassword(passData.newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPassData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to change password. ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            setLoading(true);
            try {
                await deleteAccount();
                // AuthContext will handle redirect on user null
                onClose();
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to delete account. ' + error.message });
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">Account Settings</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button
                            onClick={() => { setActiveTab('general'); setMessage({ type: '', text: '' }); }}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'general' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <User className="w-4 h-4" /> General
                        </button>
                        <button
                            onClick={() => { setActiveTab('security'); setMessage({ type: '', text: '' }); }}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'security' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Lock className="w-4 h-4" /> Security
                        </button>
                        <button
                            onClick={() => { setActiveTab('danger'); setMessage({ type: '', text: '' }); }}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'danger' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Trash2 className="w-4 h-4" /> Danger Zone
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto">
                        {message.text && (
                            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                                    <select
                                        value={formData.specialization}
                                        onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                    >
                                        <option value="General Practitioner">General Practitioner</option>
                                        <option value="Radiologist">Radiologist</option>
                                        <option value="Pulmonologist">Pulmonologist</option>
                                        <option value="Medical Student">Medical Student</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/20 font-medium flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                                </button>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passData.newPassword}
                                        onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passData.confirmPassword}
                                        onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/20 font-medium flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Update Password</>}
                                </button>
                            </form>
                        )}

                        {activeTab === 'danger' && (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Delete Account</h3>
                                <p className="text-slate-500 text-sm">
                                    Permanently remove your account and all of its data from our servers. This action is not reversible.
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="w-full py-2.5 bg-white border border-red-500 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                                >
                                    {loading ? "Deleting..." : "Delete My Account"}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
