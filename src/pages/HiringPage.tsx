import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Users, Mail, ArrowRight, CheckCircle, Search, Filter, Briefcase, ChevronRight, X, FileText, Paperclip, Upload, Scan, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type Candidate = {
  id: number;
  name: string;
  position: string;
  email: string;
  status: 'applied' | 'interview1' | 'interview2' | 'offer' | 'hired';
  interview_notes?: string;
};

const COLUMNS = [
  {
    id: 'applied',
    label: 'Fonte',
    description: 'Captação estratégica de talentos via multicanais.',
    color: 'bg-[#B1C3FF] border-[#92A7FF]',
    icon: <Scan size={32} />
  },
  {
    id: 'interview1',
    label: 'Tela',
    description: 'Triagem técnica e comportamental profunda.',
    color: 'bg-[#DCD4FF] border-[#C8BCFF]',
    icon: <FileText size={32} />
  },
  {
    id: 'interview2',
    label: 'Entrevista',
    description: 'Aprofundamento técnico e fit cultural.',
    color: 'bg-[#F1C6E7] border-[#E8AEDA]',
    icon: <Users size={32} />
  },
  {
    id: 'offer',
    label: 'Envolver-se',
    description: 'Processo de proposta e engajamento final.',
    color: 'bg-[#FFE2D1] border-[#FFD2B8]',
    icon: <Briefcase size={32} />
  },
  {
    id: 'hired',
    label: 'Upskill',
    description: 'Treinamento e evolução contínua da equipe.',
    color: 'bg-[#F9EBDB] border-[#EED7C5]',
    icon: <CheckCircle size={32} />
  },
];

export default function HiringPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const res = await fetch('/api/candidates');
    const data = await res.json();
    setCandidates(data);
  };

  const moveCandidate = async (id: number, currentStatus: string) => {
    const statusOrder = ['applied', 'interview1', 'interview2', 'offer', 'hired'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return;

    const nextStatus = statusOrder[currentIndex + 1];

    await fetch(`/api/candidates/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchCandidates();
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-10 space-y-10 animate-slide-up pb-20">
        {/* Premium Header Container */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 transition-transform hover:rotate-3">
              <Users size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-deep-navy tracking-tight uppercase">Gestão de <span className="text-primary">Talentos</span></h2>
              <p className="text-deep-navy/40 font-bold text-sm tracking-tight">Fluxo estratégico de admissão, triagem técnica e admissão offboarding.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={18} className="text-primary" />
              Filtros Avançados
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none btn-premium shadow-xl shadow-primary/20"
            >
              <Plus size={20} /> Novo Candidato
            </button>
          </div>
        </div>

        {/* Primary Context Search */}
        <div className="relative group mb-10 shrink-0">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-deep-navy/30 group-focus-within:text-primary transition-colors" size={20} />
          <input
            id="candidate-search"
            className="search-input"
            placeholder="Pesquise por nome, cargo, vertical ou e-mail de talentos..."
          />
        </div>

        {/* Discovery Stat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 shrink-0">
          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner overflow-hidden relative group-hover:scale-110 transition-transform">
                <Briefcase size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Vagas Abertas</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Fluxo de Contratação</p>
              </div>
            </div>
            <span className="text-3xl font-black text-indigo-500 opacity-20">{candidates.length + 5}</span>
          </div>

          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner overflow-hidden relative group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Em Triagem</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Processamento Ativo</p>
              </div>
            </div>
            <span className="text-3xl font-black text-amber-500 opacity-20">{candidates.filter(c => c.status !== 'hired').length}</span>
          </div>

          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner overflow-hidden relative group-hover:scale-110 transition-transform">
                <CheckCircle size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Efetivados</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Banco de Talentos</p>
              </div>
            </div>
            <span className="text-3xl font-black text-emerald-500 opacity-20">{candidates.filter(c => c.status === 'hired').length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <div className="flex gap-6 min-w-max h-full pb-6">
            {COLUMNS.map((col) => (
              <div key={col.id} className={cn("w-[22rem] flex-shrink-0 rounded-[2.5rem] border p-8 flex flex-col transition-all shadow-sm", col.color)}>
                <div className="flex flex-col gap-6 mb-10">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/40 rounded-2xl text-deep-navy shadow-inner mb-2">
                      {col.icon}
                    </div>
                    <span className="bg-white/60 px-3 py-1 rounded-lg text-xs font-black text-deep-navy shadow-sm backdrop-blur-md">
                      {candidates.filter(c => c.status === col.id).length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-deep-navy mb-3 tracking-tighter">{col.label}</h3>
                    <p className="text-[11px] font-bold text-deep-navy/50 leading-relaxed uppercase tracking-widest">{col.description}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <AnimatePresence>
                    {candidates
                      .filter(c => c.status === col.id)
                      .map(candidate => (
                        <CandidateCard key={candidate.id} candidate={candidate} onMove={() => moveCandidate(candidate.id, candidate.status)} />
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <NewCandidateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={fetchCandidates} />
        )}
      </AnimatePresence>
    </>
  );
}

const CandidateCard: React.FC<{ candidate: Candidate; onMove: () => void | Promise<void> }> = ({ candidate, onMove }) => {
  return (
    <motion.div
      layoutId={`candidate-${candidate.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group transition-all hover:shadow-premium hover:border-primary/20"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
            <h4 className="font-bold text-deep-navy group-hover:text-primary transition-colors">{candidate.name}</h4>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-deep-navy/40 font-black uppercase tracking-widest">
            <Briefcase size={10} />
            {candidate.position}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-deep-navy/50 font-medium pb-4 border-b border-slate-50">
        <Mail size={12} className="text-primary/40" />
        <span className="truncate">{candidate.email}</span>
      </div>

      {candidate.status !== 'hired' && (
        <button
          onClick={onMove}
          className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-slate-50 text-deep-navy/60 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
        >
          Próxima Etapa <ChevronRight size={14} />
        </button>
      )}

      {candidate.status === 'hired' && (
        <div className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle size={14} /> Contratado
        </div>
      )}
    </motion.div>
  );
}

function NewCandidateModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        position: formData.get('position'),
        email: formData.get('email'),
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
              <User size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy tracking-tight">Captura de Novo Talento</h3>
              <p className="text-deep-navy/40 font-bold text-sm">Expansão de quadro estratégico e triagem de competências técnicas.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="submit"
              form="candidate-form"
              className="px-8 py-3.5 bg-deep-blue text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-deep-blue/20"
            >
              <CheckCircle size={18} /> Efetivar Registro
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
          <div className="max-w-7xl mx-auto px-12 py-8 space-y-6">

            {/* Search Simulator Container */}
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-deep-navy/30 group-focus-within:text-primary transition-colors" size={20} />
              <input
                id="modal-candidate-search"
                className="search-input"
                placeholder="Pesquisar por nome, CPF ou competência..."
              />
            </div>

            {/* Stats Bar Simulator - 3 Columns for Recruitment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white px-8 py-5 rounded-3xl border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                    <Briefcase size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Triagem</p>
                    <p className="text-lg font-black text-deep-navy">Alinhamento</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-indigo-500 opacity-20">0</span>
              </div>

              <div className="bg-white px-8 py-5 rounded-3xl border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                    <Upload size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">CV Audit</p>
                    <p className="text-lg font-black text-deep-navy">Documentos</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-amber-500 opacity-20">0</span>
              </div>

              <div className="bg-white px-8 py-5 rounded-3xl border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all relative overflow-hidden">
                <div className="absolute top-3 right-5 bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                  Match Score
                </div>
                <div className="flex items-center gap-5 text-emerald-500">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <Scan size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Score AI</p>
                    <p className="text-lg font-black text-deep-navy">Aderência</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Section - High Contrast Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-10 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-primary">
                  <User size={18} />
                  <h4 className="text-[10px] font-black text-deep-navy/60 uppercase tracking-[0.2em]">Formulário de Ingresso Estratégico</h4>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">
                  Status: Novo
                </div>
              </div>

              <form id="candidate-form" onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Identificação Pessoal</h5>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input name="name" required className="premium-input bg-white" placeholder="Digite o nome..." />
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Cargo Pretendido</label>
                          <input id="cand-position" name="position" required className="premium-input bg-white" placeholder="Ex: Analista..." />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Email Corporativo</label>
                          <input id="cand-email" name="email" type="email" required className="premium-input bg-white" placeholder="email@exemplo..." />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Documentação e Validação</h5>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="flex items-center p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] gap-6 group hover:border-primary/20 transition-all cursor-pointer">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary shadow-sm transition-colors">
                          <Upload size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-deep-navy uppercase tracking-widest">Upload Curriculo (PDF)</p>
                          <p className="text-xs text-deep-navy/40 font-bold mt-1">Sincronize o perfil com o motor IA.</p>
                        </div>
                      </div>
                      <div className="bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">Validação LGPD</p>
                            <p className="text-[10px] text-emerald-600/60 font-medium mt-1 uppercase tracking-tight">Consentimento Ativado</p>
                          </div>
                        </div>
                        <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                        </div>
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


