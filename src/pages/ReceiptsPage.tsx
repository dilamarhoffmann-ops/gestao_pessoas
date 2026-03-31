import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, DollarSign, CheckCircle, Download,
    Printer, Upload, Eye, UserCheck, X, Check,
    AlertCircle, Search, Info, Settings, Trash2, Building2, Plus,
    Mail, Clock, Tag, Briefcase, Gift, Wallet, Calendar, Coffee, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersService, companiesService, receiptConfigService, issuedReceiptsService } from '../lib/supabase-service';

type ReceiptType = {
    id: string;
    label: string;
    icon: React.ReactNode;
    subtext: string;
    has_template?: boolean;
    template_url?: string;
    requires_approval?: boolean;
    approver_id?: number | null;
    company_id?: number | null;
    supplier_name?: string;
    supplier_document?: string;
    payment_reason?: string;
    value?: number;
    date?: string;
    is_approved?: boolean;
    history_json?: string;
    pix_key?: string;
    items?: Array<{ id: string; label: string; value: number; reference?: string }>;
    requester?: string;
    custom_id?: string;
    is_configured?: boolean;
    has_multiple_beneficiaries?: boolean;
    multiple_beneficiaries?: string;
};

type User = {
    id: string;
    name: string;
    email: string;
    approver: boolean;
};

type Company = {
    id: number;
    name: string;
    cnpj: string;
};

interface ReceiptsPageProps {
    user?: any;
}

export default function ReceiptsPage({ user }: ReceiptsPageProps) {
    const initialSections = [
        {
            id: 'finance',
            section: 'Modelos Disponíveis',
            items: [
                { id: 'adiantamento', label: 'ADIANTAMENTO', icon: <Wallet />, subtext: 'Adiantamento de valores e benefícios' },
                { id: 'ajuda_custo', label: 'AJUDA DE CUSTO', icon: <Coffee />, subtext: 'Auxílio para despesas operacionais' },
                { id: 'despesas_gerais', label: 'DESPESAS GERAIS', icon: <Tag />, subtext: 'Reembolsos e gastos diversos' },
                { id: 'emprestimo', label: 'EMPRÉSTIMO', icon: <DollarSign />, subtext: 'Empréstimos consignados ou pessoais' },
                { id: 'gratificacao', label: 'GRATIFICAÇÃO', icon: <Gift />, subtext: 'Prêmios, bônus e gratificações' },
                { id: 'hora_extra', label: 'HORA EXTRA', icon: <Clock />, subtext: 'Remuneração por tempo suplementar' },
                { id: 'salario', label: 'SALÁRIO', icon: <Briefcase />, subtext: 'Pagamento de vencimentos e folha' },
                { id: 'vt', label: 'VALE TRANSPORTE', icon: <FileText />, subtext: 'Auxílio transporte e deslocamento' },
                { id: 'venda_ferias', label: 'VENDA DE FÉRIAS', icon: <Calendar />, subtext: 'Abono pecuniário de férias' },
            ]
        }
    ];

    const [receiptSections, setReceiptSections] = useState(initialSections.map(s => ({
        ...s,
        items: s.items.map(i => ({ ...i, has_template: false, requires_approval: false, approver_id: null }))
    })));

    const [approvers, setApprovers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedItem, setSelectedItem] = useState<ReceiptType | null>(null);
    const [previewItem, setPreviewItem] = useState<ReceiptType | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [issuedReceipts, setIssuedReceipts] = useState<any[]>([]);
    const [receiptToEdit, setReceiptToEdit] = useState<any>(null);
    const [newCompany, setNewCompany] = useState({ name: '', cnpj: '' });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; isOpen: boolean }>({
        message: '',
        type: 'success',
        isOpen: false
    });
    const allAvailableModels = receiptSections.flatMap(s => s.items);
    const isGestor = user?.role === 'Gestor' || user?.approver;

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [users, fetchedCompanies, configs, fetchedIssued] = await Promise.all([
                usersService.getAll(),
                companiesService.getAll(),
                receiptConfigService.getAll(),
                issuedReceiptsService.getAll()
            ]);

            setApprovers((users as User[]).filter((u: User) => u.approver));
            setCompanies(fetchedCompanies as Company[]);
            setIssuedReceipts(fetchedIssued);

            // Map configs back to sections
            setReceiptSections(prev => prev.map(section => ({
                ...section,
                items: section.items.map(item => {
                    const config = (configs as any[]).find((c: any) => c.receipt_id === item.id);
                    if (config) {
                        return {
                            ...item,
                            is_configured: true,
                            has_template: !!config.has_template,
                            template_url: config.template_url || '',
                            requires_approval: !!config.requires_approval,
                            approver_id: config.approver_id,
                            company_id: config.company_id,
                            supplier_name: config.supplier_name || '',
                            supplier_document: config.supplier_document || '',
                            payment_reason: config.payment_reason || '',
                            is_approved: !!config.is_approved,
                            history_json: typeof config.history_json === 'string' ? config.history_json : JSON.stringify(config.history_json || []),
                            pix_key: config.pix_key || '',
                            requester: config.requester || '',
                            custom_id: config.custom_id || '',
                            has_multiple_beneficiaries: config.has_multiple_beneficiaries || false,
                            multiple_beneficiaries: config.multiple_beneficiaries || '',
                            value: config.value || 0,
                            date: config.date || '',
                            items: config.items_json ? (typeof config.items_json === 'string' ? JSON.parse(config.items_json) : config.items_json) : []
                        };
                    }
                    return item;
                })
            })));
        } catch (e) {
            console.error('Error fetching initial data', e);
            setNotification({ message: 'Erro ao carregar dados iniciais. Verifique a conexão.', type: 'error', isOpen: true });
            setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 4000);
        }
    };

    const handleOpenConfig = (item: ReceiptType, isNew: boolean = false) => {
        let items = item.items || [];

        // Initialize specific items based on type if empty
        if (items.length === 0 || isNew) {
            items = [{ id: 'default-1', label: '', value: 0, reference: '' }];
        }

        if (isNew) {
            setSelectedItem({
                ...item,
                supplier_name: '',
                supplier_document: '',
                payment_reason: '',
                value: 0,
                date: new Date().toISOString().split('T')[0], // Default to today for new receipts
                pix_key: '',
                requester: '',
                custom_id: '',
                multiple_beneficiaries: '',
                has_multiple_beneficiaries: false,
                items
            });
        } else {
            setSelectedItem({ ...item, items });
        }
        setIsConfigModalOpen(true);
    };

    const handleOpenPrint = (item: ReceiptType) => {
        setPreviewItem(item);
        setIsPrintModalOpen(true);
    };

    const handleSaveIssuedReceipt = async (receiptData: any) => {
        try {
            await issuedReceiptsService.save(receiptData);
            const updated = await issuedReceiptsService.getAll();
            setIssuedReceipts(updated);
            setIsConfigModalOpen(false);
            setReceiptToEdit(null);
        } catch (e) {
            console.error('Error saving issued receipt', e);
        }
    };

    const handleDeleteIssuedReceipt = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este registro permanente?')) return;
        try {
            await issuedReceiptsService.delete(id);
            setIssuedReceipts(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error('Error deleting issued receipt', e);
        }
    };



    const handleApproval = async (status: 'approve' | 'reject') => {
        if (!selectedItem) return;

        const isApproved = status === 'approve';
        const updatedItem = { ...selectedItem, is_approved: isApproved };

        // Update local state
        setReceiptSections(prev => prev.map(section => ({
            ...section,
            items: section.items.map(item =>
                item.id === selectedItem.id ? updatedItem : item
            )
        })));

        // Persist
        await handleUpdateItem(updatedItem);
        setSelectedItem(updatedItem);

        if (isApproved) {
            setNotification({ message: 'Recibo aprovado com sucesso!', type: 'success', isOpen: true });
            setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
        } else {
            setNotification({ message: 'Recibo reprovado. A emissão permanecerá bloqueada.', type: 'info', isOpen: true });
            setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
        }
    };

    const handleUpdateItem = async (updatedItem: ReceiptType) => {
        try {
            await receiptConfigService.save({
                receipt_id: updatedItem.id,
                company_id: updatedItem.company_id,
                supplier_name: updatedItem.supplier_name,
                supplier_document: updatedItem.supplier_document,
                payment_reason: updatedItem.payment_reason,
                value: updatedItem.value,
                date: updatedItem.date,
                has_template: updatedItem.has_template,
                template_url: updatedItem.template_url,
                requires_approval: updatedItem.requires_approval,
                approver_id: updatedItem.approver_id,
                is_approved: updatedItem.is_approved,
                pix_key: updatedItem.pix_key,
                items: updatedItem.items,
                requester: updatedItem.requester,
                custom_id: updatedItem.custom_id
            });

            const finalItem = { ...updatedItem, is_configured: true };
            setReceiptSections(prev => prev.map(section => ({
                ...section,
                items: section.items.map(item => item.id === finalItem.id ? finalItem : item)
            })));
            setIsConfigModalOpen(false);
        } catch (e) {
            console.error('Error saving config', e);
        }
    };

    const formatDocument = (value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length <= 11) {
            // CPF: 000.000.000-00
            return cleanValue
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else {
            // CNPJ: 00.000.000/0000-00
            return cleanValue
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
    };

    const handleApprove = async (itemId: string) => {
        try {
            await receiptConfigService.approve(itemId);

            setReceiptSections(prev => prev.map(section => ({
                ...section,
                items: section.items.map(item => item.id === itemId ? { ...item, is_approved: true } : item)
            })));
            if (previewItem && previewItem.id === itemId) {
                setPreviewItem({ ...previewItem, is_approved: true });
            }
        } catch (e) {
            console.error('Error approving', e);
        }
    };

    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedItem) return;

        try {
            const url = await receiptConfigService.uploadTemplate(file);
            if (url) {
                setSelectedItem({
                    ...selectedItem,
                    has_template: true,
                    template_url: url
                });
            } else {
                setNotification({ message: 'Erro ao fazer upload do template.', type: 'error', isOpen: true });
                setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
            }
        } catch (e) {
            console.error('Upload error', e);
            setNotification({ message: 'Erro de conexão ao enviar arquivo.', type: 'error', isOpen: true });
            setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
        }
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await companiesService.create(newCompany);
            setNewCompany({ name: '', cnpj: '' });

            // Refresh list
            const updated = await companiesService.getAll();
            setCompanies(updated as Company[]);

            // Feedback
            setNotification({
                message: 'Empresa cadastrada com sucesso!',
                type: 'success',
                isOpen: true
            });
            setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 4000);
        } catch (err: any) {
            console.error('Error adding company', err);
            const msg = err.message || 'Erro ao cadastrar empresa. Verifique se o CNPJ já existe ou se há permissão.';
            setNotification({
                message: msg,
                type: 'error',
                isOpen: true
            });
            setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 5000);
        }
    };

    const handleDeleteCompany = async (id: number) => {
        if (!confirm('Excluir esta empresa?')) return;
        try {
            await companiesService.delete(id);
            setCompanies(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error('Error deleting company', e);
        }
    };

    const handleEmitReceipt = async (item: ReceiptType) => {
        try {
            const result = await receiptConfigService.emit(item.id, {
                value: item.value,
                supplier_name: item.supplier_name,
                date: item.date,
                company_id: item.company_id,
                items: item.items,
                pix_key: item.pix_key,
                requester: item.requester,
                custom_id: item.custom_id
            });

            if (result?.entry) {
                const entry = result.entry;
                // Update local state history
                setReceiptSections(prev => prev.map(section => ({
                    ...section,
                    items: section.items.map(i => {
                        if (i.id === item.id) {
                            const history = JSON.parse(i.history_json || '[]');
                            history.unshift(entry);
                            return { ...i, history_json: JSON.stringify(history) };
                        }
                        return i;
                    })
                })));
                setNotification({ message: 'Recibo registrado no histórico com sucesso!', type: 'success', isOpen: true });
                setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
                return entry;
            }
        } catch (e) {
            console.error('Error emitting receipt', e);
        }
        return null;
    };

    const handleEditHistory = (entry: any, receiptId: string) => {
        let baseItem: any = null;
        receiptSections.forEach(s => {
            const item = s.items.find(i => i.id === receiptId);
            if (item) baseItem = item;
        });

        if (baseItem) {
            setSelectedItem({
                ...baseItem,
                value: entry.value,
                supplier_name: entry.supplier_name,
                date: entry.date,
                company_id: entry.company_id,
                items: entry.items || [],
                pix_key: entry.pix_key || '',
                requester: entry.requester || '',
                custom_id: entry.custom_id || ''
                // Note: supplier_document and payment_reason are inherited from the base model config 
                // as they weren't explicitly stored in the lightweight emission history
            });
            setIsConfigModalOpen(true);
        }
    };

    const handleDownloadHistory = (entry: any, receiptId: string) => {
        let baseItem: any = null;
        receiptSections.forEach(s => {
            const item = s.items.find(i => i.id === receiptId);
            if (item) baseItem = item;
        });

        if (baseItem) {
            setPreviewItem({
                ...baseItem,
                value: entry.value,
                supplier_name: entry.supplier_name,
                date: entry.date,
                company_id: entry.company_id,
                requester: entry.requester || '',
                custom_id: entry.custom_id || '',
                entry_id: entry.id
            });
            setIsPrintModalOpen(true);
            setTimeout(() => window.print(), 800);
        }
    };

    const handleDeleteHistory = async (id: number) => {
        if (!confirm('Deseja excluir este registro permanentemente?')) return;
        try {
            await issuedReceiptsService.delete(id);
            setIssuedReceipts(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error('Error deleting history entry', e);
        }
    };

    const allHistory = receiptSections.flatMap(s => s.items).flatMap(i => {
        try {
            const h = JSON.parse(i.history_json || '[]');
            return h.map((entry: any) => ({
                ...entry,
                receipt_label: i.label,
                receipt_id: i.id,
                icon: i.icon,
                requires_approval: entry.requires_approval !== undefined ? entry.requires_approval : i.requires_approval,
                is_approved: entry.is_approved !== undefined ? entry.is_approved : i.is_approved
            }));
        } catch (e) { return []; }
    }).sort((a: any, b: any) => new Date(b.emitted_at).getTime() - new Date(a.emitted_at).getTime()).slice(0, 10);

    return (
        <div className="flex-1 overflow-y-auto p-10 space-y-10 animate-slide-up pb-20 bg-[#f8fbff]">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 transition-transform hover:rotate-3 overflow-hidden p-1">
                        <img src="/logo.png" alt="Logo" className="w-[70%] h-auto object-contain" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-deep-navy tracking-tight uppercase">Central de <span className="text-primary">Recibos</span></h2>
                        <p className="text-deep-navy/40 font-bold text-sm tracking-tight">Emissão e gestão de documentos de conformidade e departamento pessoal.</p>
                    </div>
                </div>
                {isGestor && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setReceiptToEdit(null);
                                setIsSelectionModalOpen(true);
                            }}
                            className="px-6 py-3 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Novo Recibo
                        </button>
                        <button
                            onClick={() => setIsCompanyModalOpen(true)}
                            className="px-6 py-3 bg-white border border-slate-200 text-deep-navy font-black uppercase text-xs tracking-widest rounded-xl hover:border-primary/30 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Building2 size={18} /> Empresas
                        </button>
                        <button
                            onClick={() => setIsModelsModalOpen(true)}
                            className="px-6 py-3 bg-white border border-slate-200 text-deep-navy font-black uppercase text-xs tracking-widest rounded-xl hover:border-primary/30 transition-all shadow-sm flex items-center gap-2"
                        >
                            <FileText size={18} /> Modelo Padrão
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {isGestor && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-50 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Emitidos</p>
                            <p className="text-xl font-black text-deep-navy">{issuedReceipts.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-50 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Pendentes</p>
                            <p className="text-xl font-black text-deep-navy">{issuedReceipts.filter(r => r.status === 'pending').length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-50 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Empresas</p>
                            <p className="text-xl font-black text-deep-navy">{companies.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-50 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Modelos</p>
                            <p className="text-xl font-black text-deep-navy">{receiptSections.reduce((acc, s) => acc + s.items.length, 0)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt History Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-primary/20" />
                        Histórico de Emissões Recentes
                    </h3>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    {issuedReceipts.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {issuedReceipts.map((entry: any) => {
                                const baseModel = allAvailableModels.find(m => m.id === entry.receipt_type_id);
                                return (
                                    <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-deep-navy/20">
                                                {baseModel && React.isValidElement(baseModel.icon) ? React.cloneElement(baseModel.icon as React.ReactElement, { size: 20 }) : <FileText size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] font-black text-deep-navy uppercase tracking-tight">{baseModel?.label || entry.receipt_type_id}</span>
                                                    <span className="text-[10px] font-bold text-deep-navy/30 uppercase">{entry.employee_name}</span>
                                                    <span className={cn(
                                                        "text-[7px] font-black px-2 py-0.5 rounded-full border border-dashed uppercase tracking-tighter",
                                                        entry.status === 'approved' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}>
                                                        {entry.status === 'approved' ? 'Aprovado' : 'Pendente'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-sm font-black text-primary tracking-tight">R$ {Number(entry.amount)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Data: {new Date(entry.payment_date).toLocaleDateString('pt-BR')} • Ref: {entry.payment_reason}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {isGestor && (
                                                <button
                                                    onClick={() => {
                                                        setReceiptToEdit(entry);
                                                        const base = allAvailableModels.find(m => m.id === entry.receipt_type_id);
                                                        if (base) {
                                                            setSelectedItem({
                                                                ...base,
                                                                ...entry,
                                                                value: entry.amount,
                                                                supplier_name: entry.employee_name,
                                                                supplier_document: entry.employee_document,
                                                                date: entry.payment_date
                                                            });
                                                            setIsConfigModalOpen(true);
                                                        }
                                                    }}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 rounded-xl transition-all shadow-sm"
                                                    title="Editar Registro"
                                                >
                                                    <Settings size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const base = allAvailableModels.find(m => m.id === entry.receipt_type_id);
                                                    if (base) {
                                                        setPreviewItem({
                                                            ...base,
                                                            ...entry,
                                                            value: entry.amount,
                                                            supplier_name: entry.employee_name,
                                                            date: entry.payment_date
                                                        });
                                                        setIsPrintModalOpen(true);
                                                    }
                                                }}
                                                className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 rounded-xl transition-all shadow-sm"
                                                title="Baixar PDF"
                                            >
                                                <Download size={16} />
                                            </button>
                                            {isGestor && (
                                                <button
                                                    onClick={() => handleDeleteIssuedReceipt(entry.id)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition-all shadow-sm"
                                                    title="Excluir Registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                                <Clock size={32} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-deep-navy/40 uppercase tracking-widest">Nenhuma emissão registrada</p>
                                <p className="text-[10px] font-bold text-deep-navy/20 uppercase tracking-tighter mt-1">Os recibos gerados aparecerão automaticamente aqui.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Models Management Section */}
            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-primary/20" />
                        Gerenciamento de Modelos Padrão
                    </h3>
                </div>

                {isGestor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {receiptSections.flatMap(section => section.items).map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleOpenConfig(item)}
                                className="bg-white border border-slate-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:shadow-premium transition-all cursor-pointer select-none active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-deep-navy/20 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                        {React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement, { size: 20 }) : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-black text-deep-navy tracking-tight uppercase">{item.label}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.is_configured && (
                                                <span className="bg-primary/5 text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-tighter flex items-center gap-1">
                                                    <CheckCircle size={8} /> Padrão Salvo
                                                </span>
                                            )}
                                            <span className={cn(
                                                "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter",
                                                item.has_template ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                {item.has_template ? 'Template OK' : 'Sem PDF'}
                                            </span>
                                            {item.requires_approval && (
                                                <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-tighter">
                                                    Exige Aprovação
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                                    title="Configurar Modelo Padrão"
                                >
                                    <Settings size={18} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Config Modal */}
            <AnimatePresence>
                {isConfigModalOpen && selectedItem && (
                    <div className="fixed inset-0 z-[100] bg-[#0f172a]/60 backdrop-blur-sm overflow-y-auto">
                        <div className="min-h-full flex items-start justify-center py-6 px-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative border border-slate-200"
                            >
                                <button onClick={() => setIsConfigModalOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                                    <X size={16} />
                                </button>

                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary shadow-inner border border-slate-100">
                                        {React.isValidElement(selectedItem.icon) ? React.cloneElement(selectedItem.icon as React.ReactElement, { size: 24 }) : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-deep-navy tracking-tight uppercase">Configuração <span className="text-primary">do Modelo</span></h3>
                                        <p className="text-deep-navy/40 font-bold text-[10px] tracking-tight uppercase">{selectedItem.label}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Company and Supplier Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Empresa Emitente</label>
                                            <select
                                                value={selectedItem.company_id || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, company_id: Number(e.target.value) || null })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="">Selecione a empresa...</option>
                                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between pl-1">
                                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">Nome do Fornecedor / Destinatário</label>
                                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only"
                                                            checked={selectedItem.has_multiple_beneficiaries || false}
                                                            onChange={(e) => setSelectedItem({ ...selectedItem, has_multiple_beneficiaries: e.target.checked })}
                                                        />
                                                        <div className={cn(
                                                            "w-3 h-3 rounded transition-all flex items-center justify-center border",
                                                            selectedItem.has_multiple_beneficiaries ? "bg-primary border-primary" : "bg-white border-slate-300 group-hover:border-primary/50"
                                                        )}>
                                                            <Check size={8} className={cn("text-white transition-opacity", selectedItem.has_multiple_beneficiaries ? "opacity-100" : "opacity-0")} />
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-deep-navy/40 uppercase tracking-widest group-hover:text-primary transition-colors">Mais de 1 beneficiário</span>
                                                </label>
                                            </div>
                                            <input
                                                value={selectedItem.supplier_name || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, supplier_name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                                placeholder="Nome completo ou Razão Social"
                                            />
                                            {selectedItem.has_multiple_beneficiaries && (
                                                <textarea
                                                    value={selectedItem.multiple_beneficiaries || ''}
                                                    onChange={(e) => setSelectedItem({ ...selectedItem, multiple_beneficiaries: e.target.value })}
                                                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm min-h-[60px]"
                                                    placeholder="Nomes dos demais beneficiários..."
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">CPF / CNPJ do Fornecedor</label>
                                            <input
                                                value={selectedItem.supplier_document || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, supplier_document: formatDocument(e.target.value) })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                                maxLength={18}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">
                                                {selectedItem.id === 'venda_ferias' ? 'Período Aquisitivo' :
                                                    selectedItem.id === 'vt' ? 'Itinerário / Trajeto' :
                                                        selectedItem.id === 'salario' ? 'Mês / Ano de Referência' :
                                                            'Motivo do Pagamento / Lançamento'}
                                            </label>
                                            <input
                                                value={selectedItem.payment_reason || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, payment_reason: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                                placeholder={selectedItem.id === 'venda_ferias' ? 'Ex: 2023/2024' :
                                                    selectedItem.id === 'vt' ? 'Ex: Residência x Trabalho' :
                                                        selectedItem.id === 'salario' ? 'Ex: Fevereiro/2026' :
                                                            'Ex: Aquisição de EPI, Bonificação...'}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Valor do Recibo (R$)</label>
                                            <input
                                                type="number"
                                                value={selectedItem.value || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, value: Number(e.target.value) })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Data do Recibo</label>
                                            <input
                                                type="date"
                                                value={selectedItem.date || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, date: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Solicitante</label>
                                            <input
                                                value={selectedItem.requester || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, requester: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                                placeholder="Nome do Solicitante"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Nº do ID</label>
                                            <input
                                                value={selectedItem.custom_id || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, custom_id: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm"
                                                placeholder="Ex: 0001"
                                            />
                                        </div>
                                    </div>

                                    {/* Pix and Items - Universal for all receipts */}
                                    <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 flex items-center gap-2">
                                                <DollarSign size={12} /> Chave PIX p/ Pagamento (Opcional)
                                            </label>
                                            <input
                                                value={selectedItem.pix_key || ''}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, pix_key: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-primary/10 rounded-xl font-bold text-deep-navy text-sm focus:ring-2 focus:ring-primary/20"
                                                placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Detalhamento de Itens (ITEM / REFERÊNCIA / VALOR)</label>
                                                <button
                                                    onClick={() => {
                                                        const currentItems = selectedItem.items || [];
                                                        setSelectedItem({
                                                            ...selectedItem,
                                                            items: [...currentItems, { id: Date.now().toString(), label: '', value: 0, reference: '' }]
                                                        });
                                                    }}
                                                    className="px-3 py-1.5 bg-primary text-white text-[9px] font-black uppercase rounded-lg hover:bg-deep-blue transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={12} /> Adicionar Item
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {(selectedItem.items || []).map((item, index) => (
                                                    <div key={item.id} className="flex gap-2 items-end group">
                                                        <div className="flex-[2] space-y-1">
                                                            <input
                                                                value={item.label}
                                                                onChange={(e) => {
                                                                    const newItems = [...(selectedItem.items || [])];
                                                                    newItems[index].label = e.target.value;
                                                                    const total = newItems.reduce((acc, curr) => acc + curr.value, 0);
                                                                    setSelectedItem({ ...selectedItem, items: newItems, value: total });
                                                                }}
                                                                className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg font-bold text-deep-navy text-[11px]"
                                                                placeholder="ITEM (ex: Salário)"
                                                            />
                                                        </div>
                                                        <div className="flex-[2] space-y-1">
                                                            <input
                                                                value={item.reference || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...(selectedItem.items || [])];
                                                                    newItems[index].reference = e.target.value;
                                                                    setSelectedItem({ ...selectedItem, items: newItems });
                                                                }}
                                                                className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg font-bold text-deep-navy text-[11px]"
                                                                placeholder="REFERÊNCIA"
                                                            />
                                                        </div>
                                                        <div className="w-24 space-y-1">
                                                            <input
                                                                type="number"
                                                                value={item.value || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...(selectedItem.items || [])];
                                                                    newItems[index].value = Number(e.target.value);
                                                                    const total = newItems.reduce((acc, curr) => acc + curr.value, 0);
                                                                    setSelectedItem({ ...selectedItem, items: newItems, value: total });
                                                                }}
                                                                className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg font-bold text-deep-navy text-[11px]"
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newItems = (selectedItem.items || []).filter((_, i) => i !== index);
                                                                const total = newItems.reduce((acc, curr) => acc + curr.value, 0);
                                                                setSelectedItem({ ...selectedItem, items: newItems, value: total });
                                                            }}
                                                            className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(selectedItem.items || []).length > 0 && (
                                                    <div className="pt-3 border-t border-primary/10 flex justify-between items-center px-2">
                                                        <span className="text-[9px] font-black text-primary uppercase">Total Automático</span>
                                                        <span className="text-xs font-black text-deep-navy">R$ {selectedItem.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Section */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Documento Padrão (Template)</label>
                                    <div className={cn(
                                        "border border-dashed rounded-xl p-3 px-4 flex items-center justify-between gap-4 transition-all",
                                        selectedItem.has_template ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 bg-slate-50/50 hover:border-primary/20"
                                    )}>
                                        {selectedItem.has_template ? (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-deep-navy uppercase">Template OK</p>
                                                        <p className="text-[8px] font-bold text-deep-navy/30 uppercase tracking-wider">Arquivo pronto p/ uso</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={selectedItem.template_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 bg-white text-deep-navy text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <Eye size={12} /> Ver
                                                    </a>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItem({ ...selectedItem, has_template: false, template_url: '' });
                                                        }}
                                                        className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                                                        title="Remover Template"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm border border-slate-100">
                                                        <Upload size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-deep-navy uppercase">Upload PDF</p>
                                                        <p className="text-[8px] font-bold text-deep-navy/30 uppercase tracking-wider">Clique para anexar o padrão</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    id="template-upload"
                                                    className="hidden"
                                                    accept=".pdf"
                                                    onChange={handleTemplateUpload}
                                                />
                                                <label
                                                    htmlFor="template-upload"
                                                    className="px-4 py-2 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-deep-blue transition-all cursor-pointer"
                                                >
                                                    Selecionar
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Approval Toggle */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                                selectedItem.requires_approval ? "bg-amber-100 text-amber-600" : "bg-white text-slate-300 shadow-sm border border-slate-100"
                                            )}>
                                                <UserCheck size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-deep-navy uppercase tracking-tight">Exigir Aprovação</p>
                                                <p className="text-[9px] font-bold text-deep-navy/30 uppercase tracking-widest">Validação superior necessária</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedItem({ ...selectedItem, requires_approval: !selectedItem.requires_approval })}
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-all relative p-1",
                                                selectedItem.requires_approval ? "bg-amber-500" : "bg-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                                selectedItem.requires_approval ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {selectedItem.requires_approval && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-2 overflow-hidden"
                                            >
                                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                    <Search size={12} /> Selecionar Aprovador
                                                </label>
                                                <select
                                                    value={selectedItem.approver_id || ''}
                                                    onChange={(e) => setSelectedItem({ ...selectedItem, approver_id: Number(e.target.value) })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-deep-navy text-sm focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Selecione um aprovador cadastrado...</option>
                                                    {approvers.map(approver => (
                                                        <option key={approver.id} value={approver.id}>{approver.name} ({approver.email})</option>
                                                    ))}
                                                </select>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-4">
                                    {selectedItem.requires_approval && !selectedItem.is_approved && user?.approver && (
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3 mb-2">
                                            <div className="flex items-center gap-3 text-amber-600">
                                                <AlertCircle size={20} />
                                                <p className="text-xs font-black uppercase tracking-widest">Ações de Aprovação Disponíveis</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApproval('approve')}
                                                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Check size={16} /> Aprovar Modelo
                                                </button>
                                                <button
                                                    onClick={() => handleApproval('reject')}
                                                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <X size={16} /> Reprovar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={async () => {
                                                await handleUpdateItem(selectedItem);
                                                await handleSaveIssuedReceipt({
                                                    id: receiptToEdit?.id || undefined,
                                                    receipt_type_id: selectedItem.id,
                                                    company_id: selectedItem.company_id,
                                                    employee_name: selectedItem.supplier_name,
                                                    employee_document: selectedItem.supplier_document,
                                                    amount: selectedItem.value,
                                                    payment_reason: selectedItem.payment_reason,
                                                    payment_date: selectedItem.date || new Date().toISOString().split('T')[0],
                                                    pix_key: selectedItem.pix_key,
                                                    status: selectedItem.requires_approval ? (selectedItem.is_approved ? 'approved' : 'pending') : 'approved',
                                                    created_by: user?.id
                                                });
                                            }}
                                            className="flex-1 py-3.5 bg-slate-100 text-deep-navy rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98] mt-2"
                                        >
                                            {receiptToEdit ? 'Atualizar Dados' : 'Efetivar Registro'}
                                        </button>
                                        <button
                                            disabled={selectedItem.requires_approval && !selectedItem.is_approved}
                                            onClick={async () => {
                                                // First save the model config
                                                await handleUpdateItem(selectedItem);

                                                // Then save as a permanent issued record
                                                await handleSaveIssuedReceipt({
                                                    id: receiptToEdit?.id || undefined, // use existing id if editing
                                                    receipt_type_id: selectedItem.id,
                                                    company_id: selectedItem.company_id,
                                                    employee_name: selectedItem.supplier_name,
                                                    employee_document: selectedItem.supplier_document,
                                                    amount: selectedItem.value,
                                                    payment_reason: selectedItem.payment_reason,
                                                    payment_date: selectedItem.date || new Date().toISOString().split('T')[0],
                                                    pix_key: selectedItem.pix_key,
                                                    status: selectedItem.requires_approval ? (selectedItem.is_approved ? 'approved' : 'pending') : 'approved',
                                                    created_by: user?.id
                                                });

                                                handleOpenPrint(selectedItem);
                                            }}
                                            className="flex-[2] py-3.5 bg-deep-navy text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-primary transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                        >
                                            <Printer size={18} />
                                            {selectedItem.requires_approval && !selectedItem.is_approved ? 'Bloqueado p/ Aprovação' : (receiptToEdit ? 'Atualizar e Gerar' : 'Efetivar e Gerar Recibo')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Company Management Modal */}
            <AnimatePresence>
                {isCompanyModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-7 relative border border-slate-200"
                        >
                            <button onClick={() => setIsCompanyModalOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                                <X size={18} />
                            </button>

                            <h3 className="text-xl font-black text-deep-navy tracking-tight uppercase mb-5">Gestão de <span className="text-primary">Empresas</span></h3>

                            <form onSubmit={handleAddCompany} className="space-y-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Nova Empresa</p>
                                <div className="grid grid-cols-1 gap-4">
                                    <input
                                        required
                                        value={newCompany.name}
                                        onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                        className="premium-input bg-white"
                                        placeholder="Nome da Empresa / Filial"
                                    />
                                    <input
                                        required
                                        value={newCompany.cnpj}
                                        onChange={e => setNewCompany({ ...newCompany, cnpj: formatDocument(e.target.value) })}
                                        className="premium-input bg-white"
                                        placeholder="00.000.000/0000-00 (CNPJ)"
                                        maxLength={18}
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-deep-blue transition-all flex items-center justify-center gap-3"
                                    >
                                        <Plus size={18} /> Cadastrar Empresa
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                <p className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest pl-1">Empresas Cadastradas</p>
                                {companies.map(company => (
                                    <div key={company.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-deep-navy uppercase">{company.name}</p>
                                                <p className="text-[9px] font-bold text-deep-navy/30">{company.cnpj}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCompany(company.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            {/* Models Management Modal */}
            <AnimatePresence>
                {
                    isModelsModalOpen && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="bg-primary p-5 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-4">
                                        <FileText size={24} />
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-widest">Gestão de Modelos / Templates</h4>
                                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Central de arquivos padrão por tipo de recibo</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModelsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {receiptSections.flatMap(s => s.items).map((item: any) => (
                                            <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                                        item.has_template ? "bg-emerald-50 text-emerald-500" : "bg-white text-slate-300"
                                                    )}>
                                                        {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-deep-navy uppercase tracking-tight leading-none mb-1">{item.label}</p>
                                                        <p className="text-[9px] font-bold text-deep-navy/30 uppercase tracking-widest leading-none">
                                                            {item.has_template ? 'Template Ativo' : 'Nenhum Template'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {item.has_template ? (
                                                        <>
                                                            <a
                                                                href={item.template_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 bg-white text-emerald-500 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-all shadow-sm"
                                                                title="Visualizar"
                                                            >
                                                                <Eye size={16} />
                                                            </a>
                                                            <button
                                                                onClick={async () => {
                                                                    const updated = { ...item, has_template: false, template_url: '' };
                                                                    await handleUpdateItem(updated);
                                                                }}
                                                                className="p-2.5 bg-white text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                                                                title="Remover"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="file"
                                                                id={`model-upload-${item.id}`}
                                                                className="hidden"
                                                                accept=".pdf"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    const url = await receiptConfigService.uploadTemplate(file);
                                                                    if (url) {
                                                                        await handleUpdateItem({ ...item, has_template: true, template_url: url });
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`model-upload-${item.id}`}
                                                                className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-deep-blue transition-all cursor-pointer"
                                                            >
                                                                UPLOAD
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                                    <button onClick={() => setIsModelsModalOpen(false)} className="px-8 py-2.5 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/30 hover:bg-deep-blue transition-all">
                                        Fechar Central
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Print Preview Modal */}
            <AnimatePresence>
                {
                    isPrintModalOpen && previewItem && (
                        <div className="fixed inset-0 z-[110] bg-[#0f172a]/80 backdrop-blur-md overflow-y-auto">
                            <div className="min-h-full flex items-start justify-center py-6 px-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                    className="bg-white p-0 relative shadow-2xl overflow-hidden print:shadow-none print:overflow-visible"
                                    style={{ width: '210mm', maxWidth: 'none' }}
                                >
                                    {/* Modal Header */}
                                    <div className="bg-primary p-8 flex justify-between items-center text-white no-print">
                                        <div className="flex items-center gap-4">
                                            <Printer size={24} />
                                            <div>
                                                <h4 className="text-lg font-black uppercase tracking-widest">Visualização do Recibo</h4>
                                                <div className="flex items-center gap-3 mt-1 no-print">
                                                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">Alterar Modelo:</p>
                                                    <select
                                                        value={previewItem.id}
                                                        onChange={(e) => {
                                                            const item = allAvailableModels.find(i => i.id === e.target.value);
                                                            if (item) setPreviewItem(item);
                                                        }}
                                                        className="bg-white/10 hover:bg-white/20 border border-white/10 rounded px-2 py-0.5 text-[10px] font-black uppercase outline-none transition-colors cursor-pointer"
                                                    >
                                                        {receiptSections.map(section => (
                                                            <optgroup key={section.id} label={section.section.toUpperCase()} className="bg-white text-primary text-[9px] font-black">
                                                                {section.items.map(item => (
                                                                    <option key={item.id} value={item.id} className="text-deep-navy font-bold">{item.label}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                disabled={previewItem.requires_approval && !previewItem.is_approved}
                                                onClick={async () => {
                                                    const entry = await handleEmitReceipt(previewItem);
                                                    if (entry) {
                                                        setPreviewItem({ ...previewItem, ...entry, entry_id: entry.id });
                                                    }
                                                    setTimeout(() => window.print(), 800);
                                                }}
                                                className="px-6 py-2 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Printer size={14} /> Imprimir Agora
                                            </button>
                                            <button
                                                onClick={() => setIsPrintModalOpen(false)}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actual Receipt Document - Exact print dimensions matched */}
                                    <div 
                                        className="bg-white flex flex-col items-center mx-auto print:p-0" 
                                        id="receipt-document"
                                        style={{ 
                                            width: '190mm', 
                                            minHeight: '277mm',
                                            padding: '10mm'
                                        }}
                                    >
                                        <div className="w-full border-4 border-double border-slate-900 p-6 space-y-6">

                                            <div className="flex flex-col items-center pb-6">
                                                <div className="w-full py-4 flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                    <img src="/logo.png" alt="Logo APOIO" className="w-[50px] h-auto" />
                                                </div>
                                            </div>

                                            {/* Receipt Header */}
                                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                                                <div className="space-y-1">
                                                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                                        RECIBO DE {previewItem.label}
                                                    </h1>
                                                    <div className="text-slate-900 text-xs font-black uppercase tracking-widest inline-block">
                                                        Nº do ID {previewItem.custom_id || ((previewItem as any).entry_id ? (previewItem as any).entry_id.slice(-6) : Math.floor(Math.random() * 9999).toString().padStart(4, '0'))} / {new Date().getFullYear()}
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-xl font-black text-slate-900">R$ {previewItem.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Valor do Documento</p>
                                                </div>
                                            </div>

                                            {/* Receipt Body */}
                                            <div className="space-y-4 py-4">
                                                <div className="text-justify leading-relaxed text-sm text-slate-800">
                                                    Recebemos da <span className="font-black uppercase">{companies.find(c => c.id === previewItem.company_id)?.name || '____________________'}</span>,
                                                    inscrita no CNPJ sob o nº <span className="font-black">{companies.find(c => c.id === previewItem.company_id)?.cnpj || '__.___.___/____-__'}</span>,
                                                    a importância de <span className="font-black">R$ {previewItem.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    ({/* TODO: Adicionar valor por extenso se necessário */}), referente a <span className="font-black uppercase underline">{previewItem.payment_reason || previewItem.label}</span>.
                                                </div>

                                                {/* Items Table - Show for all if items exist */}
                                                {previewItem.items && previewItem.items.length > 0 && (
                                                    <div className="mt-4 border border-slate-900">
                                                        <div className="bg-slate-900 text-white flex px-4 py-2 font-black uppercase text-[10px] tracking-widest">
                                                            <div className="flex-1">Descrição do Item</div>
                                                            <div className="w-40 text-center">Referência</div>
                                                            <div className="w-32 text-right">Valor (R$)</div>
                                                        </div>
                                                        <div className="divide-y divide-slate-200">
                                                            {previewItem.items.map((item, i) => (
                                                                <div key={i} className="flex px-4 py-2 text-xs font-bold text-slate-700">
                                                                    <div className="flex-1">{item.label}</div>
                                                                    <div className="w-40 text-center text-slate-400 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{item.reference || '-'}</div>
                                                                    <div className="w-32 text-right">R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                                </div>
                                                            ))}
                                                            <div className="flex px-4 py-2 text-[11px] font-black text-slate-900 bg-slate-50">
                                                                <div className="flex-1 uppercase">Total Consolidado</div>
                                                                <div className="w-40"></div>
                                                                <div className="w-32 text-right">R$ {previewItem.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {previewItem.pix_key && (
                                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Forma de Pagamento</p>
                                                            <p className="text-[10px] font-black text-slate-900 uppercase mt-1">Transferência via PIX</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Chave PIX</p>
                                                            <p className="text-xs font-black text-primary mt-1">{previewItem.pix_key}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <p className="text-base font-medium italic">
                                                    Favorecido: <span className="font-black not-italic uppercase">{previewItem.supplier_name || '__________________________'}</span>,
                                                    CPF/CNPJ: <span className="font-bold not-italic font-mono text-sm">{previewItem.supplier_document || '000.000.000-00'}</span>.
                                                </p>
                                                {previewItem.has_multiple_beneficiaries && (
                                                    <p className="text-base font-medium italic mt-2">
                                                        Demais Favorecidos: <span className="font-black not-italic uppercase">{previewItem.multiple_beneficiaries || '__________________________'}</span>
                                                    </p>
                                                )}

                                                {previewItem.requester && (
                                                    <p className="text-xs font-black text-slate-500 uppercase">
                                                        Solicitante: <span className="text-slate-900 underline decoration-slate-200">{previewItem.requester}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Footer Info */}
                                            <div className="pt-6 space-y-10">
                                                <p className="text-right text-base font-bold">
                                                    Brasília, {previewItem.date ? new Date(previewItem.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '____ de ____________ de ____'}
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                                                    <div className="space-y-2 text-center">
                                                        <div className="border-t border-slate-900 pt-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Favorecido</p>
                                                            <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">{previewItem.supplier_name || 'Nome Completo'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 text-center">
                                                        <div className="border-t border-slate-900 pt-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Emitente</p>
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{companies.find(c => c.id === previewItem.company_id)?.name || 'Carimbo da Empresa'}</p>
                                                            {user?.name && <p className="text-[9px] text-slate-400 uppercase font-bold">{user.name}</p>}
                                                            {previewItem.requires_approval && previewItem.is_approved && previewItem.approver_id && (
                                                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                                                                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest flex items-center justify-center gap-1">
                                                                        <UserCheck size={10} /> Autorizado por: {approvers.find(a => a.id === previewItem.approver_id)?.name || 'Aprovador'}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security Watermark */}
                                            <div className="text-center pt-10 no-print">
                                                <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.5em]">DOCUMENTO GERADO PELO SISTEMA DEPARTAMENTO PESSOAL - GENTE & GESTÃO</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer (Options) */}
                                    <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-between items-center no-print">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Info size={18} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Este documento serve como comprovante legal de quitação.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setIsPrintModalOpen(false)}
                                                className="px-8 py-3 bg-white text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                disabled={previewItem.requires_approval && !previewItem.is_approved}
                                                className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:bg-deep-blue transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={async () => {
                                                    const entry = await handleEmitReceipt(previewItem);
                                                    if (entry) {
                                                        setPreviewItem({ ...previewItem, ...entry, entry_id: entry.id });
                                                    }
                                                    setTimeout(() => window.print(), 800);
                                                }}
                                            >
                                                <Printer size={16} /> Imprimir Agora
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Receipt Selection Modal */}
            <AnimatePresence>
                {
                    isSelectionModalOpen && (
                        <div className="fixed inset-0 z-[150] bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
                            >
                                <div className="bg-primary p-8 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-widest">Selecione o Tipo de Recibo</h4>
                                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Escolha um modelo para iniciar o preenchimento</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSelectionModalOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X size={28} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 bg-[#f8fbff]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {receiptSections.flatMap(s => s.items).sort((a, b) => a.label.localeCompare(b.label)).map((item) => (
                                            <motion.button
                                                key={item.id}
                                                whileHover={{ y: -4, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    handleOpenConfig(item, true);
                                                    setIsSelectionModalOpen(false);
                                                }}
                                                className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-5 hover:border-primary/30 hover:shadow-premium transition-all text-left group"
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-deep-navy/20 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                                                    {React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement, { size: 24 }) : <FileText size={24} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-[11px] font-black text-deep-navy uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                                                        {item.label}
                                                    </h5>
                                                    <p className="text-[9px] font-bold text-deep-navy/30 uppercase tracking-widest leading-tight mt-0.5">
                                                        {item.subtext}
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-200 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
            </AnimatePresence>

            <AnimatePresence>
                {notification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, x: '-50%' }}
                        animate={{ opacity: 1, y: -40, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.95, x: '-50%', transition: { duration: 0.2 } }}
                        className={cn(
                            "fixed bottom-10 left-1/2 z-[200] bg-white border shadow-2xl rounded-2xl px-8 py-5 flex items-center gap-5 min-w-[450px] border-l-4",
                            notification.type === 'success' ? "border-emerald-500" : (notification.type === 'error' ? "border-rose-500" : "border-primary")
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                            notification.type === 'success' ? "bg-emerald-50 text-emerald-500" : (notification.type === 'error' ? "bg-rose-50 text-rose-500" : "bg-primary/10 text-primary")
                        )}>
                            {notification.type === 'success' ? <CheckCircle size={28} /> : (notification.type === 'error' ? <AlertCircle size={28} /> : <Info size={28} />)}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                                {notification.type === 'success' ? 'Operação Concluída' : (notification.type === 'error' ? 'Atenção / Erro' : 'Informação')}
                            </h4>
                            <p className={cn(
                                "text-[13px] font-black uppercase tracking-tight leading-none",
                                notification.type === 'success' ? "text-emerald-700" : (notification.type === 'error' ? "text-rose-700" : "text-deep-navy")
                            )}>
                                {notification.message}
                            </p>
                        </div>
                        <div className="ml-2 pl-4 border-l border-slate-100">
                            <button
                                onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                                className="p-2 text-slate-300 hover:text-deep-navy transition-all hover:bg-slate-50 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 4, ease: "linear" }}
                            className={cn(
                                "absolute bottom-0 left-0 h-1 origin-left rounded-b-2xl w-full",
                                notification.type === 'success' ? "bg-emerald-500" : (notification.type === 'error' ? "bg-rose-500" : "bg-primary")
                            )}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
