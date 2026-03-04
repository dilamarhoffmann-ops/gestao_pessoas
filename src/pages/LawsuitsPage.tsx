import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Gavel, Calendar, AlertTriangle, FileText, DollarSign, MapPin,
  Scale, Clock, ChevronDown, ChevronUp, Edit3, X, Search, Filter,
  CheckCircle, Check, Trash2, AlertOctagon, FileCheck, Layers,
  Upload, Download, FileJson, Trash
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { lawsuitsService } from '../lib/supabase-service';

type Lawsuit = {
  id: string | number;
  case_number: string;
  claimant_name: string;
  respondent_name: string;
  labor_court: string;
  tribunal: string;
  distribution_date: string;
  initial_hearing_date: string;
  instruction_hearing_date: string;
  defense_deadline: string;
  reply_deadline: string;
  expert_analysis_date: string;
  sentence_publication_date: string;
  appeal_deadline: string;
  main_claims: string;
  admission_date: string;
  termination_date: string;
  last_salary: number;
  cause_value: number;
  condemnation_value: number;
  appeal_deposit: number;
  risk_provision: 'Probable' | 'Possible' | 'Remote';
  court_costs: number;
  current_phase: string;
  last_progress: string;
  next_action: string;
  citation_date?: string;
  final_arguments_date?: string;
  sentence_result?: string;
  ro_filing_date?: string;
  rr_filing_date?: string;
  liquidation_date?: string;
  payment_citation_date?: string;
  asset_seizure_date?: string;
  payment_date?: string;
  archived_date?: string;
};

export default function LawsuitsPage() {
  const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLawsuit, setSelectedLawsuit] = useState<Lawsuit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name: string } | null>(null);
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | '7d' | '30d' | 'overdue' | 'none'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLawsuits();
  }, []);

  const fetchLawsuits = async () => {
    try {
      const data = await lawsuitsService.getAll();
      setLawsuits(data as Lawsuit[]);
    } catch (error) {
      console.error("Error fetching lawsuits:", error);
    }
  };

  const handleDeleteRequest = (id: string | number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await lawsuitsService.delete(deleteTarget.id);
      fetchLawsuits();
    } catch (error) {
      console.error("Delete error:", error);
      alert('Erro ao excluir registro.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (lawsuit: Lawsuit) => {
    setSelectedLawsuit(lawsuit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLawsuit(null);
  };

  const getNextDeadline = (l: Lawsuit) => {
    const ds = [l.initial_hearing_date, l.instruction_hearing_date, l.defense_deadline, l.reply_deadline, l.appeal_deadline]
      .filter(Boolean).map(d => new Date(d!));
    return ds.sort((a, b) => a.getTime() - b.getTime()).find(d => d > new Date()) ?? null;
  };

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const displayedLawsuits = lawsuits
    .filter(l => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.claimant_name?.toLowerCase().includes(q) ||
        l.case_number?.toLowerCase().includes(q) ||
        l.tribunal?.toLowerCase().includes(q) ||
        l.labor_court?.toLowerCase().includes(q)
      );
    })
    .filter(l => {
      if (deadlineFilter === 'all') return true;
      const deadlines = [l.initial_hearing_date, l.instruction_hearing_date, l.defense_deadline, l.reply_deadline, l.appeal_deadline]
        .filter(Boolean).map(d => new Date(d!));
      if (deadlineFilter === 'none') return deadlines.length === 0;
      if (deadlineFilter === 'overdue') return deadlines.some(d => d < now);
      if (deadlineFilter === '7d') return deadlines.some(d => d >= now && d <= in7);
      if (deadlineFilter === '30d') return deadlines.some(d => d >= now && d <= in30);
      return true;
    });

  const urgentCount = lawsuits.filter(l => { const nd = getNextDeadline(l); return nd && nd <= in7; }).length;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-10 space-y-10 animate-slide-up pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 transition-transform hover:rotate-3">
              <Scale size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-deep-navy tracking-tight uppercase">Contencioso <span className="text-primary">Jurídico</span></h2>
              <p className="text-deep-navy/40 font-bold text-sm tracking-tight">Dossiê estratégico, controle de prazos e auditoria de contingências processuais.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative">
              <button
                onClick={() => setFilterOpen(prev => !prev)}
                className={cn(
                  "flex-1 md:flex-none px-6 py-3.5 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm",
                  deadlineFilter !== 'all'
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-slate-100 text-deep-navy hover:bg-slate-50"
                )}
              >
                <Filter size={18} className={deadlineFilter !== 'all' ? 'text-white' : 'text-primary'} />
                {deadlineFilter === 'all' ? 'Filtrar Prazos' :
                  deadlineFilter === '7d' ? 'Próx. 7 Dias' :
                    deadlineFilter === '30d' ? 'Próx. 30 Dias' :
                      deadlineFilter === 'overdue' ? 'Vencidos' : 'Sem Prazo'}
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-50"
                  >
                    {([
                      { key: 'all', label: 'Todos os Processos' },
                      { key: '7d', label: 'Próximos 7 Dias' },
                      { key: '30d', label: 'Próximos 30 Dias' },
                      { key: 'overdue', label: 'Prazos Vencidos' },
                      { key: 'none', label: 'Sem Prazo Cadastrado' },
                    ] as const).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setDeadlineFilter(opt.key); setFilterOpen(false); }}
                        className={cn(
                          "w-full text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors",
                          deadlineFilter === opt.key
                            ? "bg-primary text-white"
                            : "text-deep-navy/60 hover:bg-slate-50"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none btn-premium shadow-xl shadow-primary/20"
            >
              <Plus size={20} /> Adicionar Processo
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-deep-navy/30 group-focus-within:text-primary transition-colors" size={20} />
          <input
            id="lawsuit-search-main"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/60 border border-slate-100 rounded-2xl py-6 pl-16 pr-8 text-sm font-bold text-deep-navy placeholder:text-deep-navy/20 outline-none focus:bg-white focus:border-primary/30 transition-all shadow-sm"
            placeholder="Pesquise por número do processo, nome do reclamante, vara ou tribunal..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner group-hover:scale-110 transition-transform">
                <Scale size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Processos Ativos</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Contencioso Geral</p>
              </div>
            </div>
            <span className="text-3xl font-black text-indigo-500 opacity-20">{displayedLawsuits.length}</span>
          </div>

          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Prazos Fatais</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Próximos 7 Dias</p>
              </div>
            </div>
            <span className="text-3xl font-black text-amber-500 opacity-20">{urgentCount}</span>
          </div>

          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all relative overflow-hidden">
            <div className="absolute top-4 right-6 bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
              AUDIT SCORE
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                <CheckCircle size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Conformidade</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Nível de Auditoria</p>
              </div>
            </div>
            <span className="text-3xl font-black text-emerald-500 opacity-20">98%</span>
          </div>
        </div>

        <div className="space-y-12">
          {Object.entries<Lawsuit[]>(
            displayedLawsuits.reduce((acc: Record<string, Lawsuit[]>, current) => {
              if (!acc[current.claimant_name]) acc[current.claimant_name] = [];
              acc[current.claimant_name].push(current);
              return acc;
            }, {})
          ).map(([claimant, group]) => (
            <div key={claimant} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="h-px w-8 bg-primary/20" />
                <h3 className="text-[11px] font-black text-deep-navy uppercase tracking-[0.5em] flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rotate-45" />
                  {claimant}
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 gap-8">
                {group.map((lawsuit) => (
                  <LawsuitCard
                    key={lawsuit.id}
                    lawsuit={lawsuit}
                    onEdit={() => handleEdit(lawsuit)}
                    onDelete={() => handleDeleteRequest(lawsuit.id, lawsuit.claimant_name)}
                  />
                ))}
              </div>
            </div>
          ))}

          {displayedLawsuits.length === 0 && (
            <div className="text-center py-24 glass-card rounded-3xl border-dashed">
              <Gavel className="mx-auto h-16 w-16 text-primary/20 mb-6" />
              <p className="text-deep-navy/40 font-black uppercase tracking-widest text-sm">
                {searchQuery || deadlineFilter !== 'all' ? 'Nenhum processo encontrado para os filtros aplicados' : 'Nenhum registro encontrado no sistema'}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <NewLawsuitModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onCreated={fetchLawsuits}
            initialData={selectedLawsuit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            name={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DeleteConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-navy/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md mx-4 shadow-2xl border-l-4 border-l-red-500 overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header faixa */}
        <div className="bg-red-500/5 px-6 pt-6 pb-4 flex gap-4 items-start">
          <div className="w-12 h-12 bg-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-deep-navy uppercase tracking-tight">Deseja excluir o registro?</h3>
            <p className="text-[11px] font-bold text-deep-navy/40 uppercase tracking-widest mt-1">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          <div className="border border-red-100 bg-red-50/50 p-4">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Registro Alvo</p>
            <p className="text-sm font-black text-deep-navy truncate">{name || 'Processo sem identificação'}</p>
          </div>

          <p className="text-sm font-medium text-deep-navy/60 leading-relaxed">
            O dossiê do reclamante abaixo será <span className="font-black text-deep-navy">removido permanentemente</span> do sistema.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-deep-navy/60 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Confirmar Exclusão
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const LawsuitCard: React.FC<{ lawsuit: Lawsuit; onEdit: () => void; onDelete: () => void }> = ({ lawsuit, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const deadlines = [
    lawsuit.initial_hearing_date,
    lawsuit.instruction_hearing_date,
    lawsuit.defense_deadline,
    lawsuit.reply_deadline,
    lawsuit.appeal_deadline
  ].filter(Boolean).map(d => new Date(d!));

  const nextDeadline = deadlines.sort((a, b) => a.getTime() - b.getTime()).find(d => d > new Date());
  const isUrgent = nextDeadline && nextDeadline < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getPhaseStatus = (phase: string) => {
    const current = lawsuit.current_phase?.toLowerCase() || '';
    if (current.includes(phase.toLowerCase())) return 'active';
    const phases = ['inicial', 'conhecimento', 'recursal', 'execução'];
    const currentIndex = phases.findIndex(p => current.includes(p));
    const targetIndex = phases.findIndex(p => phase.toLowerCase().includes(p));
    if (currentIndex > targetIndex) return 'completed';
    return 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-l-[6px] border-l-primary shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500"
    >
      <div className="p-0 border border-slate-100">
        <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
          <div className="p-8 xl:w-2/5 flex gap-8 items-start relative overflow-hidden bg-slate-50/20">
            <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 z-10 shrink-0">
              <Scale size={32} />
            </div>

            <div className="relative z-10 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-mono font-black border border-slate-200 bg-white text-deep-navy/60 px-2 py-0.5 rounded-sm">
                  {lawsuit.case_number}
                </span>
                <span className={cn("px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tight border",
                  lawsuit.risk_provision === 'Probable' ? "bg-accent-orange/10 text-accent-orange border-accent-orange/30" :
                    lawsuit.risk_provision === 'Possible' ? "bg-primary/10 text-primary border-primary/30" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200"
                )}>
                  Risco {lawsuit.risk_provision === 'Probable' ? 'Provável' : lawsuit.risk_provision === 'Possible' ? 'Possível' : 'Remoto'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h4 className="text-lg font-black text-deep-navy tracking-tight uppercase group-hover:text-primary transition-colors">{lawsuit.claimant_name}</h4>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-deep-navy/30 uppercase tracking-widest">Tribunal</p>
                  <p className="text-[11px] font-bold text-deep-navy/70 leading-tight">{lawsuit.tribunal || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-deep-navy/30 uppercase tracking-widest">Vara</p>
                  <p className="text-[11px] font-bold text-deep-navy/70 leading-tight">{lawsuit.labor_court || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <Scale size={120} />
            </div>
          </div>

          <div className="p-8 xl:w-2/5 bg-white space-y-4">
            <div className="flex justify-between items-center px-1">
              <p className="text-[9px] font-black text-deep-navy/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock size={12} className="text-primary" /> Jornada Processual
              </p>
              <div className="text-[10px] font-black text-primary underline underline-offset-4 decoration-primary/20">
                {lawsuit.current_phase || 'Iniciando'}
              </div>
            </div>

            {/* ── NOVO FLUXO VISUAL DE 6 ETAPAS ── */}
            {(() => {
              const STEPS = [
                { key: 'inicial', label: 'Inicial', icon: <FileText size={14} />, color: '#3b6ff5' },
                { key: 'citação', label: 'Citação', icon: <FileCheck size={14} />, color: '#5255d8' },
                { key: 'conhecimento', label: 'Mérito', icon: <Scale size={14} />, color: '#6b3ec4' },
                { key: 'perícia', label: 'Perícia', icon: <Layers size={14} />, color: '#8d2da8' },
                { key: 'recursal', label: 'Recursal', icon: <AlertTriangle size={14} />, color: '#b8226e' },
                { key: 'execução', label: 'Execução', icon: <Gavel size={14} />, color: '#e0224a' },
              ];
              const current = lawsuit.current_phase?.toLowerCase() || 'inicial';
              const activeIdx = STEPS.findIndex(s => current.includes(s.key));
              const effectiveIdx = activeIdx === -1 ? 0 : activeIdx;

              return (
                <div className="flex items-center w-full overflow-x-auto py-5 px-3 custom-scrollbar no-scrollbar">
                  {STEPS.map((step, idx) => {
                    const isDone = idx < effectiveIdx;
                    const isActive = idx === effectiveIdx;
                    const isPending = idx > effectiveIdx;
                    return (
                      <div key={step.key} className="flex items-center flex-1 min-w-[55px]">
                        {/* Node */}
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 shadow-sm relative z-10",
                              isDone ? "border-transparent text-white"
                                : isActive ? "border-transparent text-white scale-110 shadow-lg"
                                  : "border-slate-100 text-slate-300 bg-white"
                            )}
                            style={isDone || isActive ? {
                              background: `radial-gradient(circle at 40% 40%, ${step.color}cc, ${step.color})`,
                              boxShadow: isActive ? `0 4px 14px ${step.color}55` : undefined,
                            } : undefined}
                          >
                            {isDone ? <Check size={14} /> : React.cloneElement(step.icon as React.ReactElement, { size: 16 })}
                          </div>
                          {/* Number badge */}
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black mt-0.5",
                              isDone || isActive ? "text-white" : "bg-slate-100 text-slate-400"
                            )}
                            style={isDone || isActive ? {
                              background: step.color,
                            } : undefined}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <p className={cn(
                            "text-[7px] font-black uppercase tracking-tight text-center leading-tight whitespace-nowrap",
                            isActive ? "text-primary" : isDone ? "text-deep-navy/50" : "text-slate-300"
                          )}>{step.label}</p>
                        </div>

                        {/* Arrow connector */}
                        {idx < STEPS.length - 1 && (
                          <div className="flex-1 flex items-center justify-center px-0.5 mb-8 opacity-40">
                            <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                              <path d="M0 6 H18 M14 2 L20 6 L14 10" stroke={idx < effectiveIdx ? STEPS[idx].color : '#e2e8f0'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-6 mt-4">
              <div>
                <p className="text-[8px] font-black text-deep-navy/30 uppercase tracking-widest mb-1.5">Último Andamento</p>
                <p className="text-[11px] font-medium text-deep-navy/80 leading-relaxed line-clamp-2">
                  {lawsuit.last_progress || 'Nenhum andamento registrado até o momento.'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black text-accent-orange uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle size={10} /> Próxima Ação
                </p>
                <div className="text-[11px] font-black text-deep-navy leading-tight border-l-2 border-accent-orange/30 pl-3">
                  {lawsuit.next_action || 'Aguardando publicação.'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 xl:w-1/5 bg-slate-50/10 flex flex-col justify-between gap-6">
            <div className="space-y-4 text-right">
              <div>
                <p className="text-[9px] font-black text-deep-navy/30 uppercase tracking-widest mb-1">Próximo Prazo</p>
                {nextDeadline ? (
                  <div className={cn("flex items-center justify-end gap-2 text-base font-black tabular-nums tracking-tighter", isUrgent ? "text-accent-orange" : "text-deep-navy")}>
                    {format(nextDeadline, "dd/MM/yyyy")}
                    <div className={cn("w-2 h-2 rounded-full", isUrgent ? "bg-accent-orange animate-ping" : "bg-primary/40")} />
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-300">—</div>
                )}
              </div>
              <div>
                <p className="text-[9px] font-black text-deep-navy/30 uppercase tracking-widest mb-1">Valor da Causa</p>
                <div className="text-base font-black text-deep-navy tabular-nums tracking-tighter">
                  {formatCurrency(lawsuit.cause_value)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex-1 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest py-3 px-4 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> Detalhes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="bg-white border border-slate-200 text-deep-navy/40 hover:text-accent-orange hover:border-accent-orange transition-all duration-300 p-3"
                title="Excluir Registro"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  "px-4 border transition-all duration-300",
                  expanded ? "bg-deep-navy text-white border-deep-navy" : "bg-white text-deep-navy/40 border-slate-200 hover:text-deep-navy hover:border-slate-300"
                )}
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100 bg-[#fbfcfd] overflow-hidden"
            >
              <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-0.5 w-6 bg-primary" />
                    <h5 className="text-[10px] font-black text-deep-navy uppercase tracking-[0.2em]">Fluxo de Auditoria</h5>
                  </div>
                  <div className="space-y-4 p-8 bg-white border border-slate-100 shadow-sm">
                    <DateRow label="Distribuição" date={lawsuit.distribution_date} />
                    <DateRow label="Citação" date={lawsuit.citation_date || ''} />
                    <DateRow label="Audiência Inicial" date={lawsuit.initial_hearing_date} />
                    <DateRow label="Defesa" date={lawsuit.defense_deadline} highlight />
                    <DateRow label="Razões Finais" date={lawsuit.final_arguments_date || ''} />
                    <DateRow label="Sentença" date={lawsuit.sentence_publication_date} />
                    <DateRow label="Recurso" date={lawsuit.appeal_deadline} highlight />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-0.5 w-6 bg-emerald-500" />
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Exposição Financeira</h5>
                  </div>
                  <div className="space-y-5 p-8 bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                      <DollarSign size={100} />
                    </div>
                    <InfoBlock label="Média Salarial" value={formatCurrency(lawsuit.last_salary)} />
                    <div className="h-px bg-slate-50" />
                    <InfoBlock label="Condenação" value={formatCurrency(lawsuit.condemnation_value)} highlight />
                    <InfoBlock label="Depósito Recursal" value={formatCurrency(lawsuit.appeal_deposit)} />
                    <InfoBlock label="Custas Processuais" value={formatCurrency(lawsuit.court_costs)} />
                    <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-emerald-600">
                      <span className="text-[10px] font-black uppercase tracking-widest">Total Líquido</span>
                      <span className="text-base font-black">
                        {formatCurrency((lawsuit.condemnation_value || 0) + (lawsuit.court_costs || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-0.5 w-6 bg-accent-orange" />
                    <h5 className="text-[10px] font-black text-accent-orange uppercase tracking-[0.2em]">Dossiê de Pedidos</h5>
                  </div>
                  <div className="p-8 bg-white border border-slate-100 shadow-sm min-h-[200px]">
                    <p className="text-xs font-medium text-deep-navy/60 leading-relaxed border-l-2 border-slate-100 pl-6 h-full flex items-center">
                      "{lawsuit.main_claims || 'Os detalhes dos pedidos nucleares estão sendo catalogados pelo departamento jurídico.'}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

function DateRow({ label, date, highlight }: { label: string; date: string; highlight?: boolean }) {
  if (!date) return null;
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">{label}</span>
      <span className={cn("text-sm font-bold", highlight ? "text-accent-orange" : "text-deep-navy")}>
        {format(new Date(date), "dd/MM/yyyy")}
      </span>
    </div>
  );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">{label}</span>
      <span className={cn("text-sm font-bold", highlight ? "text-accent-orange" : "text-deep-navy")}>{value}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

function formatCurrency(val: number) {
  if (val === undefined || val === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function NewLawsuitModal({ isOpen, onClose, onCreated, initialData }: { isOpen: boolean; onClose: () => void; onCreated: () => void; initialData: Lawsuit | null }) {
  const [activeTab, setActiveTab] = useState('identificacao');
  const [localData, setLocalData] = useState<any>(initialData || {
    case_number: '',
    claimant_name: '',
    tribunal: '',
    labor_court: '',
    admission_date: '',
    termination_date: '',
    last_salary: '',
    current_phase: 'Inicial',
    last_progress: '',
    next_action: '',
    risk_provision: 'Possible'
  });

  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingStatus, setUploadingStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (initialData && activeTab === 'documentos') {
      fetchDocuments();
    }
  }, [activeTab, initialData]);

  const fetchDocuments = async () => {
    if (!initialData) return;
    try {
      const data = await lawsuitsService.getDocuments(initialData.id);
      setDocuments(data as any[]);
    } catch (error) {
      console.error("Error fetching docs:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !initialData) return;

    setUploadingStatus(prev => ({ ...prev, [type]: true }));

    try {
      await lawsuitsService.addDocument(initialData.id, file, type);
      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      alert('Erro no upload do arquivo.');
    } finally {
      setUploadingStatus(prev => ({ ...prev, [type]: false }));
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!initialData || !window.confirm('Deseja excluir este documento?')) return;
    try {
      await lawsuitsService.deleteDocument(docId);
      fetchDocuments();
    } catch (error) {
      console.error("Delete doc error:", error);
    }
  };


  const handleChange = (name: string, value: any) => {
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submissionData = { ...localData };
    const numericFields = ['last_salary', 'cause_value', 'condemnation_value', 'appeal_deposit', 'court_costs'];
    numericFields.forEach(field => {
      const val = submissionData[field];
      submissionData[field] = (val === '' || val === undefined || val === null) ? null : Number(val);
    });

    try {
      if (initialData) {
        await lawsuitsService.update(initialData.id, submissionData);
      } else {
        await lawsuitsService.create(submissionData);
      }
      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const tabs = [
    { id: 'identificacao', label: 'Cadastro Base' },
    { id: 'conhecimento', label: '1. Mérito' },
    { id: 'recursal', label: '2. Instância' },
    { id: 'execucao', label: '3. Ativos' },
    { id: 'financeiro', label: 'Auditoria' },
    ...(initialData ? [{ id: 'documentos', label: 'Documentos' }] : []),
  ];


  return (
    <div className="absolute inset-0 backdrop-blur-sm flex justify-center z-50 overflow-hidden animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[#f8fbff] w-full h-full relative flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden"
      >
        <div className="bg-white px-12 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-slate-100">
              <Scale size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy tracking-tight">
                {initialData ? 'Sincronizar Processo' : 'Registrar Novo Processo'}
              </h3>
              <p className="text-deep-navy/40 font-bold text-sm">Dossiê estratégico do contencioso para conformidade e auditoria legal.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="submit"
              form="lawsuit-form"
              className="px-8 py-3.5 bg-deep-blue text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-deep-blue/20"
            >
              <CheckCircle size={18} /> {initialData ? 'Salvar Auditoria' : 'Finalizar Registro'}
            </button>
            <button
              onClick={onClose}
              className="p-3.5 text-deep-navy/30 hover:text-deep-navy hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="bg-white px-12 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex gap-4 border-b border-slate-100/60 w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-deep-navy/40 hover:text-deep-navy"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-12 py-8 space-y-6">

            <form id="lawsuit-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-10 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-primary">
                    <FileText size={18} />
                    <h4 className="text-[10px] font-black text-deep-navy/60 uppercase tracking-[0.2em]">Painel de Controle Processual - {tabs.find(t => t.id === activeTab)?.label}</h4>
                  </div>
                  <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-black text-deep-navy/30 uppercase tracking-widest tabular-nums">
                    ID: {initialData?.id || 'NOVO'}
                  </div>
                </div>

                <div className="p-10">
                  {activeTab === 'identificacao' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-slide-up">
                      <div className="space-y-8">
                        <Input id="case_number" label="Número do Processo (CNJ)" name="case_number" placeholder="0000000-00.0000.0.00.0000" required value={localData.case_number} onChange={handleChange} highlightIcon={<Scale size={16} />} />
                        <Input id="claimant_name" label="Nome do Reclamante" name="claimant_name" placeholder="Nome Completo do Colaborador" required value={localData.claimant_name} onChange={handleChange} />
                        <div className="grid grid-cols-2 gap-8">
                          <Input id="labor_court" label="Vara do Trabalho" name="labor_court" placeholder="Ex: 12ª Vara de SP" value={localData.labor_court} onChange={handleChange} />
                          <Input id="tribunal" label="Tribunal" name="tribunal" placeholder="Ex: TRT-2" value={localData.tribunal} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="space-y-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock size={16} className="text-primary" />
                          <h5 className="text-[10px] font-black text-deep-navy uppercase tracking-widest">Informações do Vínculo</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <Input id="admission_date" label="Admissão" name="admission_date" type="date" value={localData.admission_date} onChange={handleChange} />
                          <Input id="termination_date" label="Desligamento" name="termination_date" type="date" value={localData.termination_date} onChange={handleChange} />
                        </div>
                        <Input id="last_salary" label="Última Remuneração" name="last_salary" type="number" step="0.01" value={localData.last_salary} onChange={handleChange} highlightIcon={<DollarSign size={16} />} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'conhecimento' && (
                    <div className="grid grid-cols-1 gap-12 animate-slide-up">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        <Input id="distribution_date" label="Distribuição" name="distribution_date" type="date" value={localData.distribution_date} onChange={handleChange} />
                        <Input id="citation_date" label="Citação / Notificação" name="citation_date" type="date" value={localData.citation_date} onChange={handleChange} />
                        <Input id="initial_hearing_date" label="Audiência Inicial" name="initial_hearing_date" type="date" value={localData.initial_hearing_date} onChange={handleChange} />
                        <Input id="defense_deadline" label="Prazo para Contestação" name="defense_deadline" type="date" value={localData.defense_deadline} onChange={handleChange} />
                        <Input id="reply_deadline" label="Réplica / Manifestação" name="reply_deadline" type="date" value={localData.reply_deadline} onChange={handleChange} />
                      </div>

                      <div className="bg-primary/5 p-12 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-5 rotate-12">
                          <Gavel size={200} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 text-deep-navy">
                          <div className="space-y-8">
                            <h5 className="text-[11px] font-black text-primary uppercase tracking-widest leading-relaxed">Pedidos Nucleares & Reintegração</h5>
                            <textarea
                              name="main_claims"
                              value={localData.main_claims}
                              onChange={(e) => handleChange('main_claims', e.target.value)}
                              placeholder="Descreva aqui os pedidos principais (Ex: Horas Extras, Insalubridade, Estabilidade...)"
                              className="w-full bg-white border border-primary/20 rounded-2xl p-6 text-sm font-medium placeholder:text-primary/20 focus:border-primary outline-none transition-all min-h-[150px] shadow-sm"
                            />
                          </div>
                          <div className="space-y-8">
                            <h5 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest leading-relaxed">Resultado Priorizado</h5>
                            <select
                              id="sentence_result"
                              name="sentence_result"
                              value={localData.sentence_result || ''}
                              onChange={(e) => handleChange('sentence_result', e.target.value)}
                              className="w-full bg-white border border-emerald-200 rounded-2xl p-6 text-sm font-black text-deep-navy outline-none focus:border-emerald-500 transition-all shadow-sm"
                            >
                              <option value="">Aguardando Sentença...</option>
                              <option value="Procedente">Procedente Total</option>
                              <option value="Parcial">Procedente em Parte</option>
                              <option value="Improcedente">Improcedente Total</option>
                              <option value="Acordo">Acordo Homologado</option>
                            </select>
                            <div className="grid grid-cols-2 gap-8 mt-4">
                              <Input id="expert_analysis_date" label="Data Perícia" name="expert_analysis_date" type="date" value={localData.expert_analysis_date} onChange={handleChange} />
                              <Input id="sentence_publication_date" label="Pub. Sentença" name="sentence_publication_date" type="date" value={localData.sentence_publication_date} onChange={handleChange} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}



                  {activeTab === 'recursal' && (
                    <div className="space-y-10 animate-slide-up">
                      {/* Timeline visual da fase recursal */}
                      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-primary flex items-center justify-center text-white rotate-45 shrink-0">
                            <Scale size={14} className="-rotate-45" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black text-primary uppercase tracking-widest">Fase Recursal</h5>
                            <p className="text-[10px] font-bold text-deep-navy/30 uppercase tracking-widest mt-0.5">Recursos Ordinário e de Revista</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <Input id="appeal_deadline" label="Prazo Recursal Geral" name="appeal_deadline" type="date" value={localData.appeal_deadline} onChange={handleChange} highlightIcon={<AlertTriangle size={14} />} />
                          <Input id="ro_filing_date" label="Recurso Ordinário" name="ro_filing_date" type="date" value={localData.ro_filing_date} onChange={handleChange} />
                          <Input id="rr_filing_date" label="Recurso de Revista" name="rr_filing_date" type="date" value={localData.rr_filing_date} onChange={handleChange} />
                        </div>
                      </div>

                      {/* Andamento e ação */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Último Andamento Recursal</label>
                          <textarea
                            name="last_progress"
                            value={localData.last_progress || ''}
                            onChange={(e) => handleChange('last_progress', e.target.value)}
                            placeholder="Ex: Recurso ordinário interposto e aguardando julgamento no TRT..."
                            className="w-full bg-white border border-slate-100 rounded-2xl p-6 text-sm font-medium placeholder:text-deep-navy/20 focus:border-primary outline-none transition-all min-h-[130px] shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-accent-orange/80 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <AlertTriangle size={12} /> Próxima Ação Crítica
                          </label>
                          <textarea
                            name="next_action"
                            value={localData.next_action || ''}
                            onChange={(e) => handleChange('next_action', e.target.value)}
                            placeholder="Ex: Aguardar publicação do acórdão e calcular prazo para embargos..."
                            className="w-full bg-white border border-slate-100 rounded-2xl p-6 text-sm font-medium placeholder:text-deep-navy/20 focus:border-accent-orange outline-none transition-all min-h-[130px] shadow-sm border-l-2 border-l-accent-orange/30"
                          />
                        </div>
                      </div>

                      {/* Fase atual */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-8 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest mb-1">Fase Atual do Processo</p>
                          <p className="text-xs font-bold text-deep-navy/50">Atualize conforme a movimentação no tribunal</p>
                        </div>
                        <select
                          name="current_phase"
                          value={localData.current_phase || 'Inicial'}
                          onChange={(e) => handleChange('current_phase', e.target.value)}
                          className="premium-input w-48 bg-white"
                        >
                          <option value="Inicial">Inicial</option>
                          <option value="Conhecimento">Conhecimento</option>
                          <option value="Recursal">Recursal</option>
                          <option value="Execução">Execução</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'execucao' && (
                    <div className="space-y-10 animate-slide-up">
                      {/* Linha do tempo de execução */}
                      <div className="bg-emerald-500/5 border border-emerald-200/40 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center text-white rotate-45 shrink-0">
                            <Gavel size={14} className="-rotate-45" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Fase de Execução</h5>
                            <p className="text-[10px] font-bold text-deep-navy/30 uppercase tracking-widest mt-0.5">Liquidação, Penhora e Pagamento</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <Input id="liquidation_date" label="Liquidação de Sentença" name="liquidation_date" type="date" value={localData.liquidation_date} onChange={handleChange} />
                          <Input id="payment_citation_date" label="Citação para Pagamento" name="payment_citation_date" type="date" value={localData.payment_citation_date} onChange={handleChange} />
                          <Input id="asset_seizure_date" label="Atos de Penhora" name="asset_seizure_date" type="date" value={localData.asset_seizure_date} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border border-slate-100 rounded-2xl p-8 space-y-6">
                          <h5 className="text-[10px] font-black text-deep-navy/50 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500" /> Encerramento
                          </h5>
                          <Input id="payment_date" label="Data do Pagamento" name="payment_date" type="date" value={localData.payment_date} onChange={handleChange} />
                          <Input id="archived_date" label="Data de Arquivamento" name="archived_date" type="date" value={localData.archived_date} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Observações da Execução</label>
                          <textarea
                            name="last_progress"
                            value={localData.last_progress || ''}
                            onChange={(e) => handleChange('last_progress', e.target.value)}
                            placeholder="Ex: Acordo realizado. Pagamento via depósito judicial em 3 parcelas..."
                            className="w-full bg-white border border-slate-100 rounded-2xl p-6 text-sm font-medium placeholder:text-deep-navy/20 focus:border-primary outline-none transition-all min-h-[160px] shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'financeiro' && (
                    <div className="grid grid-cols-1 gap-12 animate-slide-up">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <Input id="cause_value" label="Valor da Causa" name="cause_value" type="number" step="0.01" value={localData.cause_value} onChange={handleChange} highlightIcon={<DollarSign size={16} />} />
                        <Input id="condemnation_value" label="Valor Condenação" name="condemnation_value" type="number" step="0.01" value={localData.condemnation_value} onChange={handleChange} />
                        <Input id="appeal_deposit" label="Depósito Recursal" name="appeal_deposit" type="number" step="0.01" value={localData.appeal_deposit} onChange={handleChange} />
                        <Input id="court_costs" label="Custas Processuais" name="court_costs" type="number" step="0.01" value={localData.court_costs} onChange={handleChange} />
                      </div>

                      <div className="bg-deep-navy text-white p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-12 -bottom-12 opacity-10 rotate-12">
                          <DollarSign size={200} />
                        </div>
                        <div className="space-y-2 relative z-10 w-full md:w-1/2">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Análise de Risco Bruta</label>
                          <select
                            name="risk_provision"
                            value={localData.risk_provision}
                            onChange={(e) => handleChange('risk_provision', e.target.value)}
                            className="premium-input bg-white/10 border-white/20 text-white font-black"
                          >
                            <option value="Remote" className="text-deep-navy">Remota (0-25%)</option>
                            <option value="Possible" className="text-deep-navy">Possível (25-50%)</option>
                            <option value="Probable" className="text-deep-navy">Provável (50-100%)</option>
                          </select>
                          <p className="text-[11px] text-white/40 font-bold uppercase mt-4 leading-relaxed">Provisão financeira baseada em algoritmos de contingência jurídica.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documentos' && (
                    <div className="space-y-12 animate-slide-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Procuração */}
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-10 space-y-8 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                                <Scale size={24} />
                              </div>
                              <div>
                                <h5 className="text-[11px] font-black text-deep-navy uppercase tracking-widest">Procuração</h5>
                                <p className="text-[10px] font-bold text-deep-navy/30 uppercase tracking-widest mt-0.5">Representação Legal</p>
                              </div>
                            </div>
                            <label className={cn(
                              "cursor-pointer px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20",
                              uploadingStatus['procuracao'] && "opacity-50 pointer-events-none"
                            )}>
                              {uploadingStatus['procuracao'] ? 'Enviando...' : <><Upload size={14} /> Upload</>}
                              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'procuracao')} disabled={uploadingStatus['procuracao']} />
                            </label>
                          </div>

                          <div className="space-y-4">
                            {documents.filter(d => d.uploadType === 'procuracao').length === 0 ? (
                              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                                <FileText size={24} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma procuração enviada</p>
                              </div>
                            ) : (
                              documents.filter(d => d.uploadType === 'procuracao').map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-primary/20 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                      <FileText size={18} />
                                    </div>
                                    <div className="overflow-hidden max-w-[150px] md:max-w-[200px]">
                                      <p className="text-xs font-black text-deep-navy truncate" title={doc.fileName}>{doc.fileName}</p>
                                      <p className="text-[9px] font-bold text-deep-navy/40 uppercase tracking-widest">{format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="Ver Documento">
                                      <Download size={16} />
                                    </a>
                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all" title="Excluir">
                                      <Trash size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Preposto */}
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-10 space-y-8 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                                <CheckCircle size={24} />
                              </div>
                              <div>
                                <h5 className="text-[11px] font-black text-deep-navy uppercase tracking-widest">Preposto</h5>
                                <p className="text-[10px] font-bold text-deep-navy/30 uppercase tracking-widest mt-0.5">Carta de Preposição</p>
                              </div>
                            </div>
                            <label className={cn(
                              "cursor-pointer px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20",
                              uploadingStatus['preposto'] && "opacity-50 pointer-events-none"
                            )}>
                              {uploadingStatus['preposto'] ? 'Enviando...' : <><Upload size={14} /> Upload</>}
                              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'preposto')} disabled={uploadingStatus['preposto']} />
                            </label>
                          </div>

                          <div className="space-y-4">
                            {documents.filter(d => d.uploadType === 'preposto').length === 0 ? (
                              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                                <FileCheck size={24} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma carta enviada</p>
                              </div>
                            ) : (
                              documents.filter(d => d.uploadType === 'preposto').map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-primary/20 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                      <FileCheck size={18} />
                                    </div>
                                    <div className="overflow-hidden max-w-[150px] md:max-w-[200px]">
                                      <p className="text-xs font-black text-deep-navy truncate" title={doc.fileName}>{doc.fileName}</p>
                                      <p className="text-[9px] font-bold text-deep-navy/40 uppercase tracking-widest">{format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="Ver Documento">
                                      <Download size={16} />
                                    </a>
                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all" title="Excluir">
                                      <Trash size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem]">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h6 className="text-[10px] font-black text-deep-navy uppercase tracking-widest mb-1">Dica de Gestão</h6>
                            <p className="text-[11px] font-bold text-deep-navy/60 leading-relaxed uppercase">Mantenha os documentos de representação sempre atualizados para evitar nulidades processuais e garantir a conformidade nas audiências.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, name, type = "text", placeholder, required, value, onChange, step, highlightIcon, id }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; value?: any, onChange: (name: string, val: any) => void, step?: string, highlightIcon?: React.ReactNode, id?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 ml-1">
        {highlightIcon && <span className="text-primary">{highlightIcon}</span>}
        <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">{label}</label>
      </div>
      <input
        id={id || name}
        name={name}
        type={type}
        required={required}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        step={step}
        className="premium-input bg-white"
      />
    </div>
  );
}
