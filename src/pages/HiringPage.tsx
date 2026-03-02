import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Users, Mail, ArrowRight, CheckCircle, Search, Filter, Briefcase, ChevronRight, X, FileText, Paperclip, Upload, Scan, Download, Globe, UserSearch, Network, Handshake, TrendingUp, Trash2, Edit, Archive, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Candidate = {
  id: number;
  name: string;
  position: string;
  email: string;
  phone?: string;
  status: 'applied' | 'interview1' | 'interview2' | 'offer' | 'hired' | 'archived';
  interview_notes?: string;
  interview_notes_2?: string;
  resume_url?: string;
  match_score?: number;
  match_reason?: string;
  archive_reason?: string;
  observations?: string;
  status_updated_at?: string;
  disc_profile?: string;
  docs_delivered?: number;
  vt_delivered?: number;
  onboarding_date?: string;
  feedback_30?: string;
  feedback_60?: string;
  feedback_90?: string;
  contract_start_date?: string;
  contract_alert_acknowledged?: number;
  termination_date?: string;
};

const COLUMNS = [
  {
    id: 'applied',
    label: 'Fonte',
    description: 'Captação estratégica de talentos via multicanais.',
    color: 'bg-[#B1C3FF] border-[#97B0FF]',
    icon: <Globe size={32} />
  },
  {
    id: 'interview1',
    label: 'Análise',
    description: 'Triagem técnica e comportamental profunda.',
    color: 'bg-[#DCD4FF] border-[#CBB9FF]',
    icon: <UserSearch size={32} />
  },
  {
    id: 'interview2',
    label: 'Entrevista',
    description: 'Aprofundamento técnico e fit cultural.',
    color: 'bg-[#F1C6E7] border-[#E8AED7]',
    icon: <Network size={32} />
  },
  {
    id: 'offer',
    label: 'Efetivado',
    description: 'Processo de proposta e engajamento final.',
    color: 'bg-[#FFE2D1] border-[#FFD2B8]',
    icon: <Handshake size={32} />
  },
  {
    id: 'hired',
    label: 'Onboarding',
    description: 'Treinamento e evolução contínua da equipe.',
    color: 'bg-[#F9EBDB] border-[#EEDAC5]',
    icon: <TrendingUp size={32} />
  },
  {
    id: 'archived',
    label: 'Arquivados',
    description: 'Talentos em standby para futuras oportunidades.',
    color: 'bg-slate-200 border-slate-300',
    icon: <Archive size={32} />
  },
];

export default function HiringPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [candidateToArchive, setCandidateToArchive] = useState<number | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const res = await fetch('/api/candidates');
    const data = await res.json();
    setCandidates(data);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setCandidateToEdit(candidate);
    setIsModalOpen(true);
  };

  const handleMatch = async (id: number) => {
    try {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, match_score: -1 } : c)); // -1 representing loading
      const res = await fetch(`/api/candidates/${id}/match`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, match_score: data.match_score, match_reason: data.match_reason } : c));
      } else {
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, match_score: undefined, match_reason: undefined } : c));
      }
    } catch (error) {
      console.error(error);
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, match_score: undefined, match_reason: undefined } : c));
    }
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

  const handleArchiveRequest = (id: number) => {
    setCandidateToArchive(id);
    setIsArchiveModalOpen(true);
  };

  const confirmArchive = async (reason: string, date?: string) => {
    if (!candidateToArchive) return;
    await fetch(`/api/candidates/${candidateToArchive}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'archived',
        archive_reason: reason,
        termination_date: date || null
      }),
    });
    setIsArchiveModalOpen(false);
    setCandidateToArchive(null);
    fetchCandidates();
  };

  const handleRestart = async (id: number) => {
    await fetch(`/api/candidates/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'applied' }),
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
            <button
              onClick={() => navigate('/receipts')}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FileText size={18} className="text-primary" />
              Recibos
            </button>
            <button
              onClick={() => setIsJobModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
            >
              <Briefcase size={18} className="text-deep-navy" /> Vagas
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
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Fluxo de Contratação</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Candidatos Ativos</p>
              </div>
            </div>
            <span className="text-3xl font-black text-indigo-500 opacity-20">{candidates.filter(c => c.status !== 'archived').length}</span>
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
            <span className="text-3xl font-black text-amber-500 opacity-20">{candidates.filter(c => c.status === 'applied' || c.status === 'interview1' || c.status === 'interview2').length}</span>
          </div>

          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-premium transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner overflow-hidden relative group-hover:scale-110 transition-transform">
                <CheckCircle size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-0.5">Contratados & Onboarding</p>
                <p className="text-xl font-black text-deep-navy tracking-tight">Banco de Talentos</p>
              </div>
            </div>
            <span className="text-3xl font-black text-emerald-500 opacity-20">{candidates.filter(c => c.status === 'hired' || (c.status === 'offer' && c.docs_delivered && c.vt_delivered)).length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <div className="flex gap-6 min-w-max h-full pb-6">
            {COLUMNS.map((col) => (
              <div key={col.id} className={cn("w-[22rem] flex-shrink-0 rounded-[2.5rem] border p-8 flex flex-col transition-all shadow-sm", col.color)}>
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/40 rounded-2xl text-deep-navy shadow-inner">
                        {col.icon}
                      </div>
                      <h3 className="text-xl font-black text-deep-navy tracking-tighter">{col.label}</h3>
                    </div>
                    <span className="bg-white/60 px-3 py-1 rounded-lg text-xs font-black text-deep-navy shadow-sm backdrop-blur-md">
                      {candidates.filter(c => c.status === col.id).length}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-deep-navy/50 leading-relaxed uppercase tracking-widest">{col.description}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <AnimatePresence>
                    {candidates
                      .filter(c => c.status === col.id)
                      .map(candidate => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          onMove={() => moveCandidate(candidate.id, candidate.status)}
                          onArchive={() => handleArchiveRequest(candidate.id)}
                          onEdit={() => handleEditCandidate(candidate)}
                          onMatch={() => handleMatch(candidate.id)}
                          onRestart={() => handleRestart(candidate.id)}
                          onUpdate={fetchCandidates}
                        />
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
          <NewCandidateModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setCandidateToEdit(null);
            }}
            onCreated={fetchCandidates}
            candidateToEdit={candidateToEdit}
          />
        )}
        {isArchiveModalOpen && (
          <ArchiveModal
            isOpen={isArchiveModalOpen}
            onClose={() => setIsArchiveModalOpen(false)}
            onConfirm={confirmArchive}
            candidateId={candidateToArchive}
          />
        )}
        {isJobModalOpen && (
          <JobOpeningsModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} onCreated={() => { }} />
        )}
      </AnimatePresence>
    </>
  );
}

const CandidateCard: React.FC<{
  candidate: Candidate;
  onMove: () => void | Promise<void>;
  onArchive: () => void;
  onEdit: () => void;
  onMatch: () => void;
  onRestart?: () => void;
  onUpdate?: () => void;
}> = ({ candidate, onMove, onArchive, onEdit, onMatch, onRestart, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const handleCopyDiscLink = () => {
    const link = `${window.location.origin}/disc-assessment/${candidate.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layoutId={`candidate-${candidate.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group transition-all hover:shadow-premium hover:border-primary/20",
        candidate.status === 'archived' && "opacity-60 bg-slate-50"
      )}
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
        <div className="flex gap-1">
          {candidate.resume_url && (
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl bg-slate-50 text-deep-navy/40 hover:bg-slate-100 hover:text-primary flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              title="Download Currículo"
            >
              <Download size={14} />
            </a>
          )}
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-xl bg-slate-50 text-deep-navy/40 hover:bg-slate-100 hover:text-primary flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            title="Editar Candidato"
          >
            <Search size={14} />
          </button>
          {candidate.status !== 'archived' && (
            <button
              onClick={onArchive}
              className="w-8 h-8 rounded-xl bg-slate-50 text-deep-navy/40 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              title="Arquivar Candidato"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 pb-4 border-b border-slate-50">
        <div className="flex flex-col gap-1 text-[10px] text-deep-navy/40 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-primary/40" />
            <span className="truncate">{candidate.email}</span>
          </div>
          {candidate.status_updated_at && (
            <div className="flex items-center gap-2 mt-1 lowercase first-letter:uppercase">
              <TrendingUp size={10} className="text-primary/30" />
              <span>Fase alterada em: {new Date(candidate.status_updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {candidate.status === 'archived' && candidate.archive_reason && (
            <div className="flex flex-col gap-1 mt-2 text-[10px] text-rose-500 font-black uppercase tracking-widest bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
              <div className="flex items-center gap-2">
                <Archive size={12} />
                <span>Motivo: {candidate.archive_reason}</span>
              </div>
              {candidate.termination_date && (
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>Desligamento: {new Date(candidate.termination_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {candidate.status !== 'archived' && candidate.status !== 'applied' && (candidate.status === 'interview1' || (candidate.match_score !== undefined && candidate.match_score !== null)) && (
            <div className="flex items-center justify-between w-full">
              {candidate.match_score !== undefined && candidate.match_score !== null ? (
                candidate.match_score === -1 ? (
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 animate-pulse flex items-center gap-1">
                    <Scan size={12} /> Analisando IA...
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center justify-center gap-1 bg-emerald-50 px-2 py-1.5 rounded-md w-full">
                      <CheckCircle size={12} /> Match: {candidate.match_score}%
                    </div>
                    {candidate.disc_profile && (() => {
                      const acronymMatch = candidate.disc_profile.match(/\b([DISC]{1,2})\b/);
                      const acronym = acronymMatch ? acronymMatch[1] : candidate.disc_profile.replace(/[^DISC]/g, '').slice(0, 2);
                      return (
                        <div className="bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 flex items-center gap-2">
                          <FileText size={12} className="text-sky-600 shrink-0" />
                          <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">DISC:</span>
                          <span className="text-sm font-black text-sky-800 tracking-tight">{acronym || '—'}</span>
                        </div>
                      );
                    })()}
                    {candidate.status === 'interview1' && (
                      <button onClick={handleCopyDiscLink} className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 px-2 py-1.5 rounded-md transition-colors w-full ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                        {copied ? <CheckCircle size={12} /> : <FileText size={12} />}
                        {copied ? 'Link Copiado!' : 'Análise Comportamental (DISC)'}
                      </button>
                    )}
                  </div>
                )
              ) : candidate.status === 'interview1' ? (
                <div className="flex flex-col gap-2 w-full">
                  <button onClick={onMatch} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center justify-center gap-1 bg-indigo-50 px-2 py-1.5 rounded-md hover:bg-indigo-100 transition-colors w-full">
                    <Scan size={12} /> Aderência IA
                  </button>
                  {candidate.disc_profile && (() => {
                    const acronymMatch = candidate.disc_profile.match(/\b([DISC]{1,2})\b/);
                    const acronym = acronymMatch ? acronymMatch[1] : candidate.disc_profile.replace(/[^DISC]/g, '').slice(0, 2);
                    return (
                      <div className="bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 flex items-center gap-2">
                        <FileText size={12} className="text-sky-600 shrink-0" />
                        <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">DISC:</span>
                        <span className="text-sm font-black text-sky-800 tracking-tight">{acronym || '—'}</span>
                      </div>
                    );
                  })()}
                  <button onClick={handleCopyDiscLink} className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 px-2 py-1.5 rounded-md transition-colors w-full ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                    {copied ? <CheckCircle size={12} /> : <FileText size={12} />}
                    {copied ? 'Link Copiado!' : 'Análise Comportamental (DISC)'}
                  </button>
                </div>
              ) : null}
            </div>
          )}
          {candidate.status !== 'archived' && candidate.status !== 'applied' && candidate.status !== 'interview1' && !(candidate.match_score !== undefined && candidate.match_score !== null) && candidate.disc_profile && (() => {
            const acronymMatch = candidate.disc_profile.match(/\b([DISC]{1,2})\b/);
            const acronym = acronymMatch ? acronymMatch[1] : candidate.disc_profile.replace(/[^DISC]/g, '').slice(0, 2);
            return (
              <div className="bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 flex items-center gap-2">
                <FileText size={12} className="text-sky-600 shrink-0" />
                <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">DISC:</span>
                <span className="text-sm font-black text-sky-800 tracking-tight">{acronym || '—'}</span>
              </div>
            );
          })()}
        </div>
      </div>

      {candidate.status === 'offer' && (
        candidate.docs_delivered && candidate.vt_delivered ? (
          <div className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle size={14} /> Contratado
          </div>
        ) : (
          <div className="mt-4 w-full flex flex-col gap-2">
            <div className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock size={14} /> Pendente
            </div>
            <div className="flex gap-2 text-[9px] font-bold text-deep-navy/40 uppercase tracking-widest justify-center">
              {!candidate.docs_delivered && <span className="bg-slate-50 px-2 py-1 rounded-md">Docs</span>}
              {!candidate.vt_delivered && <span className="bg-slate-50 px-2 py-1 rounded-md">VT</span>}
            </div>
          </div>
        )
      )}

      {candidate.status === 'hired' && (
        <div className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <CheckCircle size={14} /> Em Onboarding
        </div>
      )}

      {candidate.status === 'archived' && (
        <div className="mt-4 space-y-3">
          {candidate.archive_reason && !candidate.archive_reason.startsWith('Outros') && candidate.termination_date && (() => {
            const termDate = new Date(candidate.termination_date + 'T12:00:00');
            const paymentDeadline = new Date(termDate);
            paymentDeadline.setDate(termDate.getDate() + 10);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            paymentDeadline.setHours(0, 0, 0, 0);

            const diffTime = paymentDeadline.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
              return (
                <div className={cn(
                  "p-3 rounded-xl border flex flex-col gap-1 items-center animate-pulse shadow-sm",
                  diffDays <= 2 ? "bg-red-50 border-red-200 text-red-600" : "bg-amber-50 border-amber-200 text-amber-600"
                )}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Prazo de Pagamento</span>
                  </div>
                  <p className="text-[9px] font-bold text-center">
                    Restam <strong>{diffDays} dias</strong> para o acerto <br />(Limite: {paymentDeadline.toLocaleDateString('pt-BR')})
                  </p>
                </div>
              );
            } else {
              return (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex flex-col gap-1 items-center opacity-70">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Prazo Encerrado</span>
                  </div>
                  <p className="text-[9px] font-bold text-center lowercase first-letter:uppercase">
                    O prazo de 10 dias expirou em {paymentDeadline.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              );
            }
          })()}
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
            <Archive size={14} /> Arquivado
          </div>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm shadow-primary/5 active:scale-95"
          >
            <TrendingUp size={14} /> Reiniciar Processo
          </button>
        </div>
      )}

      {candidate.status !== 'hired' && candidate.status !== 'archived' && (
        <button
          onClick={onMove}
          className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-slate-50 text-deep-navy/60 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
        >
          Próxima Etapa <ChevronRight size={14} />
        </button>
      )}

      {candidate.status === 'offer' && candidate.contract_start_date && !candidate.contract_alert_acknowledged && (() => {
        const signatureDate = new Date(candidate.contract_start_date + 'T12:00:00');
        const today = new Date();
        const diffTime = today.getTime() - signatureDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Alert starts at 83 days (one week before 90)
        if (diffDays >= 83) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-red-50 border border-red-300 space-y-3 shadow-sm shadow-red-100"
            >
              <div className="flex items-center gap-2 text-red-600">
                <Clock size={16} className="shrink-0 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Alerta de Experiência (90 dias)</p>
              </div>
              <p className="text-[10px] text-red-700 font-bold leading-relaxed lowercase first-letter:uppercase">O contrato de experiência completará 90 dias em breve (Dia {diffDays}). Verifique a efetivação definitiva.</p>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const formData = new FormData();
                  // No backend atualizado, se enviarmos apenas o ID e o campo de ciência, 
                  // os outros campos devem ser preservados ou o backend deve lidar com isso.
                  // Para garantir compatibilidade com o PUT atual que espera os campos base:
                  formData.set('name', candidate.name);
                  formData.set('position', candidate.position);
                  formData.set('email', candidate.email);
                  formData.set('contract_alert_acknowledged', '1');

                  // Preservar campos existentes para evitar que o PUT os apague
                  if (candidate.contract_start_date) formData.set('contract_start_date', candidate.contract_start_date);
                  if (candidate.onboarding_date) formData.set('onboarding_date', candidate.onboarding_date);

                  await fetch(`/api/candidates/${candidate.id}`, {
                    method: 'PUT',
                    body: formData
                  });
                  onUpdate?.(); // Only reload the list
                }}
                className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 text-[9px] font-black uppercase tracking-[0.15em] rounded-lg transition-all"
              >
                Dar Ciência do Prazo
              </button>
            </motion.div>
          );
        }
        return null;
      })()}
    </motion.div>
  );
}


function NewCandidateModal({ isOpen, onClose, onCreated, candidateToEdit }: { isOpen: boolean; onClose: () => void; onCreated: () => void; candidateToEdit?: Candidate | null }) {
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>(candidateToEdit?.phone || '');
  const [showEmpregareImport, setShowEmpregareImport] = useState(false);
  const [empregareJson, setEmpregareJson] = useState('');
  const [empregareData, setEmpregareData] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [formName, setFormName] = useState<string>(candidateToEdit?.name || '');
  const [formEmail, setFormEmail] = useState<string>(candidateToEdit?.email || '');
  const [formObservations, setFormObservations] = useState<string>(candidateToEdit?.observations || '');

  // Sync when editing a different candidate
  useEffect(() => {
    setPhone(applyPhoneMask(candidateToEdit?.phone || ''));
    setFormName(candidateToEdit?.name || '');
    setFormEmail(candidateToEdit?.email || '');
    setFormObservations(candidateToEdit?.observations || '');
    setEmpregareData(null);
    setEmpregareJson('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateToEdit?.id]);

  // Phone mask: (99) 99999-9999
  const applyPhoneMask = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleImportEmpregare = () => {
    try {
      const data = JSON.parse(empregareJson);
      if (data && data.pessoa) {
        setEmpregareData(data.pessoa);
        setPhone(applyPhoneMask(data.pessoa.celular || data.pessoa.telefone || ''));
        setFormName(data.pessoa.nome || '');
        setFormEmail(data.pessoa.email || '');
        setFormObservations(constructEmpregareObs(data.pessoa));
        setShowEmpregareImport(false);
        setEmpregareJson('');
      } else {
        alert('Formato de JSON inválido ou dados da pessoa "pessoa" não encontrados no JSON.');
      }
    } catch (e) {
      alert('Erro ao processar JSON. Certifique-se de que colou o conteúdo válido com estrutura de Objeto JSON válido.');
    }
  };

  const constructEmpregareObs = (p: any) => {
    let obsText = '';
    if (p.curriculo) {
      if (p.curriculo.sintese) obsText += `SÍNTESE EMPREGARE:\n${p.curriculo.sintese}\n\n`;
      if (p.curriculo.experiencia && p.curriculo.experiencia.length > 0) {
        obsText += `EXPERIÊNCIAS:\n`;
        p.curriculo.experiencia.forEach((exp: any) => {
          const year = exp.dataInicio ? new Date(exp.dataInicio).getFullYear() : '';
          obsText += `- ${exp.cargo} na ${exp.empresa} (${year})\n  ${exp.descricao}\n`;
        });
        obsText += '\n';
      }
      if (p.curriculo.formacao && p.curriculo.formacao.length > 0) {
        obsText += `FORMAÇÃO:\n`;
        p.curriculo.formacao.forEach((f: any) => {
          obsText += `- ${f.grauNome} em ${f.curso} (${f.local})\n`;
        });
      }
    }
    return obsText;
  };

  const handleMatch = async () => {
    if (!candidateToEdit?.id) return;
    try {
      setIsMatching(true);
      const res = await fetch(`/api/candidates/${candidateToEdit.id}/match`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMatchScore(data.match_score);
      } else {
        setMatchScore(null);
      }
    } catch (e) {
      console.error(e);
      setMatchScore(null);
    } finally {
      setIsMatching(false);
    }
  };

  const handleDelete = async () => {
    if (!candidateToEdit?.id) return;
    if (confirm('Tem certeza que deseja excluir este candidato da base?')) {
      await fetch(`/api/candidates/${candidateToEdit.id}`, { method: 'DELETE' });
      onCreated();
      onClose();
    }
  };

  useEffect(() => {
    fetch('/api/job-openings').then(res => res.json()).then(data => setJobOpenings(data));
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Override the form values exactly with React State directly
    // to guarantee we always send the injected values regardless of controlled inputs DOM state
    formData.set('name', formName);
    formData.set('phone', phone);
    formData.set('email', formEmail);

    // Only inject observations if we are on edit mode or if there are no values on DOM (safety pin)
    if (formObservations && formData.get('observations') === null) {
      formData.set('observations', formObservations);
    } // if dom input holds value, it will safely override

    // Checkboxes: FormData only includes them when checked.
    // Normalize to '1'/'0' so the server always receives a value.
    formData.set('docs_delivered', formData.has('docs_delivered') ? '1' : '0');
    formData.set('vt_delivered', formData.has('vt_delivered') ? '1' : '0');

    // Handle combined archive reason if "Outros" is selected
    const archiveMotive = formData.get('archive_reason') as string;
    if (archiveMotive === 'Outros') {
      const extra = formData.get('archive_reason_outros') as string;
      formData.set('archive_reason', `Outros: ${extra || ''}`);
    } else if (archiveMotive) {
      const obs = formData.get('archive_reason_obs') as string;
      if (obs) {
        formData.set('archive_reason', `${archiveMotive} - Obs: ${obs}`);
      }
    }

    try {
      setIsSaving(true);
      if (candidateToEdit) {
        await fetch(`/api/candidates/${candidateToEdit.id}`, {
          method: 'PUT',
          body: formData,
        });

        // Show success state on button
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        await fetch('/api/candidates', {
          method: 'POST',
          body: formData,
        });
      }
    } finally {
      setIsSaving(false);
    }

    onCreated();

    // Only close if creating a NEW candidate
    if (!candidateToEdit) {
      onClose();
    }

    setMatchScore(null);
    setIsMatching(false);
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
        {/* Loading Overlay */}
        {(isMatching || isSaving) && (
          <div className="jimu-loader-overlay">
            <div style={{ position: 'relative', width: '13.6px', height: '48px' }}>
              <div className="jimu-primary-loading" />
            </div>
            <span className="jimu-loader-label">
              {isMatching ? 'Analisando com IA...' : 'Salvando...'}
            </span>
          </div>
        )}
        {/* Modal Header - Optimized Proportions */}
        <div className="bg-white px-12 py-6 flex justify-between items-center gap-6 shrink-0 border-b border-slate-100 relative">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-slate-100">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy tracking-tight">{candidateToEdit ? "Edição de Talento" : "Captura de Novo Talento"}</h3>
              <p className="text-deep-navy/40 font-bold text-sm">Expansão de quadro estratégico e triagem de competências técnicas.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {empregareData && (
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="px-6 py-3.5 bg-indigo-50 text-indigo-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-3 shadow-sm border border-indigo-100"
              >
                <UserSearch size={18} /> Ver Dossiê Completo
              </button>
            )}
            {!candidateToEdit && (
              <button
                type="button"
                onClick={() => setShowEmpregareImport(!showEmpregareImport)}
                className="px-6 py-3.5 bg-sky-50 text-sky-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-sky-100 transition-all flex items-center gap-3 shadow-sm"
              >
                <Download size={18} /> Integrar Empregare
              </button>
            )}
            {candidateToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-8 py-3.5 bg-rose-50 text-rose-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-rose-100 transition-all flex items-center gap-3 shadow-sm"
              >
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <button
              type="submit"
              form="candidate-form"
              className={cn(
                "px-8 py-3.5 font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center gap-3 shadow-xl",
                showSuccess
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-deep-blue text-white hover:bg-primary shadow-deep-blue/20"
              )}
            >
              {showSuccess ? (
                <>
                  <CheckCircle size={18} /> Atualizado!
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> {candidateToEdit ? "Atualizar" : "Efetivar Registro"}
                </>
              )}
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

            {/* Empregare JSON Import Section */}
            <AnimatePresence>
              {showEmpregareImport && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="bg-sky-50/50 border border-sky-100 rounded-[2rem] p-8 mt-6 overflow-hidden shadow-inner"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-sky-700">
                      <Download size={24} />
                      <div>
                        <h4 className="font-black tracking-tight text-lg">Carga de Dados Empregare</h4>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Cole abaixo o JSON capturado da API de Pessoas.</p>
                      </div>
                    </div>
                    <textarea
                      value={empregareJson}
                      onChange={(e) => setEmpregareJson(e.target.value)}
                      className="premium-input bg-white min-h-[140px] resize-y p-4 text-xs font-mono text-sky-900 border-sky-200 focus:border-sky-400"
                      placeholder='{ "sucesso": true, "pessoa": { ... } }'
                    />
                    <div className="flex justify-end gap-4 mt-2">
                      <button type="button" onClick={() => { setShowEmpregareImport(false); setEmpregareJson(''); }} className="px-6 py-2.5 bg-white text-sky-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-50 transition-all border border-sky-200">
                        Cancelar
                      </button>
                      <button type="button" onClick={handleImportEmpregare} className="px-6 py-2.5 bg-sky-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-sky-700 transition-all shadow-md shadow-sky-600/20">
                        Processar JSON
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Simulator Container */}
            <div className="relative group mt-6">
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

              <form id="candidate-form" key={candidateToEdit?.id ?? 'new'} onSubmit={handleSubmit} className="p-10 space-y-10">
                <input type="hidden" name="contract_alert_acknowledged" value={candidateToEdit?.contract_alert_acknowledged || 0} />

                {/* Status lock helpers */}
                {(() => {
                  const statusOrder = ['applied', 'interview1', 'interview2', 'offer', 'hired', 'archived'];
                  const currentIdx = statusOrder.indexOf(candidateToEdit?.status || 'applied');
                  const isUnlocked = (requiredStatus: string) => {
                    // For new candidates (no edit), only section 1 is unlocked
                    if (!candidateToEdit) return requiredStatus === 'applied';
                    // archived unlocks its own section
                    if (requiredStatus === 'archived') return candidateToEdit.status === 'archived';
                    return currentIdx >= statusOrder.indexOf(requiredStatus);
                  };

                  const sectionLabel = (status: string) => {
                    const map: Record<string, string> = {
                      interview1: 'Análise', interview2: 'Entrevista',
                      offer: 'Efetivado', hired: 'Onboarding', archived: 'Arquivado'
                    };
                    return map[status] || status;
                  };

                  const LockOverlay = ({ requiredStatus }: { requiredStatus: string }) => (
                    <div className="absolute inset-0 rounded-[2rem] bg-slate-50/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3 border border-slate-200/60">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <Archive size={18} className="text-slate-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                        Disponível em<br />
                        <span className="text-slate-500">"{sectionLabel(requiredStatus)}"</span>
                      </p>
                    </div>
                  );

                  return (
                    <>
                      {/* 1. Fonte - always active */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#B1C3FF]/20 flex items-center justify-center text-deep-navy border border-[#B1C3FF]/30 font-black shrink-0">1</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Fonte</h5>
                          <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                        </div>
                        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 flex flex-col gap-8">
                          {/* 1. Dados Principais */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Nome Completo</label>
                                <input name="name_visual" value={formName} onChange={e => setFormName(e.target.value)} required className="premium-input bg-white border-slate-200 focus:border-primary/30" placeholder="Digite o nome..." />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                <input
                                  id="cand-phone"
                                  name="phone"
                                  type="tel"
                                  value={phone}
                                  onChange={e => setPhone(applyPhoneMask(e.target.value))}
                                  className="premium-input bg-white border-slate-200 focus:border-primary/30"
                                  placeholder="(99) 99999-9999"
                                  maxLength={15}
                                />
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Vaga Pretendida</label>
                                <select
                                  key={jobOpenings.length > 0 ? 'loaded' : 'loading'}
                                  name="position"
                                  defaultValue={candidateToEdit?.position || ""}
                                  required
                                  className="premium-input bg-white h-[46px] border-slate-200 focus:border-primary/30"
                                >
                                  <option value="">Selecione uma vaga...</option>
                                  {jobOpenings.map(job => (
                                    <option key={job.id} value={job.title}>{job.title} ({job.department})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Email</label>
                                <input id="cand-email" name="email_visual" value={formEmail} onChange={e => setFormEmail(e.target.value)} type="email" required className="premium-input bg-white border-slate-200 focus:border-primary/30" placeholder="email@exemplo..." />
                              </div>
                            </div>
                          </div>

                          {/* 2. Documentação e Consentimento - Lado a Lado */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {candidateToEdit?.resume_url ? (
                              <div className="flex items-center p-6 bg-primary/5 border border-primary/20 rounded-3xl gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/10 shrink-0">
                                  <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-deep-navy uppercase tracking-widest">Currículo Armazenado</p>
                                  <p className="text-xs text-primary font-bold mt-1 truncate">
                                    {candidateToEdit.resume_url.split('/').pop()}
                                  </p>
                                  <div className="flex gap-4 mt-2">
                                    <a href={candidateToEdit.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[9px] font-black text-primary hover:text-deep-blue uppercase tracking-widest transition-colors"><Scan size={12} /> Visualizar</a>
                                    <label className="flex items-center gap-1.5 text-[9px] font-black text-deep-navy/40 hover:text-primary uppercase tracking-widest cursor-pointer transition-colors"><Upload size={12} /> Substituir<input type="file" name="curriculo" accept=".pdf" className="hidden" /></label>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <label className="flex items-center p-6 bg-white border border-slate-200 rounded-3xl gap-4 group hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden shadow-sm h-full">
                                <input type="file" name="curriculo" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary shadow-inner transition-colors shrink-0"><Upload size={24} /></div>
                                <div><p className="text-[10px] font-black text-deep-navy uppercase tracking-widest">Upload Curriculo</p><p className="text-[10px] text-deep-navy/40 font-bold mt-1">Sincronize o perfil em PDF.</p></div>
                              </label>
                            )}

                            <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50 flex items-center justify-between h-full">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><CheckCircle size={20} /></div>
                                <div><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">Validação LGPD</p><p className="text-[10px] text-emerald-600/60 font-medium mt-1 uppercase tracking-tight">Consentimento Ativado</p></div>
                              </div>
                              <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer shadow-sm"><div className="w-4 h-4 bg-white rounded-full ml-auto" /></div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* 2. Análise - unlocked at interview1 */}
                      <div className={`space-y-6 transition-opacity duration-300 ${isUnlocked('interview1') ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#DCD4FF]/30 flex items-center justify-center text-deep-navy border border-[#DCD4FF]/50 font-black shrink-0">2</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Análise</h5>
                          {isUnlocked('interview1')
                            ? <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                            : <span className="ml-auto text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest">Bloqueado</span>
                          }
                        </div>
                        <div className="relative">
                          {!isUnlocked('interview1') && <LockOverlay requiredStatus="interview1" />}
                          <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Observações da Triagem Técnica</label>
                              <textarea name="observations_visual" value={formObservations} onChange={e => setFormObservations(e.target.value)} readOnly={!isUnlocked('interview1')} className={`premium-input bg-white min-h-[100px] resize-none p-4 text-sm border-slate-200 focus:border-primary/30 ${!isUnlocked('interview1') ? 'cursor-not-allowed opacity-50' : ''}`} placeholder="Aprofundamento na triagem técnica e fit comportamental inicial..." />
                            </div>
                            {candidateToEdit && candidateToEdit.resume_url && (
                              <button
                                type="button"
                                onClick={handleMatch}
                                className="mt-4 w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-50 text-indigo-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                                disabled={isMatching || !isUnlocked('interview1')}
                              >
                                <Scan size={18} /> {isMatching ? 'Analisando...' : matchScore !== null ? `Match: ${matchScore}%` : 'Aderência IA'}
                              </button>
                            )}
                            {candidateToEdit?.match_reason && (
                              <div className="mt-6 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 text-sm text-deep-navy/70 leading-relaxed shadow-sm">
                                <strong className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3"><Scan size={14} /> Parecer da Inteligência Artificial</strong>
                                {candidateToEdit.match_reason}
                              </div>
                            )}
                            {candidateToEdit?.disc_profile && (
                              <div className="mt-6 bg-sky-50/50 p-5 rounded-2xl border border-sky-100/50 text-sm text-deep-navy/70 leading-relaxed shadow-sm">
                                <strong className="text-sky-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3"><FileText size={14} /> Laudo Behaviorista do Candidato (DISC)</strong>
                                A inteligência e o questionário processaram que este candidato atua sob o: <strong>{candidateToEdit.disc_profile}</strong>.
                                Este parâmetro deve ser utilizado para validar se existe choque cultural com a equipe e com a posição antes da fase de Entrevista.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3. Entrevista - unlocked at interview2 */}
                      <div className={`space-y-6 transition-opacity duration-300 ${isUnlocked('interview2') ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#F1C6E7]/30 flex items-center justify-center text-deep-navy border border-[#F1C6E7]/50 font-black shrink-0">3</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Entrevista</h5>
                          {isUnlocked('interview2')
                            ? <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                            : <span className="ml-auto text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest">Bloqueado</span>
                          }
                        </div>
                        <div className="relative">
                          {!isUnlocked('interview2') && <LockOverlay requiredStatus="interview2" />}
                          <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#F1C6E7]/40 flex items-center justify-center text-deep-navy/60 text-[10px] font-black border border-[#F1C6E7]/50">1</div>
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">Fase 1 — Observações</label>
                              </div>
                              <textarea name="interview_notes" defaultValue={candidateToEdit?.interview_notes} disabled={!isUnlocked('interview2')} className="premium-input bg-white min-h-[100px] resize-none p-4 text-sm border-slate-200 focus:border-primary/30 disabled:cursor-not-allowed" placeholder="Relatos detalhados sobre o desempenho na primeira fase da entrevista..." />
                            </div>
                            <div className="border-t border-slate-100" />
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#F1C6E7]/40 flex items-center justify-center text-deep-navy/60 text-[10px] font-black border border-[#F1C6E7]/50">2</div>
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">Fase 2 — Observações</label>
                              </div>
                              <textarea name="interview_notes_2" defaultValue={candidateToEdit?.interview_notes_2} disabled={!isUnlocked('interview2')} className="premium-input bg-white min-h-[100px] resize-none p-4 text-sm border-slate-200 focus:border-primary/30 disabled:cursor-not-allowed" placeholder="Relatos detalhados sobre o desempenho na segunda fase da entrevista..." />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Efetivado - unlocked at offer */}
                      <div className={`space-y-6 transition-opacity duration-300 ${isUnlocked('offer') ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FFE2D1]/40 flex items-center justify-center text-deep-navy border border-[#FFE2D1]/50 font-black shrink-0">4</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Efetivado</h5>
                          {isUnlocked('offer')
                            ? <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                            : <span className="ml-auto text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest">Bloqueado</span>
                          }
                        </div>
                        <div className="relative">
                          {!isUnlocked('offer') && <LockOverlay requiredStatus="offer" />}
                          <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Checklist de Validação</label>
                              <div className="my-form bg-white p-6 rounded-2xl border border-slate-100">
                                <div>
                                  <input type="checkbox" id="docs_delivered_check" name="docs_delivered" value="true" defaultChecked={!!candidateToEdit?.docs_delivered} disabled={!isUnlocked('offer')} />
                                  <label htmlFor="docs_delivered_check">
                                    <span className="font-black text-xs">Documentação Entregue</span>
                                    <span className="block text-[10px] font-bold opacity-60 mt-0.5">RG, CPF, CTPS, comprovantes</span>
                                  </label>
                                </div>
                                <div>
                                  <input type="checkbox" id="vt_delivered_check" name="vt_delivered" value="true" defaultChecked={!!candidateToEdit?.vt_delivered} disabled={!isUnlocked('offer')} />
                                  <label htmlFor="vt_delivered_check">
                                    <span className="font-black text-xs">Vale Transporte</span>
                                    <span className="block text-[10px] font-bold opacity-60 mt-0.5">Cadastro e validação do VT</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-slate-100" />
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Termos e Condições da Proposta</label>
                              <textarea disabled={!isUnlocked('offer')} className="premium-input bg-white min-h-[80px] resize-none p-4 text-sm border-slate-200 focus:border-primary/30 disabled:cursor-not-allowed" placeholder="Detalhes do pacote de remuneração oferecido (não obrigatório para salvar)..." />
                            </div>
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Data da Assinatura do Contrato</label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="date"
                                  name="contract_start_date"
                                  defaultValue={candidateToEdit?.contract_start_date || ''}
                                  disabled={!isUnlocked('offer')}
                                  className="premium-input bg-white h-[46px] border-slate-200 focus:border-primary/30 max-w-xs disabled:cursor-not-allowed"
                                />
                                {candidateToEdit?.contract_start_date && (
                                  <div className="text-[9px] font-bold text-primary bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                                    90 dias em: {(() => {
                                      const d = new Date(candidateToEdit.contract_start_date + 'T12:00:00');
                                      d.setDate(d.getDate() + 90);
                                      return d.toLocaleDateString('pt-BR');
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 5. Onboarding - unlocked at hired */}
                      <div className={`space-y-6 transition-opacity duration-300 ${isUnlocked('hired') ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#F9EBDB]/60 flex items-center justify-center text-deep-navy border border-[#F9EBDB] font-black shrink-0">5</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Onboarding</h5>
                          {isUnlocked('hired')
                            ? <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                            : <span className="ml-auto text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest">Bloqueado</span>
                          }
                        </div>
                        <div className="relative">
                          {!isUnlocked('hired') && <LockOverlay requiredStatus="hired" />}
                          <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
                            <div className="flex flex-col gap-2">
                              <label htmlFor="onboarding_date_input" className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Data de Início do Onboarding</label>
                              <input
                                id="onboarding_date_input"
                                type="date"
                                name="onboarding_date"
                                defaultValue={candidateToEdit?.onboarding_date || ''}
                                disabled={!isUnlocked('hired')}
                                className="premium-input bg-white h-[46px] border-slate-200 focus:border-primary/30 max-w-xs disabled:cursor-not-allowed"
                              />
                            </div>
                            <div className="border-t border-slate-100" />
                            <div className="space-y-6">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Feedback de Acompanhamento</label>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-[9px] font-black border border-emerald-200">30</div>
                                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Feedback 30 Dias</label>
                                </div>
                                <textarea name="feedback_30" defaultValue={candidateToEdit?.feedback_30} disabled={!isUnlocked('hired')} className="premium-input bg-white min-h-[80px] resize-none p-4 text-sm border-slate-200 focus:border-emerald-300 disabled:cursor-not-allowed" placeholder="Avaliação de adaptação, integração com a equipe e primeiras entregas..." />
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-[9px] font-black border border-amber-200">60</div>
                                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Feedback 60 Dias</label>
                                </div>
                                <textarea name="feedback_60" defaultValue={candidateToEdit?.feedback_60} disabled={!isUnlocked('hired')} className="premium-input bg-white min-h-[80px] resize-none p-4 text-sm border-slate-200 focus:border-amber-300 disabled:cursor-not-allowed" placeholder="Evolução técnica, autonomia nas tarefas e pontos de atenção..." />
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 text-[9px] font-black border border-sky-200">90</div>
                                  <label className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Feedback 90 Dias</label>
                                </div>
                                <textarea name="feedback_90" defaultValue={candidateToEdit?.feedback_90} disabled={!isUnlocked('hired')} className="premium-input bg-white min-h-[80px] resize-none p-4 text-sm border-slate-200 focus:border-sky-300 disabled:cursor-not-allowed" placeholder="Consolidação do colaborador, metas atingidas e plano de desenvolvimento..." />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6. Arquivado - only when archived */}
                      <div className={`space-y-6 transition-opacity duration-300 ${isUnlocked('archived') ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-deep-navy border border-slate-300 font-black shrink-0">6</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Arquivado</h5>
                          {isUnlocked('archived')
                            ? <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Ativo</span>
                            : <span className="ml-auto text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest">Bloqueado</span>
                          }
                        </div>
                        <div className="relative">
                          {!isUnlocked('archived') && <LockOverlay requiredStatus="archived" />}
                          <div className="bg-rose-50/30 p-8 rounded-[2rem] border border-rose-100/50 space-y-8">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200 font-black shrink-0">6</div>
                              <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em]">Arquivado / Offboarding</h5>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Motivo do Desligamento</label>
                                <select
                                  name="archive_reason"
                                  defaultValue={candidateToEdit?.archive_reason?.startsWith('Outros:') ? 'Outros' : candidateToEdit?.archive_reason}
                                  disabled={!isUnlocked('archived')}
                                  className="premium-input bg-white h-[46px] border-slate-200 focus:border-rose-400/50 disabled:cursor-not-allowed font-bold"
                                >
                                  <option value="">Selecione...</option>
                                  <option value="Pedido de Demissão (Iniciativa do Colaborador)">Pedido de Demissão (Iniciativa do Colaborador)</option>
                                  <option value="Demissão Sem Justa Causa (Iniciativa da Empresa)">Demissão Sem Justa Causa (Iniciativa da Empresa)</option>
                                  <option value="Demissão Por Justa Causa (Falta Grave)">Demissão Por Justa Causa (Falta Grave)</option>
                                  <option value="Demissão por Comum Acordo">Demissão por Comum Acordo</option>
                                  <option value="Outros">Outros</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Data do Desligamento</label>
                                <input
                                  type="date"
                                  name="termination_date"
                                  defaultValue={candidateToEdit?.termination_date}
                                  disabled={!isUnlocked('archived')}
                                  className="premium-input bg-white h-[46px] border-slate-200 focus:border-rose-400/50 disabled:cursor-not-allowed font-bold"
                                />
                              </div>
                            </div>

                            {candidateToEdit?.archive_reason?.startsWith('Outros:') && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Complemento do Motivo</label>
                                <textarea
                                  name="archive_reason_outros"
                                  defaultValue={candidateToEdit?.archive_reason.replace('Outros: ', '')}
                                  disabled={!isUnlocked('archived')}
                                  className="premium-input bg-white min-h-[80px] resize-none p-4 text-sm border-slate-200 focus:border-rose-400/50 text-deep-navy/70 disabled:cursor-not-allowed"
                                  placeholder="Detalhes adicionais do desligamento..."
                                />
                              </div>
                            )}

                            {!candidateToEdit?.archive_reason?.startsWith('Outros:') && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Observações do Arquivamento</label>
                                <textarea
                                  name="archive_reason_obs"
                                  disabled={!isUnlocked('archived')}
                                  className="premium-input bg-white min-h-[80px] resize-none p-4 text-sm border-slate-200 focus:border-rose-400/50 text-deep-navy/70 disabled:cursor-not-allowed"
                                  placeholder="Forneça o contexto e a justificativa estratégica..."
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </form>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Empregare Dossiê Completo Modal (sobreposto) */}
      <AnimatePresence>
        {showProfileModal && empregareData && (
          <EmpregareProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} data={empregareData} />
        )}
      </AnimatePresence>
    </div>
  );
}


function JobOpeningsModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [jobToEdit, setJobToEdit] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const fetchJobs = async () => {
    const res = await fetch('/api/job-openings');
    const data = await res.json();
    setJobOpenings(data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleEditJob = (job: any) => {
    setJobToEdit(job);
    setSelectedDepartment(job.department || '');
    setIsCreating(true);
  };

  const handleDeleteJob = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta vaga?')) {
      await fetch(`/api/job-openings/${id}`, { method: 'DELETE' });
      fetchJobs();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const rawSalary = formData.get('salary') as string || '0';
    // Mapeando a entrada, quer use vírgula ou ponto
    const parsedSalary = parseFloat(rawSalary.replace(/\./g, '').replace(',', '.')) || Number(rawSalary) || 0;

    const data = {
      title: formData.get('title'),
      open_positions: parseInt(formData.get('open_positions') as string, 10) || 1,
      department: formData.get('department'),
      skills: formData.get('skills'),
      salary: parsedSalary,
    };

    try {
      let res;
      if (jobToEdit) {
        res = await fetch(`/api/job-openings/${jobToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch('/api/job-openings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) {
        throw new Error('Falha ao salvar a vaga.');
      }

      await fetchJobs();
      setIsCreating(false);
      setJobToEdit(null);
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao salvar o registro da vaga. Verifique os dados inseridos.');
    }
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
        <div className="bg-white px-12 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-slate-100">
              <Briefcase size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy tracking-tight">{isCreating ? (jobToEdit ? "Edição de Vaga" : "Cadastro de Nova Vaga") : "Gestão de Vagas"}</h3>
              <p className="text-deep-navy/40 font-bold text-sm">{isCreating ? "Abertura de posição e dimensionamento estratégico de time." : "Visualize e gerencie oportunidades em aberto."}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            {isCreating ? (
              <>
                <button
                  type="submit"
                  form="job-opening-form"
                  className="px-8 py-3.5 bg-deep-blue text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-deep-blue/20"
                >
                  <CheckCircle size={18} /> {jobToEdit ? "Atualizar Vaga" : "Publicar Vaga"}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setJobToEdit(null);
                    setSelectedDepartment('');
                  }}
                  className="px-8 py-3.5 bg-slate-100 text-deep-navy font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center gap-3"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => { setIsCreating(true); setSelectedDepartment(''); }}
                className="px-8 py-3.5 bg-deep-blue text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-deep-blue/20"
              >
                <Plus size={18} /> Nova Vaga
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3.5 text-deep-navy/30 hover:text-deep-navy hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-12 py-8 space-y-6">
            {isCreating ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-10 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-primary">
                    <Briefcase size={18} />
                    <h4 className="text-[10px] font-black text-deep-navy/60 uppercase tracking-[0.2em]">Formulário de Demanda</h4>
                  </div>
                </div>

                <form id="job-opening-form" key={jobToEdit?.id ?? 'new'} onSubmit={handleSubmit} className="p-10 space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Identificação da Posição</h5>
                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Nome da Vaga</label>
                          <input name="title" defaultValue={jobToEdit?.title} required className="premium-input bg-white" placeholder="Ex: Analista de Sistemas Senior" />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Departamento</label>
                            <select
                              name="department"
                              value={selectedDepartment}
                              onChange={e => setSelectedDepartment(e.target.value)}
                              required
                              className="premium-input bg-white h-[46px]"
                            >
                              <option value="">Selecione...</option>
                              <option value="Tecnologia">Tecnologia</option>
                              <option value="Financeiro">Financeiro</option>
                              <option value="Comercial">Comercial</option>
                              <option value="RH">Recursos Humanos</option>
                              <option value="Operações">Operações</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Vagas em Aberto</label>
                            <input name="open_positions" defaultValue={jobToEdit?.open_positions || 1} type="number" min="1" required className="premium-input bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Requisitos e Orçamento</h5>
                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Habilidades Exigidas</label>
                          <textarea
                            name="skills"
                            defaultValue={jobToEdit?.skills}
                            required
                            className="premium-input bg-white min-h-[100px] resize-none"
                            placeholder="Liste as competências técnicas e comportamentais necessárias..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Remuneração Base (R$)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-deep-navy/30">R$</span>
                            <input name="salary" defaultValue={jobToEdit?.salary} type="number" step="0.01" required className="premium-input bg-white pl-12" placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobOpenings.map(job => (
                  <div key={job.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-premium hover:border-primary/20 transition-all relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditJob(job)} className="p-2 bg-slate-50 text-deep-navy/40 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors" title="Editar Vaga">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteJob(job.id)} className="p-2 bg-slate-50 text-deep-navy/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Vaga">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-deep-navy pr-16">{job.title}</h4>
                      <p className="text-sm font-bold text-deep-navy/40">{job.department}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-deep-navy/60"><strong>Vagas em aberto:</strong> {job.open_positions}</p>
                      <p className="text-sm text-deep-navy/60"><strong>Salário:</strong> R$ {Number(job.salary).toFixed(2)}</p>
                      <p className="text-sm text-deep-navy/60 max-h-16 overflow-hidden text-ellipsis line-clamp-2"><strong>Habilidades:</strong> {job.skills}</p>
                    </div>
                  </div>
                ))}
                {jobOpenings.length === 0 && (
                  <div className="col-span-full py-12 text-center text-deep-navy/40 font-bold">Nenhuma vaga cadastrada. Cadastre a primeira oportunidade de sua equipe!</div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ArchiveModal({ isOpen, onClose, onConfirm, candidateId }: { isOpen: boolean; onClose: () => void; onConfirm: (reason: string, date?: string) => void; candidateId: number | null }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [terminationDate, setTerminationDate] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalReason = selectedOption === 'Outros' ? `Outros: ${customReason}` : selectedOption;
    if (!finalReason) {
      alert('Por favor, selecione um motivo para o arquivamento.');
      return;
    }

    if (selectedOption !== 'Outros' && !terminationDate) {
      alert('Por favor, informe a data do desligamento.');
      return;
    }

    onConfirm(finalReason, terminationDate);
  };

  const options = [
    'Pedido de Demissão (Iniciativa do Colaborador)',
    'Demissão Sem Justa Causa (Iniciativa da Empresa)',
    'Demissão Por Justa Causa (Falta Grave)',
    'Demissão por Comum Acordo',
    'Outros'
  ];

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-deep-navy/20 flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-[550px] rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden p-10 space-y-8"
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
            <Archive size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-deep-navy tracking-tight uppercase">Arquivar Registro</h3>
            <p className="text-deep-navy/40 font-bold text-[10px] uppercase tracking-widest mt-0.5">Informe o motivo estratégico do arquivamento.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Motivo do Desligamento</label>
            <select
              value={selectedOption}
              onChange={(e) => {
                setSelectedOption(e.target.value);
                if (e.target.value === 'Outros') setTerminationDate('');
              }}
              className="premium-input bg-slate-50 border-none h-[56px] px-6 text-sm font-bold text-deep-navy/70 cursor-pointer"
            >
              <option value="" disabled>Selecione uma opção...</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {selectedOption && selectedOption !== 'Outros' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Data do Desligamento (Início da Contagem de 10 dias)</label>
              <input
                type="date"
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
                className="premium-input bg-slate-50 border-none h-[56px] px-6 text-sm font-bold text-deep-navy/70"
              />
            </motion.div>
          )}

          {selectedOption === 'Outros' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Descreva o Motivo</label>
              <textarea
                autoFocus
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="premium-input bg-slate-50 border-none min-h-[100px] resize-none p-6 text-sm font-medium"
                placeholder="Informe detalhes adicionais..."
              />
            </motion.div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleConfirm}
            className="flex-1 px-8 py-3.5 bg-deep-navy text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all shadow-xl shadow-deep-navy/20 active:scale-95 disabled:opacity-50"
            disabled={!selectedOption || (selectedOption === 'Outros' && !customReason) || (selectedOption !== 'Outros' && !terminationDate)}
          >
            Confirmar Arquivamento
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-slate-100 text-deep-navy font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------------------------------------------------------
// NEW COMPONENT: Empregare Full Dossier Viewer
// -----------------------------------------------------------------------------------------------------------------------------------------

function EmpregareProfileModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: any }) {
  if (!isOpen || !data) return null;

  const formatDate = (isoStr: string) => {
    if (!isoStr || isoStr.startsWith('0001')) return 'Até o momento';
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-deep-navy/40 flex items-center justify-center z-[150] animate-in fade-in duration-300 p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#f8fbff] w-full max-w-5xl h-full rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        <div className="bg-white px-8 md:px-12 py-6 flex justify-between items-center shrink-0 border-b border-slate-100 relative shadow-sm z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 shrink-0">
              <img src={data.foto || "https://storage.empregare.com/pessoas/sem-foto.png"} alt="Foto Candidato" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy tracking-tight truncate">{data.nome}</h3>
              <p className="text-primary font-bold text-sm tracking-wide mt-0.5">Dossiê Estratégico do Candidato Integrado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3.5 text-deep-navy/30 hover:text-deep-navy hover:bg-slate-100 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Pessoais */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                <User size={16} /> Dados Pessoais
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-[9px] font-black text-deep-navy/40 uppercase tracking-widest mb-1">Nascimento</p>
                  <p className="font-bold text-deep-navy/80">{formatDate(data.dataNascimento)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-deep-navy/40 uppercase tracking-widest mb-1">Sexo</p>
                  <p className="font-bold text-deep-navy/80">{data.sexo === 'M' ? 'Masculino' : data.sexo === 'F' ? 'Feminino' : data.sexo}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-deep-navy/40 uppercase tracking-widest mb-1">Estado Civil</p>
                  <p className="font-bold text-deep-navy/80">{data.estadoCivil}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-deep-navy/40 uppercase tracking-widest mb-1">Filhos</p>
                  <p className="font-bold text-deep-navy/80">{data.filhos}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-deep-navy/40 uppercase tracking-widest mb-1">Localidade</p>
                  <p className="font-bold text-deep-navy/80">
                    {data.localidade?.cidade} - {data.localidade?.estado} <br />
                    <span className="text-xs text-deep-navy/50 font-medium">{data.localidade?.logradouro}, {data.localidade?.bairro}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contatos */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                <Network size={16} /> Contato & Redes
              </h4>
              <div className="flex flex-col gap-5 text-sm">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-deep-navy/40" />
                  <p className="font-bold text-deep-navy/80 truncate flex-1">{data.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <UserSearch size={16} className="text-deep-navy/40" />
                  <p className="font-bold text-deep-navy/80">{data.celular || data.telefone}</p>
                </div>
                {/* Redes Sociais */}
                {data.curriculo?.redeSocial?.length > 0 && (
                  <div className="pt-4 mt-2 border-t border-slate-50 flex flex-col gap-3">
                    {data.curriculo.redeSocial.map((social: any, idx: number) => (
                      <a key={idx} href={`https://${social.url.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase text-indigo-600 hover:text-indigo-800 transition-colors">
                        <Globe size={14} /> {social.id}: {social.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Currículo e Síntese */}
          {data.curriculo && (
            <div className="space-y-8">
              {data.curriculo.sintese && (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                    <FileText size={16} /> Síntese Profissional
                  </h4>
                  <p className="text-deep-navy/70 leading-relaxed text-sm font-medium whitespace-pre-line">
                    {data.curriculo.sintese}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Experiências Profissionais */}
                {data.curriculo.experiencia?.length > 0 && (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm col-span-1 lg:col-span-2">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                      <Briefcase size={16} /> Histórico Profissional
                    </h4>
                    <div className="space-y-8">
                      {data.curriculo.experiencia.map((exp: any, idx: number) => (
                        <div key={idx} className="relative pl-6 border-l-2 border-slate-100/60 pb-8 last:pb-0">
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                          <h5 className="font-black text-lg text-deep-navy">{exp.cargo}</h5>
                          <h6 className="font-bold text-deep-navy/50 text-sm">{exp.empresa} {exp.cidade ? `— ${exp.cidade}` : ''}</h6>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1.5 mb-4">
                            {formatDate(exp.dataInicio)} até {exp.atual ? 'O Momento' : formatDate(exp.dataFim)}
                          </p>
                          <p className="text-sm text-deep-navy/70 leading-relaxed font-medium whitespace-pre-line">{exp.descricao}</p>
                          {exp.resultado && (
                            <div className="mt-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Resultados Atingidos</p>
                              <p className="text-xs text-emerald-700 font-medium">{exp.resultado}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formação Acadêmica */}
                {data.curriculo.formacao?.length > 0 && (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm w-full">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                      <FileText size={16} /> Formação Acadêmica
                    </h4>
                    <div className="space-y-6">
                      {data.curriculo.formacao.map((form: any, idx: number) => (
                        <div key={idx}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 mb-1">{form.grauNome}</p>
                          <h6 className="font-black text-deep-navy">{form.curso}</h6>
                          <p className="text-sm font-bold text-deep-navy/60">{form.local}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-deep-navy/30 mt-1">
                            {form.incompleto ? 'Incompleto/Cursando' : `Conclusão em ${formatDate(form.dataFim)}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Idiomas & Informática / Cursos */}
                <div className="space-y-8 w-full">
                  {data.curriculo.idioma?.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                      <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                        <Globe size={16} /> Idiomas
                      </h4>
                      <div className="space-y-4">
                        {data.curriculo.idioma.map((idioma: any, idx: number) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <span className="font-black text-deep-navy text-sm">{idioma.idioma}</span>
                            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-deep-navy/40 flex-wrap">
                              <span className="bg-slate-50 px-2 py-1 rounded-md">Lê: {idioma.nivelLeitura}</span>
                              <span className="bg-slate-50 px-2 py-1 rounded-md">Escreve: {idioma.nivelEscrita}</span>
                              <span className="bg-slate-50 px-2 py-1 rounded-md">Fala: {idioma.nivelConversacao}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.curriculo.informatica?.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                        <Scan size={16} /> Informática & Ferramentas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {data.curriculo.informatica.map((info: any, idx: number) => (
                          <div key={idx} className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex gap-2 items-center">
                            <span className="text-xs font-black text-emerald-700">{info.nome}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/60 leading-none">{info.nivel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.curriculo.curso?.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                        <TrendingUp size={16} /> Cursos Complementares
                      </h4>
                      <div className="space-y-4">
                        {data.curriculo.curso.map((curso: any, idx: number) => (
                          <div key={idx}>
                            <h6 className="font-black text-deep-navy text-sm">{curso.curso}</h6>
                            <p className="text-xs font-bold text-deep-navy/60">{curso.local} ({curso.anoConclusao}) — {curso.horas}h</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
