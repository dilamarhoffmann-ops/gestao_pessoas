import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle, Building } from 'lucide-react';
import { authService } from '../lib/supabase-service';

interface LoginViewProps {
    onLogin: (user: any) => void;
    currentUser?: any;
}

export default function LoginView({ onLogin, currentUser }: LoginViewProps) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(currentUser?.must_change_password || false);
    const [tempUser, setTempUser] = useState<any>(currentUser || null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [area, setArea] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Sycn state if currentUser changes from App
    useEffect(() => {
        if (currentUser?.must_change_password) {
            setIsChangingPassword(true);
            setTempUser(currentUser);
        }
    }, [currentUser]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await authService.login(email, password);
            if (result.user.must_change_password) {
                setTempUser(result.user);
                setIsChangingPassword(true);
            } else {
                onLogin(result.user);
            }
        } catch (err: any) {
            setError(err.message || 'Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.changePassword(newPassword);
            onLogin({ ...tempUser, must_change_password: false });
        } catch (err: any) {
            setError(err.message || 'Erro ao alterar senha.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.register(name, email, password, area);
            setSuccess('Solicitação enviada! Aguarde a liberação de um gestor.');
            setIsRegistering(false);
        } catch (err: any) {
            setError(err.message || 'Erro ao processar registro.');
        } finally {
            setLoading(false);
        }
    };

    /* ── shared input style ── */
    const inputCls =
        'w-full bg-gray-100 text-gray-900 border-0 rounded-lg p-2.5 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ease-in-out duration-150 text-sm placeholder-gray-400';

    const renderLoginForm = () => (
        <form onSubmit={handleLogin} className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Endereço de E-mail
            </label>
            <input
                id="login-email"
                type="email"
                required
                className={inputCls}
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />

            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Senha
            </label>
            <input
                id="login-password"
                type="password"
                required
                className={inputCls}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between flex-wrap mb-1">
                <label htmlFor="remember-me" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                    <input
                        type="checkbox"
                        id="remember-me"
                        className="rounded"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                    />
                    Lembrar-me
                </label>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">
                    Esqueceu a senha? Contate o Gestor.
                </div>
            </div>

            <button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2.5 px-4 rounded-lg mt-4 hover:from-indigo-600 hover:to-blue-600 transition ease-in-out duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <LogIn size={16} />
                        Entrar
                    </>
                )}
            </button>
        </form>
    );

    const renderRegisterForm = () => (
        <form onSubmit={handleRegister} className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Nome Completo
            </label>
            <input
                required
                className={inputCls}
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
            />

            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Setor / Área
            </label>
            <input
                required
                className={inputCls}
                placeholder="Ex: Comercial, Operações..."
                value={area}
                onChange={e => setArea(e.target.value)}
            />

            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                E-mail Corporativo
            </label>
            <input
                type="email"
                required
                className={inputCls}
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />

            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Senha Temporária
            </label>
            <input
                type="password"
                required
                className={inputCls}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2.5 px-4 rounded-lg mt-2 hover:from-indigo-600 hover:to-blue-600 transition ease-in-out duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <UserPlus size={16} />
                        Solicitar Acesso
                    </>
                )}
            </button>
        </form>
    );

    const renderChangePasswordForm = () => (
        <form onSubmit={handleChangePassword} className="flex flex-col">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 mb-4">
                <Lock size={16} className="text-amber-500 shrink-0" />
                <p className="text-xs font-semibold text-amber-600">
                    Troca de senha obrigatória — defina sua senha privada antes de continuar.
                </p>
            </div>

            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Nova Senha
            </label>
            <input
                type="password"
                required
                className={inputCls}
                placeholder="Mínimo 4 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
            />

            <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Confirmar Nova Senha
            </label>
            <input
                type="password"
                required
                className={inputCls}
                placeholder="Redigite a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
            />

            <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-2.5 px-4 rounded-lg mt-2 hover:from-amber-500 hover:to-orange-500 transition ease-in-out duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <CheckCircle size={16} />
                        Salvar e Acessar Sistema
                    </>
                )}
            </button>

            {/* Only show cancel button if password change is NOT mandatory */}
            {(!tempUser || !tempUser.must_change_password) && (
                <button
                    type="button"
                    onClick={() => {
                        setIsChangingPassword(false);
                        setError('');
                        setSuccess('');
                    }}
                    className="mt-4 text-xs text-gray-500 hover:text-deep-navy font-bold uppercase tracking-widest text-center"
                >
                    Cancelar
                </button>
            )}
        </form>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md px-4"
            >
                {/* White card */}
                <div className="w-full bg-white rounded-2xl shadow-2xl p-8">

                    {/* Logo / Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
                            <Shield size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Gente & <span className="text-blue-500">Gestão</span>
                        </h2>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
                            {isChangingPassword ? 'Criar nova senha' : isRegistering ? 'Solicitar acesso' : 'Acesso ao sistema'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2 mb-4"
                        >
                            <AlertCircle size={16} className="text-rose-500 shrink-0" />
                            <p className="text-xs font-semibold text-rose-600">{error}</p>
                        </motion.div>
                    )}

                    {/* Success */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 mb-4"
                        >
                            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                            <p className="text-xs font-semibold text-emerald-600">{success}</p>
                        </motion.div>
                    )}

                    {/* Forms */}
                    {isChangingPassword
                        ? renderChangePasswordForm()
                        : isRegistering
                            ? renderRegisterForm()
                            : renderLoginForm()}

                    {/* Toggle login / register */}
                    {!isChangingPassword && (
                        <p className="text-gray-600 text-sm text-center mt-5">
                            {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="text-blue-500 hover:underline font-semibold text-sm"
                            >
                                {isRegistering ? 'Fazer login' : 'Cadastrar'}
                            </button>
                        </p>
                    )}
                </div>

                <p className="mt-6 text-center text-white/30 text-[9px] font-bold uppercase tracking-[0.3em]">
                    Ambiente Seguro &amp; Monitorado
                </p>
            </motion.div>
        </div>
    );
}
