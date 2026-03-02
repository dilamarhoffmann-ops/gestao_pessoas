import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, FileText, Upload, Download, AlertCircle, X, DollarSign, Clock, Filter, Paperclip, CheckCircle, Search, Scan, Users, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Discount = {
  id: number;
  employee_name: string;
  type: 'Adiantamento' | 'Gratificação';
  original_value: number;
  value: number;
  installments: number;
  status: 'step1_validation' | 'step2_manager' | 'step3_authorize' | 'step4_report' | 'step5_kardex' | 'completed';
  created_at: string;
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await fetch('/api/discounts');
      const data = await res.json();
      setDiscounts(data);
    } catch (error) {
      console.error('Failed to fetch discounts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, nextStatus: string) => {
    await fetch(`/api/discounts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchDiscounts();
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-10 space-y-10 animate-slide-up pb-20">
        {/* Premium Header Container */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 transition-transform hover:rotate-3">
              <DollarSign size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-deep-navy tracking-tight uppercase">Gestão de <span className="text-primary">Descontos</span></h2>
              <p className="text-deep-navy/40 font-bold text-sm tracking-tight">Fluxo de auditoria, documentação e conformidade financeira em tempo real.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate('/receipts')}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FileText size={18} className="text-primary" />
              Recibos
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none btn-premium shadow-xl shadow-primary/20"
            >
              <Plus size={20} /> Novo Lançamento
            </button>
          </div>
        </div>

        {/* Primary Context Search */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-deep-navy/30 group-focus-within:text-primary transition-colors" size={20} />
          <input
            id="discount-search-main"
            className="search-input"
            placeholder="Pesquise por colaborador, ID de transação ou tipo de lançamento..."
          />
        </div>

        {/* Discovery Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Validação"
            value={discounts.filter(d => d.status === 'step1_validation').length}
            icon={<Clock size={20} />}
            color="bg-slate-50 text-slate-500"
          />
          <StatCard
            label="Gerência"
            value={discounts.filter(d => d.status === 'step2_manager').length}
            icon={<Users size={20} />}
            color="bg-amber-50 text-amber-500"
          />
          <StatCard
            label="Autorização"
            value={discounts.filter(d => d.status === 'step3_authorize').length}
            icon={<CheckCircle size={20} />}
            color="bg-blue-50 text-blue-500"
          />
          <StatCard
            label="Relatório/DP"
            value={discounts.filter(d => d.status === 'step4_report').length}
            icon={<FileText size={20} />}
            color="bg-indigo-50 text-indigo-500"
          />
          <StatCard
            label="Finalizados"
            value={discounts.filter(d => d.status === 'completed').length}
            icon={<Check size={20} />}
            color="bg-emerald-50 text-emerald-500"
          />
        </div>

        {/* Main Table Container */}
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em]">Colaborador</th>
                  <th className="px-8 py-5 text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em]">Vlr. Original</th>
                  <th className="px-8 py-5 text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em]">Desconto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em]">Parc.</th>
                  <th className="px-8 py-5 text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em]">Etapa Atual</th>
                  <th className="px-8 py-5 text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-16 text-center text-deep-navy/30 font-bold uppercase tracking-widest text-xs">Sincronizando dados...</td></tr>
                ) : discounts.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-deep-navy/30 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</td></tr>
                ) : (
                  discounts.map((discount) => (
                    <tr key={discount.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-deep-navy">{discount.employee_name}</div>
                        <div className="text-[10px] text-deep-navy/30 uppercase font-bold tracking-wider mt-0.5">Tipo: {discount.type}</div>
                      </td>
                      <td className="px-8 py-5 font-mono text-xs text-deep-navy/60">
                        R$ {discount.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-5 font-black text-primary font-mono">
                        R$ {discount.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-5 text-deep-navy/60 font-medium">
                        {discount.installments}x
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={discount.status} />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <ActionButtons discount={discount} onUpdate={handleStatusUpdate} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <NewDiscountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={fetchDiscounts} />
        )}
      </AnimatePresence>
    </>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
      <div className="flex items-center gap-5">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", color)}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">{label}</p>
          <p className="text-xl font-black text-deep-navy tracking-tight">{label === 'Aprovados (Mês)' ? 'Finalizados' : 'Volume de Fluxo'}</p>
        </div>
      </div>
      <span className={cn("text-3xl font-black opacity-20", color.split(' ')[1])}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    step1_validation: 'bg-slate-100 text-slate-500 border-slate-200',
    step2_manager: 'bg-amber-100 text-amber-700 border-amber-200',
    step3_authorize: 'bg-blue-100 text-blue-700 border-blue-200',
    step4_report: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    step5_kardex: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const labels: Record<string, string> = {
    step1_validation: 'Validar Pendências',
    step2_manager: 'Gerência (Assinatura)',
    step3_authorize: 'Autorização (DP)',
    step4_report: 'Geração de Relatório',
    step5_kardex: 'Baixa Kardex',
    completed: 'Finalizado',
  };

  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border", styles[status] || 'bg-slate-100 text-slate-500 border-slate-200')}>
      {labels[status] || status}
    </span>
  );
}

function ActionButtons({ discount, onUpdate }: { discount: Discount; onUpdate: (id: number, status: string) => void }) {
  if (discount.status === 'completed') return <span className="text-emerald-600 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"><Check size={14} /> Finalizado</span>;

  // Step 2: Manager receives, generates, downloads, uploads, and transfers
  if (discount.status === 'step2_manager') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => alert("Gerando formulário para assinatura...")}
          className="p-2.5 rounded-xl bg-slate-100 text-deep-navy hover:bg-slate-200 transition-colors shadow-sm"
          title="Gerar Formulário"
        >
          <FileText size={16} />
        </button>
        <button
          onClick={() => alert("Baixando documento para assinatura...")}
          className="p-2.5 rounded-xl bg-slate-100 text-deep-navy hover:bg-slate-200 transition-colors shadow-sm"
          title="Download Documento"
        >
          <Download size={16} />
        </button>
        <button
          onClick={() => onUpdate(discount.id, 'step3_authorize')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md active:scale-95"
          title="Upload Assinado e Transferir"
        >
          <Upload size={14} /> Transferir
        </button>
      </div>
    );
  }

  // Step 3: Authorize discount and transfer to DP
  if (discount.status === 'step3_authorize') {
    return (
      <button
        onClick={() => onUpdate(discount.id, 'step4_report')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
      >
        <Check size={14} /> Autorizar e Enviar p/ DP
      </button>
    );
  }

  // Step 4: Generate reports, validate, schedule
  if (discount.status === 'step4_report') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => alert("Validando e agendando desconto...")}
          className="p-2.5 rounded-xl bg-slate-100 text-deep-navy hover:bg-slate-200 transition-colors shadow-sm"
          title="Validar/Agendar"
        >
          <Calendar size={16} />
        </button>
        <button
          onClick={() => onUpdate(discount.id, 'step5_kardex')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
        >
          <FileText size={14} /> Gerar Relatório
        </button>
      </div>
    );
  }

  // Step 5: Squad gives low in Kardex and finalizes
  if (discount.status === 'step5_kardex') {
    return (
      <button
        onClick={() => onUpdate(discount.id, 'completed')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md active:scale-95"
      >
        <CheckCircle size={14} /> Baixa Kardex & Finalizar
      </button>
    );
  }

  return (
    <div className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Aguardando...</div>
  );
}

function NewDiscountModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [lookupData, setLookupData] = useState<{
    company: string;
    periodStart: string;
    periodEnd: string;
    employee: string;
  }>({
    company: 'SÃO ROQUE - CORREA I',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-30',
    employee: ''
  });

  const [showKardex, setShowKardex] = useState(false);

  const mockKardex = [
    { desc: 'Diferença de Caixa Positiva', doc: '030126-3', date: '03/01/2026', obs: 'SOBRA DE CAIXA', in: 0.03, out: 0.00 },
    { desc: 'Diferença de Caixa Positiva', doc: '040126-1', date: '04/01/2026', obs: 'SOBRA DE CAIXA', in: 0.06, out: 0.00 },
    { desc: 'Diferença de Caixa Negativa', doc: '080126-1', date: '08/01/2026', obs: 'FALTA DE CAIXA', in: 0.00, out: 0.40 },
    { desc: 'Diferença de Caixa Negativa', doc: '090126-3', date: '09/01/2026', obs: 'FALTA DE CAIXA', in: 0.00, out: 0.01 },
    { desc: 'Diferença de Caixa Positiva', doc: '130126-3', date: '13/01/2026', obs: 'REFERENTE A CARTÃO NÃO LANÇADO', in: 40.03, out: 0.00 },
    { desc: 'Diferença de Caixa Negativa', doc: '140126-1', date: '14/01/2026', obs: 'REFERENTE AO CARTÃO LANÇADO NO DIA ANT.', in: 0.00, out: 39.99 },
    { desc: 'Diferença de Caixa Negativa', doc: '170126-2', date: '17/01/2026', obs: 'SEM JUSTIFICATIVA', in: 0.00, out: 189.98 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_name: lookupData.employee || formData.get('employee_name'),
        type: formData.get('type'),
        original_value: Number(formData.get('original_value')),
        value: Number(formData.get('discount_value')),
        installments: Number(formData.get('installments')),
        status: 'step2_manager'
      }),
    });

    onCreated();
    onClose();
  };

  return (
    <div className="absolute inset-0 backdrop-blur-sm flex justify-center z-50 overflow-hidden animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[#f8fbff] w-full h-full relative flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden"
      >
        {/* Modal Header - Optimized Proportions */}
        <div className="bg-white px-12 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-slate-100">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy tracking-tight">Novo Lançamento Financeiro</h3>
              <p className="text-deep-navy/40 font-bold text-sm">Registro de débitos e créditos vinculados ao colaborador.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="submit"
              form="discount-form"
              className="px-8 py-3.5 bg-deep-blue text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-deep-blue/20"
            >
              <Check size={18} /> Efetivar Lançamento
            </button>
            <button
              onClick={onClose}
              className="p-3.5 text-deep-navy/30 hover:text-deep-navy hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area - Optimized Spacing */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-12 py-8 space-y-10">

            {/* Selection Filters - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Empresa</label>
                <select
                  value={lookupData.company}
                  onChange={(e) => setLookupData({ ...lookupData, company: e.target.value })}
                  className="premium-input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%22%20fill%3D%22none%22%20stroke%3D%22%235483B3%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:18px] bg-[right_1.2rem_center] bg-no-repeat"
                >
                  <option>SÃO ROQUE - CORREA I</option>
                  <option>SÃO ROQUE - LOJA II</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Período Inicial</label>
                <input
                  type="date"
                  value={lookupData.periodStart}
                  onChange={(e) => setLookupData({ ...lookupData, periodStart: e.target.value })}
                  className="premium-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Período Final</label>
                <input
                  type="date"
                  value={lookupData.periodEnd}
                  onChange={(e) => setLookupData({ ...lookupData, periodEnd: e.target.value })}
                  className="premium-input"
                />
              </div>
            </div>



            {/* Kardex Pendencies Table */}
            {showKardex && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden"
              >
                <div className="bg-[#f1f5f9] px-10 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <FileText size={20} />
                    </div>
                    <h4 className="text-sm font-black text-deep-navy uppercase tracking-tight">Kardex Colaborador: <span className="text-primary">{lookupData.employee}</span></h4>
                  </div>
                  <div className="flex gap-10">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Inicial</p>
                      <p className="text-xs font-black text-deep-navy">R$ 2,11</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Final</p>
                      <p className="text-sm font-black text-rose-500">- R$ 187,94</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-8 py-4">Denominação</th>
                        <th className="px-8 py-4">Documento</th>
                        <th className="px-8 py-4">Emissão</th>
                        <th className="px-8 py-4">Empresa</th>
                        <th className="px-8 py-4">Observação</th>
                        <th className="px-8 py-4 text-right">Entrada</th>
                        <th className="px-8 py-4 text-right">Saída</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-deep-navy/70">
                      {mockKardex.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-3">{item.desc}</td>
                          <td className="px-8 py-3 text-slate-400">{item.doc}</td>
                          <td className="px-8 py-3">{item.date}</td>
                          <td className="px-8 py-3 text-[9px] opacity-60 uppercase">{lookupData.company}</td>
                          <td className="px-8 py-3 text-xs">{item.obs}</td>
                          <td className="px-8 py-3 text-right text-emerald-600 font-mono">R$ {item.in.toFixed(2)}</td>
                          <td className="px-8 py-3 text-right text-rose-500 font-mono">R$ {item.out.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 font-black">
                        <td colSpan={5} className="px-8 py-4 text-right text-[10px] uppercase tracking-widest">Total Acumulado</td>
                        <td className="px-8 py-4 text-right text-emerald-600 font-mono">R$ 41,12</td>
                        <td className="px-8 py-4 text-right text-rose-500 font-mono">R$ 230,39</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Main Form Section - High Contrast Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-10 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-primary">
                  <FileText size={18} />
                  <h4 className="text-[10px] font-black text-deep-navy/60 uppercase tracking-[0.2em]">Formulário Operacional de Lançamento</h4>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-black text-deep-navy/30 tabular-nums uppercase tracking-widest">
                  Total: R$ {0}
                </div>
              </div>

              <form id="discount-form" onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Identificação do Fluxo</h5>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Colaborador</label>
                        <input
                          id="disc-employee"
                          name="employee_name"
                          value={lookupData.employee}
                          onChange={(e) => {
                            setLookupData({ ...lookupData, employee: e.target.value });
                            if (e.target.value.length > 3) setShowKardex(true);
                            else setShowKardex(false);
                          }}
                          required
                          className="premium-input bg-white font-bold"
                          placeholder="Digite o nome do colaborador..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Modalidade</label>
                        <div className="relative">
                          <select name="type" className="premium-input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%22%20fill%3D%22none%22%20stroke%3D%22%235483B3%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:18px] bg-[right_1.2rem_center] bg-no-repeat">
                            <option value="Adiantamento">Adiantamento Salarial</option>
                            <option value="Gratificação">Gratificação / Bônus</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Cálculo do Desconto</h5>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Valor Original (R$)</label>
                          <input name="original_value" type="number" step="0.01" required defaultValue={showKardex ? 230.39 : 0} className="premium-input font-mono bg-white" placeholder="0,00" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Valor do Desconto (R$)</label>
                          <input name="discount_value" type="number" step="0.01" required defaultValue={showKardex ? 187.94 : 0} className="premium-input font-mono bg-white border-primary/30" placeholder="0,00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Quantidade de Parcelas</label>
                        <input name="installments" type="number" min="1" defaultValue="1" className="premium-input font-black bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

