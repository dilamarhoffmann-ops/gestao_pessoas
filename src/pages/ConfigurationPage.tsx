import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Shield, UserPlus, Trash2, Check, X, Search, Lock,
    Unlock, Mail, Building, User as UserIcon, Key,
    RotateCcw, AlertCircle, ShieldAlert, CheckCircle, Info, Menu,
    LayoutDashboard, DollarSign, Scale, Users as UsersIcon, Settings, Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersService, authService } from '../lib/supabase-service';
import { supabase } from '../lib/supabase';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    allowed: boolean;
    area: string;
    allowed_menus: string | null;
    requiresPasswordChange: boolean;
    approver: boolean;
    created_at: string;
};

const MENU_ITEMS = [
    { id: 'inicio', label: 'Início', path: '/', icon: LayoutDashboard },
    { id: 'financeiro', label: 'Financeiro', path: '/discounts', icon: DollarSign },
    { id: 'juridico', label: 'Jurídico', path: '/lawsuits', icon: Scale },
    { id: 'gestao', label: 'Gestão', path: '/hiring', icon: UsersIcon },
    { id: 'recibos', label: 'Recibos', path: '/receipts', icon: Printer },
    { id: 'configuracoes', label: 'Configurações', path: '/configuration', icon: Settings },
];

export default function ConfigurationPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeUser, setActiveUser] = useState<any>(null);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'Usuario',
        allowed: 'true',
        area: '',
        password: '123',
        allowed_menus: 'inicio',
        approver: 'false'
    });

    const [showMenuModal, setShowMenuModal] = useState(false);
    const [menuUser, setMenuUser] = useState<User | null>(null);

    const [showResetModal, setShowResetModal] = useState(false);
    const [resettingUser, setResettingUser] = useState<User | null>(null);
    const [newResetPassword, setNewResetPassword] = useState('123');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setActiveUser(JSON.parse(stored));
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await usersService.getAll();
            setUsers(data as User[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (id: number, updates: Partial<User>) => {
        try {
            await usersService.update(id as any, updates);
            fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Create user in Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        name: newUser.name,
                        role: newUser.role,
                        allowed: newUser.allowed === 'true'
                    }
                }
            });
            if (error) throw error;

            // Update profile with extra fields
            if (data.user) {
                await supabase.from('profiles').update({
                    area: newUser.area,
                    allowed: newUser.allowed === 'true',
                    role: newUser.role,
                    approver: newUser.approver === 'true',
                    allowed_menus: newUser.allowed_menus
                }).eq('id', data.user.id);
            }

            setShowAddModal(false);
            setNewUser({
                name: '',
                email: '',
                role: 'Usuario',
                allowed: 'true',
                area: '',
                password: '123456',
                allowed_menus: 'inicio',
                approver: 'false'
            });
            fetchUsers();
        } catch (e: any) {
            const msg = e.message || '';
            if (msg.includes('security purposes')) {
                alert('Aguarde 30 segundos antes de cadastrar outro usuário (proteção do Supabase).');
            } else if (msg.includes('already registered') || msg.includes('already been registered')) {
                alert('Este e-mail já está cadastrado no sistema.');
            } else if (msg.includes('rate limit')) {
                alert('Limite de requisições atingido. Tente novamente em alguns minutos.');
            } else {
                alert(msg || 'Erro ao cadastrar usuário.');
            }
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resettingUser) {
            try {
                // Note: Supabase admin password reset requires service_role key
                // For now, just update the profile flag
                await usersService.update(resettingUser.id as any, {
                    requiresPasswordChange: true
                } as any);
                setShowResetModal(false);
                setResettingUser(null);
                setNewResetPassword('123456');
                fetchUsers();
                alert(`Senha de ${resettingUser.name} será redefinida no próximo login.`);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await usersService.delete(userToDelete.id as any);
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.area?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && users.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#f8fbff]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-12 space-y-10 animate-slide-up pb-24 bg-[#f8fbff]">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Shield className="text-[#3b82f6]" size={36} strokeWidth={1.5} />
                    <div>
                        <h2 className="text-3xl font-bold text-[#1e293b] tracking-tight">
                            Configuração de Acessos
                        </h2>
                        <p className="text-[#64748b] text-base mt-0.5 font-medium">Gerencie usuários, permissões e whitelists do sistema.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-7 py-4 bg-[#5d87b3] text-white rounded-2xl font-bold hover:bg-[#4a6d91] transition-all shadow-lg active:scale-95 flex items-center gap-3"
                >
                    <UserPlus size={20} />
                    Adicionar Usuário
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-[#e2e8f0] overflow-hidden">

                {/* Search Bar at the top of the card */}
                <div className="p-8 pb-4">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={22} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou área..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-[#f8fafc] border-none rounded-2xl focus:ring-2 focus:ring-[#3b82f6]/10 transition-all font-medium text-[#1e293b] placeholder:text-[#94a3b8]"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto px-8 pb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#f1f5f9]">
                                <th className="pb-6 px-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Usuário</th>
                                <th className="pb-6 px-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] text-center">Área / Cargo</th>
                                <th className="pb-6 px-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] text-center">Permissão</th>
                                <th className="pb-6 px-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] text-center">Aprovador</th>
                                <th className="pb-6 px-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] text-center">Role</th>
                                <th className="pb-6 px-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f8fafc]">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-[#f8fafc]/50 transition-colors">
                                    <td className="py-7 px-6">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border shrink-0",
                                                user.role === 'Gestor' ? 'bg-[#5d87b3]/10 border-[#5d87b3]/20 text-[#5d87b3]' : 'bg-[#94a3b8]/10 border-[#94a3b8]/30 text-[#64748b]'
                                            )}>
                                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1e293b] text-lg leading-tight">{user.name}</p>
                                                <p className="text-xs text-[#94a3b8] font-medium mt-1">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-7 px-6 text-center">
                                        <span className="inline-block px-5 py-2 bg-[#f1f5f9] rounded-full text-[11px] font-bold text-[#64748b] tracking-tight">
                                            {user.area || 'Geral'}
                                        </span>
                                    </td>
                                    <td className="py-7 px-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    if (activeUser?.id === user.id) return;
                                                    handleUpdateUser(user.id, { allowed: !user.allowed });
                                                }}
                                                disabled={activeUser?.id === user.id}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold transition-all",
                                                    user.allowed
                                                        ? 'bg-[#ecfdf5] text-[#10b981]'
                                                        : 'bg-[#fef2f2] text-[#ef4444]',
                                                    activeUser?.id === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                                                )}
                                            >
                                                {user.allowed ? <CheckCircle size={15} /> : <ShieldAlert size={15} />}
                                                {user.allowed ? 'Acesso Liberado' : 'Acesso Bloqueado'}
                                            </button>

                                            {user.requiresPasswordChange && (
                                                <div className="flex items-center gap-1.5 text-amber-500 animate-pulse mt-1">
                                                    <RotateCcw size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-tighter">Troca Obrigatória</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-7 px-6 text-center">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleUpdateUser(user.id, { approver: !user.approver })}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold transition-all border shadow-sm",
                                                    user.approver
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                        : 'bg-white border-[#f1f5f9] text-[#94a3b8] opacity-60',
                                                    'hover:scale-105 active:scale-95'
                                                )}
                                            >
                                                <CheckCircle size={14} strokeWidth={2.5} />
                                                {user.approver ? 'Aprovador' : 'Não'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-7 px-6 text-center">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => {
                                                    if (activeUser?.id === user.id) return;
                                                    handleUpdateUser(user.id, { role: user.role === 'Gestor' ? 'Usuario' : 'Gestor' });
                                                }}
                                                disabled={activeUser?.id === user.id}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold transition-all border shadow-sm",
                                                    user.role === 'Gestor'
                                                        ? 'bg-white border-[#cbd5e1] text-[#64748b]'
                                                        : 'bg-white border-[#f1f5f9] text-[#94a3b8] opacity-60',
                                                    activeUser?.id === user.id ? 'cursor-not-allowed' : 'hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#f8fbff]'
                                                )}
                                            >
                                                <Shield size={14} strokeWidth={2.5} />
                                                {user.role}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-7 px-6">
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => {
                                                    setMenuUser(user);
                                                    setShowMenuModal(true);
                                                }}
                                                className="p-2.5 text-[#94a3b8] hover:text-[#5d87b3] hover:bg-[#f1f5f9] transition-all rounded-full"
                                                title="Gerenciar Menus"
                                            >
                                                <Menu size={20} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setResettingUser(user);
                                                    setShowResetModal(true);
                                                }}
                                                className="p-2.5 text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#f1f5f9] transition-all rounded-full"
                                                title="Resetar Senha"
                                            >
                                                <RotateCcw size={20} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (activeUser?.id === user.id) return;
                                                    setUserToDelete(user);
                                                    setShowDeleteModal(true);
                                                }}
                                                disabled={activeUser?.id === user.id}
                                                className={cn(
                                                    "p-2.5 transition-all rounded-full",
                                                    activeUser?.id === user.id
                                                        ? 'text-[#f1f5f9] cursor-not-allowed'
                                                        : 'text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#fef2f2]'
                                                )}
                                                title="Remover Usuário"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info inside the card structure */}
                <div className="bg-[#f8fbff] p-8 border-t border-[#f1f5f9] flex gap-6 items-start">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#3b82f6] shadow-sm border border-[#e2e8f0] shrink-0">
                        <Info size={28} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-[#1e293b] uppercase tracking-widest mb-2">Auditoria e Segurança do Sistema</h4>
                        <p className="text-[12px] text-[#64748b] font-medium leading-relaxed max-w-4xl">
                            Todas as interações administrativas no painel de acessos são monitoradas em tempo real. A revogação de permissões interrompe instantaneamente qualquer sessão ativa. Resets de senha efetuados por gestores exigem a criação de uma nova credencial no primeiro acesso do destinatário.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals with consistent Premium UI */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-7 relative border border-[#e2e8f0]">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 p-2 bg-[#f8fafc] rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] transition-colors">
                                <X size={18} />
                            </button>
                            <h3 className="text-xl font-bold text-[#1e293b] mb-6 flex items-center gap-2.5">
                                <UserPlus className="text-[#3b82f6]" size={22} /> Novo Usuário
                            </h3>
                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Nome Completo</label>
                                        <input required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] focus:ring-2 focus:ring-[#3b82f6] transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">E-mail Profissional</label>
                                        <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] focus:ring-2 focus:ring-[#3b82f6] transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Departamento</label>
                                        <select
                                            required
                                            value={newUser.area}
                                            onChange={e => setNewUser({ ...newUser, area: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] appearance-none cursor-pointer focus:ring-2 focus:ring-[#3b82f6] transition-all"
                                        >
                                            <option value="" disabled>Selecione</option>
                                            <option value="Cobrança">Cobrança</option>
                                            <option value="Comercial">Comercial</option>
                                            <option value="Compras">Compras</option>
                                            <option value="Departamento Pessoal">Depto. Pessoal</option>
                                            <option value="Desenvolvimento">Desenvolvimento</option>
                                            <option value="Engenharia">Engenharia</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Squad">Squad</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Senha Temporária</label>
                                        <input required type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] focus:ring-2 focus:ring-[#3b82f6] transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Perfil</label>
                                        <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] appearance-none cursor-pointer">
                                            <option value="Usuario">Usuário</option>
                                            <option value="Gestor">Gestor</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Acesso</label>
                                        <select value={newUser.allowed} onChange={e => setNewUser({ ...newUser, allowed: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] appearance-none cursor-pointer">
                                            <option value="true">Liberado</option>
                                            <option value="false">Bloqueado</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Aprovador</label>
                                        <select value={newUser.approver} onChange={e => setNewUser({ ...newUser, approver: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc] border-none rounded-xl font-semibold text-sm text-[#1e293b] appearance-none cursor-pointer">
                                            <option value="false">Não</option>
                                            <option value="true">Sim</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Acessos Permitidos</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {MENU_ITEMS.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    const current = newUser.allowed_menus.split(',').filter(Boolean);
                                                    const next = current.includes(item.id)
                                                        ? current.filter(id => id !== item.id)
                                                        : [...current, item.id];
                                                    setNewUser({ ...newUser, allowed_menus: next.join(',') });
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5",
                                                    newUser.allowed_menus.split(',').includes(item.id)
                                                        ? "bg-[#5d87b3] border-[#5d87b3] text-white"
                                                        : "bg-white border-[#f1f5f9] text-[#94a3b8] hover:border-[#5d87b3]/30"
                                                )}
                                            >
                                                <item.icon size={11} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-[#5d87b3] text-white rounded-xl font-bold mt-2 shadow-lg shadow-[#5d87b3]/20 active:scale-95 transition-all outline-none text-sm">
                                    Autorizar Colaborador
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showResetModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm text-center">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-7 relative border border-[#e2e8f0]">
                            <button onClick={() => setShowResetModal(false)} className="absolute top-5 right-5 p-2 bg-[#f8fafc] rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] transition-colors">
                                <X size={18} />
                            </button>
                            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-100/50">
                                <RotateCcw size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-[#1e293b]">Redefinir Acesso</h3>
                            <p className="text-sm text-[#64748b] mt-2 font-medium px-2">Nova credencial para {resettingUser?.name}</p>
                            <form onSubmit={handleResetSubmit} className="mt-6 space-y-4 text-left">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest pl-2">Nova Senha</label>
                                    <input required type="text" value={newResetPassword} onChange={e => setNewResetPassword(e.target.value)} className="w-full px-6 py-3.5 bg-[#f8fafc] border-none rounded-xl font-bold text-[#1e293b] text-center text-lg tracking-tight focus:ring-2 focus:ring-amber-500/20 transition-all" />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm">
                                    Confirmar Reset
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showDeleteModal && userToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm text-center">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-7 relative border border-[#e2e8f0]">
                            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-rose-100">
                                <Trash2 size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-[#1e293b]">Revogar Acesso</h3>
                            <p className="text-sm text-[#64748b] mt-2 font-medium px-2">Remover <strong>{userToDelete.name}</strong> do sistema?</p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-[#f8fafc] text-[#64748b] rounded-xl font-bold hover:bg-[#f1f5f9] transition-all text-sm">Manter</button>
                                <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all text-sm">Revogar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showMenuModal && menuUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-7 relative border border-[#e2e8f0]">
                            <button onClick={() => setShowMenuModal(false)} className="absolute top-5 right-5 p-2 bg-[#f8fafc] rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] transition-colors">
                                <X size={18} />
                            </button>
                            <div className="w-14 h-14 bg-blue-50 text-[#5d87b3] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-blue-100/50">
                                <Menu size={28} strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-[#1e293b] text-center">Acessos do Menu</h3>
                            <p className="text-sm text-[#64748b] mt-2 font-medium px-2 text-center">Módulos de <strong>{menuUser.name}</strong></p>

                            <div className="mt-5 grid gap-2">
                                {MENU_ITEMS.map(item => {
                                    const isAllowed = (menuUser.allowed_menus || '').split(',').includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                const current = (menuUser.allowed_menus || '').split(',').filter(Boolean);
                                                const next = isAllowed
                                                    ? current.filter(id => id !== item.id)
                                                    : [...current, item.id];

                                                const nextMenus = next.join(',');
                                                setUsers(prev => prev.map(u => u.id === menuUser.id ? { ...u, allowed_menus: nextMenus } : u));
                                                setMenuUser({ ...menuUser, allowed_menus: nextMenus });
                                                handleUpdateUser(menuUser.id, { allowed_menus: nextMenus });
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all",
                                                isAllowed
                                                    ? "bg-[#f8fbff] border-[#5d87b3]/20 text-[#1e293b]"
                                                    : "bg-white border-[#f1f5f9] text-[#94a3b8] hover:bg-[#f8fafc]"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                    isAllowed ? "bg-[#5d87b3] text-white" : "bg-[#f1f5f9] text-[#94a3b8]"
                                                )}>
                                                    <item.icon size={16} strokeWidth={2.5} />
                                                </div>
                                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                                                isAllowed ? "bg-[#10b981] border-[#10b981] text-white" : "border-[#cbd5e1] scale-90"
                                            )}>
                                                {isAllowed && <Check size={12} strokeWidth={4} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={() => setShowMenuModal(false)} className="w-full py-3.5 bg-[#1e293b] text-white rounded-xl font-bold mt-5 shadow-lg active:scale-95 transition-all text-sm">
                                Salvar Permissões
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
