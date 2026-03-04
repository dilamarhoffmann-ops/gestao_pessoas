import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Users, Mail, ArrowRight, CheckCircle, Search, Filter, Briefcase, ChevronRight, X, FileText, Paperclip, Upload, Scan, Download, Globe, UserSearch, Network, Handshake, TrendingUp, Trash2, Edit, Archive, Clock, Linkedin, Instagram, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { candidatesService, jobOpeningsService } from '../lib/supabase-service';
import { supabase } from '../lib/supabase';

type Candidate = {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  status: 'pool' | 'applied' | 'interview1' | 'interview2' | 'offer' | 'hired' | 'archived';
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
  raw_data?: any;
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
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState(false);
  const [isEmpregareImportModalOpen, setIsEmpregareImportModalOpen] = useState(false);
  const [candidateToArchive, setCandidateToArchive] = useState<Candidate | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const data = await candidatesService.getAll();
      setCandidates(data as Candidate[]);
    } catch (e) {
      console.error('Failed to fetch candidates:', e);
      alert('Failed to fetch candidates');
    }
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setCandidateToEdit(candidate);
    setIsModalOpen(true);
  };

  const handleMatch = async (id: string) => {
    try {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, match_score: -1 } : c)); // -1 representing loading
      const data = await candidatesService.matchCandidate(id);
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

  const moveCandidate = async (id: string, currentStatus: string) => {
    const statusOrder = ['applied', 'interview1', 'interview2', 'offer', 'hired'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return;

    const nextStatus = statusOrder[currentIndex + 1];

    await candidatesService.updateStatus(id, { status: nextStatus });
    fetchCandidates();
  };

  const handleArchiveRequest = (candidate: Candidate) => {
    setCandidateToArchive(candidate);
    setIsArchiveModalOpen(true);
  };

  const confirmArchive = async (reason: string, date?: string) => {
    if (!candidateToArchive) return;
    await candidatesService.updateStatus(candidateToArchive.id, {
      status: 'archived',
      archive_reason: reason,
      termination_date: date || null
    });
    setIsArchiveModalOpen(false);
    setCandidateToArchive(null);
    fetchCandidates();
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'candidate' | 'job'; name: string } | null>(null);

  const handleDeleteCandidate = async () => {
    if (!candidateToEdit?.id) return;
    setItemToDelete({ id: candidateToEdit.id, type: 'candidate', name: candidateToEdit.name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'candidate') {
      await candidatesService.delete(itemToDelete.id);
      setIsModalOpen(false);
      setCandidateToEdit(null);
      fetchCandidates();
    } else {
      await jobOpeningsService.delete(itemToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleRestart = async (id: string, status: 'pool' | 'applied' = 'applied') => {
    await candidatesService.updateStatus(id, { status });
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
              onClick={() => setIsJobModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center justify-center gap-2 hover:border-primary/30 transition-all shadow-sm"
            >
              <Briefcase size={18} className="text-primary" /> Vagas
            </button>
            <button
              onClick={() => setIsCandidatesModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center justify-center gap-2 hover:border-primary/30 transition-all shadow-sm"
            >
              <Users size={18} className="text-primary" /> Candidatos
            </button>
            <button
              onClick={() => setIsEmpregareImportModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3.5 bg-sky-600 text-white border border-sky-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-700 transition-all shadow-sm shadow-sky-600/20"
            >
              <Download size={18} /> Importar Empregare
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
                          onArchive={() => handleArchiveRequest(candidate)}
                          onEdit={() => handleEditCandidate(candidate)}
                          onMatch={() => handleMatch(candidate.id)}
                          onRestart={() => handleRestart(candidate.id, 'pool')}
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
            handleDeleteCandidate={handleDeleteCandidate}
          />
        )}
        {isArchiveModalOpen && (
          <ArchiveConfirmationModal
            isOpen={isArchiveModalOpen}
            onClose={() => {
              setIsArchiveModalOpen(false);
              setCandidateToArchive(null);
            }}
            onConfirm={confirmArchive}
            candidate={candidateToArchive}
          />
        )}
        {isJobModalOpen && (
          <JobOpeningsModal
            isOpen={isJobModalOpen}
            onClose={() => setIsJobModalOpen(false)}
            onCreated={() => { }}
            onDelete={(id, name) => {
              setItemToDelete({ id, type: 'job', name });
              setIsDeleteModalOpen(true);
            }}
          />
        )}
        {isDeleteModalOpen && itemToDelete && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setItemToDelete(null);
            }}
            onConfirm={confirmDelete}
            title={itemToDelete.type === 'candidate' ? "Excluir Candidato" : "Excluir Vaga"}
            message={itemToDelete.type === 'candidate'
              ? `Tem certeza que deseja excluir o candidato ${itemToDelete.name} da base? Esta ação é irreversível.`
              : `Tem certeza que deseja excluir a vaga ${itemToDelete.name}? Esta ação é irreversível.`
            }
          />
        )}
        {isCandidatesModalOpen && (
          <CandidatesManagementModal
            isOpen={isCandidatesModalOpen}
            onClose={() => setIsCandidatesModalOpen(false)}
            candidates={candidates}
            onEdit={handleEditCandidate}
            onNew={() => {
              setIsCandidatesModalOpen(false);
              setIsModalOpen(true);
            }}
            onInitiate={(id) => {
              handleRestart(id, 'applied');
              setIsCandidatesModalOpen(false);
            }}
          />
        )}
        {isEmpregareImportModalOpen && (
          <EmpregareImportModal
            isOpen={isEmpregareImportModalOpen}
            onClose={() => setIsEmpregareImportModalOpen(false)}
            onImported={() => { fetchCandidates(); setIsEmpregareImportModalOpen(false); }}
          />
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
            onClick={() => onRestart?.()}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-100 active:scale-95 border border-indigo-100"
          >
            <Users size={14} /> Retornar ao Banco de Talentos
          </button>
        </div>
      )}

      {candidate.status !== 'hired' && candidate.status !== 'archived' && (
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onMove}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-slate-50 text-deep-navy/60 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            Próxima Etapa <ChevronRight size={14} />
          </button>

          {candidate.status === 'applied' && (
            <button
              onClick={onArchive}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all active:scale-95 border border-orange-100/50"
            >
              <Trash2 size={14} /> Excluir do Fluxo
            </button>
          )}
        </div>
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

                  await candidatesService.update(candidate.id, {
                    contract_alert_acknowledged: true
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


function NewCandidateModal({ isOpen, onClose, onCreated, candidateToEdit, handleDeleteCandidate }: { isOpen: boolean; onClose: () => void; onCreated: () => void; candidateToEdit?: Candidate | null; handleDeleteCandidate: () => void }) {
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

  // Full Data Integration State
  const [birthDate, setBirthDate] = useState(candidateToEdit?.raw_data?.dataNascimento?.split('T')[0] || '');
  const [gender, setGender] = useState(candidateToEdit?.raw_data?.sexo || '');
  const [maritalStatus, setMaritalStatus] = useState(candidateToEdit?.raw_data?.estadoCivil || '');
  const [cep, setCep] = useState(candidateToEdit?.raw_data?.localidade?.cep || '');
  const [address, setAddress] = useState(candidateToEdit?.raw_data?.localidade?.logradouro || '');
  const [neighborhood, setNeighborhood] = useState(candidateToEdit?.raw_data?.localidade?.bairro || '');
  const [city, setCity] = useState(candidateToEdit?.raw_data?.localidade?.cidade || '');
  const [state, setState] = useState(candidateToEdit?.raw_data?.localidade?.estado || '');
  const [salaryExpectation, setSalaryExpectation] = useState(candidateToEdit?.raw_data?.curriculo?.pretensaoSalarial || '');
  const [synthesis, setSynthesis] = useState(candidateToEdit?.raw_data?.curriculo?.sintese || '');
  const [linkedin, setLinkedin] = useState(candidateToEdit?.raw_data?.curriculo?.redeSocial?.find((r: any) => r.id === 'LinkedIn')?.url || '');
  const [instagram, setInstagram] = useState(candidateToEdit?.raw_data?.curriculo?.redeSocial?.find((r: any) => r.id === 'Instagram')?.url || '');

  // Sync when editing a different candidate
  useEffect(() => {
    setPhone(applyPhoneMask(candidateToEdit?.phone || ''));
    setFormName(candidateToEdit?.name || '');
    setFormEmail(candidateToEdit?.email || '');
    setFormObservations(candidateToEdit?.observations || '');

    // Sync additional fields
    const raw = candidateToEdit?.raw_data;
    setBirthDate(raw?.dataNascimento?.split('T')[0] || '');
    setGender(raw?.sexo || '');
    setMaritalStatus(raw?.estadoCivil || '');
    setCep(raw?.localidade?.cep || '');
    setAddress(raw?.localidade?.logradouro || '');
    setNeighborhood(raw?.localidade?.bairro || '');
    setCity(raw?.localidade?.cidade || '');
    setState(raw?.localidade?.estado || '');
    setSalaryExpectation(raw?.curriculo?.pretensaoSalarial || '');
    setSynthesis(raw?.curriculo?.sintese || '');
    setLinkedin(raw?.curriculo?.redeSocial?.find((r: any) => r.id === 'LinkedIn')?.url || '');
    setInstagram(raw?.curriculo?.redeSocial?.find((r: any) => r.id === 'Instagram')?.url || '');

    setEmpregareData(raw || null);
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
        const p = data.pessoa;
        setEmpregareData(p);
        setPhone(applyPhoneMask(p.celular || p.telefone || ''));
        setFormName(p.nome || '');
        setFormEmail(p.email || '');
        setFormObservations(constructEmpregareObs(p));

        // Populate new fields
        setBirthDate(p.dataNascimento?.split('T')[0] || '');
        setGender(p.sexo || '');
        setMaritalStatus(p.estadoCivil || '');
        setCep(p.localidade?.cep || '');
        setAddress(p.localidade?.logradouro || '');
        setNeighborhood(p.localidade?.bairro || '');
        setCity(p.localidade?.cidade || '');
        setState(p.localidade?.estado || '');
        setSalaryExpectation(p.curriculo?.pretensaoSalarial || '');
        setSynthesis(p.curriculo?.sintese || '');
        setLinkedin(p.curriculo?.redeSocial?.find((r: any) => r.id === 'LinkedIn')?.url || '');
        setInstagram(p.curriculo?.redeSocial?.find((r: any) => r.id === 'Instagram')?.url || '');

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
      const data = await candidatesService.matchCandidate(candidateToEdit.id);
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
    handleDeleteCandidate();
  };

  useEffect(() => {
    jobOpeningsService.getAll()
      .then(data => setJobOpenings(data ?? []))
      .catch(err => console.error('[NewCandidateModal] Erro ao carregar vagas:', err));
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

    // Manual Validation for safety
    if (!formName || !formEmail || !formData.get('position')) {
      alert('Por favor, preencha nome, email e vaga pretendida.');
      return;
    }

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
      const combinedRawData = {
        ...(empregareData || candidateToEdit?.raw_data || {}),
        dataNascimento: birthDate ? `${birthDate}T00:00:00` : (empregareData || candidateToEdit?.raw_data)?.dataNascimento,
        sexo: gender || (empregareData || candidateToEdit?.raw_data)?.sexo,
        estadoCivil: maritalStatus || (empregareData || candidateToEdit?.raw_data)?.estadoCivil,
        localidade: {
          ...((empregareData || candidateToEdit?.raw_data)?.localidade || {}),
          cep: cep || (empregareData || candidateToEdit?.raw_data)?.localidade?.cep,
          logradouro: address || (empregareData || candidateToEdit?.raw_data)?.localidade?.logradouro,
          bairro: neighborhood || (empregareData || candidateToEdit?.raw_data)?.localidade?.bairro,
          cidade: city || (empregareData || candidateToEdit?.raw_data)?.localidade?.cidade,
          estado: state || (empregareData || candidateToEdit?.raw_data)?.localidade?.estado,
        },
        curriculo: {
          ...((empregareData || candidateToEdit?.raw_data)?.curriculo || {}),
          pretensaoSalarial: salaryExpectation || (empregareData || candidateToEdit?.raw_data)?.curriculo?.pretensaoSalarial,
          sintese: synthesis || (empregareData || candidateToEdit?.raw_data)?.curriculo?.sintese,
          redeSocial: [
            { id: 'LinkedIn', url: linkedin },
            { id: 'Instagram', url: instagram },
            { id: 'WhatsApp', url: phone.replace(/\D/g, '') },
            ...((empregareData || candidateToEdit?.raw_data)?.curriculo?.redeSocial?.filter((r: any) => !['LinkedIn', 'Instagram', 'WhatsApp'].includes(r.id)) || [])
          ]
        }
      };

      // Extract file from formData if present
      const file = formData.get('curriculo') as File;

      if (candidateToEdit) {
        const updateData: any = {
          name: formName,
          position: formData.get('position'),
          email: formEmail,
          observations: formData.get('observations') || formObservations,
          interview_notes: formData.get('interview_notes'),
          interview_notes_2: formData.get('interview_notes_2'),
          docs_delivered: formData.get('docs_delivered') === '1',
          vt_delivered: formData.get('vt_delivered') === '1',
          onboarding_date: formData.get('onboarding_date') || null,
          feedback_30: formData.get('feedback_30') || null,
          feedback_60: formData.get('feedback_60') || null,
          feedback_90: formData.get('feedback_90') || null,
          contract_start_date: formData.get('contract_start_date') || null,
          contract_alert_acknowledged: formData.get('contract_alert_acknowledged') === '1',
          phone: phone || null,
          archive_reason: formData.get('archive_reason') || null,
          termination_date: formData.get('termination_date') || null,
          raw_data: combinedRawData
        };
        await candidatesService.update(candidateToEdit.id, updateData, file && file.size > 0 ? file : undefined);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        await candidatesService.create({
          name: formName,
          position: formData.get('position'),
          email: formEmail,
          observations: formData.get('observations') || formObservations,
          contract_start_date: formData.get('contract_start_date') || null,
          phone: phone || null,
          status: 'pool',
          raw_data: combinedRawData
        }, file && file.size > 0 ? file : undefined);

      }
      onCreated();
    } catch (error: any) {
      console.error('Error saving candidate:', error);
      alert('Erro ao salvar candidato: ' + (error.message || 'Verifique sua conexão ou se o arquivo é muito grande.'));
    } finally {
      setIsSaving(false);
    }

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
                <UserSearch size={18} /> Ver Currículo
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



            {/* Main Form Section - High Contrast Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col mt-6">
              <div className="px-10 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-primary">
                  <User size={18} />
                  <h4 className="text-[10px] font-black text-deep-navy/60 uppercase tracking-[0.2em]">Formulário de Ingresso Estratégico</h4>
                </div>
              </div>

              <form id="candidate-form" key={candidateToEdit?.id ?? 'new'} onSubmit={handleSubmit} className="p-8 space-y-8">
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
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-[#B1C3FF]/20 flex items-center justify-center text-deep-navy border border-[#B1C3FF]/30 font-black shrink-0 text-xs">1</div>
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Fonte</h5>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-6">
                          {/* 1. Dados Principais */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-4">
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

                            <div className="space-y-4">
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

                          {/* 1.1 Dados Cadastrais */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100/50">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Data Nascimento</label>
                                {birthDate && (
                                  <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 uppercase tracking-widest">
                                    {(() => {
                                      const today = new Date();
                                      const bDay = new Date(birthDate + 'T12:00:00');
                                      let age = today.getFullYear() - bDay.getFullYear();
                                      const m = today.getMonth() - bDay.getMonth();
                                      if (m < 0 || (m === 0 && today.getDate() < bDay.getDate())) age--;
                                      return `${age} anos`;
                                    })()}
                                  </span>
                                )}
                              </div>
                              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="premium-input bg-white h-[42px] text-xs font-bold" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Sexo</label>
                              <select value={gender} onChange={e => setGender(e.target.value)} className="premium-input bg-white h-[42px] text-xs font-bold">
                                <option value="">Selecione...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                                <option value="Outro">Outro</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Estado Civil</label>
                              <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="premium-input bg-white h-[42px] text-xs font-bold">
                                <option value="">Selecione...</option>
                                <option value="Solteiro">Solteiro(a)</option>
                                <option value="Casado">Casado(a)</option>
                                <option value="Divorciado">Divorciado(a)</option>
                                <option value="Viúvo">Viúvo(a)</option>
                                <option value="UniaoEstavel">União Estável</option>
                              </select>
                            </div>
                          </div>

                          {/* 1.2 Localidade */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">CEP</label>
                              <input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" className="premium-input bg-white h-[42px] text-xs" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Logradouro / Endereço</label>
                              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Número, Complemento..." className="premium-input bg-white h-[42px] text-xs" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Bairro</label>
                              <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro..." className="premium-input bg-white h-[42px] text-xs" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Cidade</label>
                              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade..." className="premium-input bg-white h-[42px] text-xs" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Estado (UF)</label>
                              <input value={state} onChange={e => setState(e.target.value)} placeholder="UF" className="premium-input bg-white h-[42px] text-xs" maxLength={2} />
                            </div>
                          </div>

                          {/* 1.3 Perfil e Síntese */}
                          <div className="space-y-4 pt-4 border-t border-slate-100/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">LinkedIn URL</label>
                                <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/..." className="premium-input bg-white h-[42px] text-xs" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Instagram User</label>
                                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuário..." className="premium-input bg-white h-[42px] text-xs" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Pretensão Salarial</label>
                              <input value={salaryExpectation} onChange={e => setSalaryExpectation(e.target.value)} placeholder="Ex: 4500" className="premium-input bg-white h-[42px] text-xs" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest ml-1">Síntese do Perfil</label>
                              <textarea value={synthesis} onChange={e => setSynthesis(e.target.value)} className="premium-input bg-white min-h-[60px] resize-none p-3 text-xs border-slate-200" placeholder="Resumo das qualificações..." />
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


function CandidatesManagementModal({ isOpen, onClose, candidates, onEdit, onNew, onInitiate }: { isOpen: boolean; onClose: () => void; candidates: Candidate[]; onEdit: (c: Candidate) => void; onNew: () => void; onInitiate: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = candidates.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/40 flex items-center justify-center z-[60] p-4 md:p-10 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[3rem] shadow-premium-dark border border-slate-100 flex flex-col overflow-hidden"
      >
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-deep-navy uppercase tracking-tight">Base de <span className="text-primary">Candidatos</span></h3>
              <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mt-1">Consulta e gestão centralizada do banco de talentos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onNew}
              className="px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Plus size={16} /> Novo Registro
            </button>
            <button onClick={onClose} className="p-3 text-deep-navy/20 hover:text-deep-navy hover:bg-slate-100 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-10 flex-1 flex flex-col min-h-0">
          <div className="relative group mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-deep-navy/20 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Pesquise por nome, cargo ou e-mail..."
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-sm text-deep-navy placeholder:text-deep-navy/20 focus:bg-white focus:border-primary/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 pt-2 text-[10px] font-black text-deep-navy/30 uppercase tracking-widest pl-4">Candidato</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-deep-navy/30 uppercase tracking-widest">Informações de Contato</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-deep-navy/30 uppercase tracking-widest px-4">Fase Atual</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-deep-navy/30 uppercase tracking-widest text-right pr-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(candidate => (
                  <tr key={candidate.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-deep-navy/30 font-black text-xs uppercase">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-sm text-deep-navy leading-none mb-1 group-hover:text-primary transition-colors">{candidate.name}</p>
                          <p className="text-[10px] font-bold text-deep-navy/30 uppercase tracking-widest">{candidate.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-deep-navy/60">
                          <Mail size={12} className="text-primary/40" />
                          {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-deep-navy/60">
                            <Clock size={12} className="text-primary/40" />
                            {candidate.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <span className={cn(
                        "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border inline-block",
                        candidate.status === 'pool'
                          ? "bg-slate-50 text-slate-400 border-slate-100"
                          : COLUMNS.find(col => col.id === candidate.status)?.color?.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('text-') || c.startsWith('border-')).join(' ') || "bg-slate-100 text-slate-500"
                      )}>
                        {candidate.status === 'pool' ? "Banco de Talentos" : (COLUMNS.find(col => col.id === candidate.status)?.label || candidate.status)}
                      </span>
                    </td>
                    <td className="py-5 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onInitiate(candidate.id)}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm flex items-center gap-2 group/init"
                          title="Iniciar Processo"
                        >
                          <Plus size={14} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Iniciar</span>
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onEdit(candidate);
                          }}
                          className="p-2 bg-slate-50 text-deep-navy/30 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm"
                          title="Ver Currículo"
                        >
                          <Search size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <p className="text-sm font-bold text-deep-navy/30 uppercase tracking-widest">Nenhum candidato encontrado...</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


function JobOpeningsModal({ isOpen, onClose, onCreated, onDelete }: { isOpen: boolean; onClose: () => void; onCreated: () => void; onDelete: (id: number, name: string) => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobFetchError, setJobFetchError] = useState<string | null>(null);
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [jobToEdit, setJobToEdit] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    setJobFetchError(null);
    try {
      // Direct REST API call — bypasses JS client session issues
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/job_openings?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      console.log('[JobOpenings] fetched via REST:', data?.length);
      setJobOpenings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[JobOpenings] Erro REST:', err);
      setJobFetchError(err?.message || 'Erro desconhecido');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSyncEmpregare = async () => {
    setIsSyncing(true);
    try {
      // 1. Listar vagas via proxy
      const res = await fetch('/api/empregare/proxy?endpoint=vaga/listar&quantidade=50');
      const data = await res.json();
      if (!data.vagas) throw new Error('Nenhuma vaga retornada pela API.');

      let count = 0;
      for (const v of data.vagas) {
        // 2. Obter detalhes para pegar salário e setores
        const dRes = await fetch(`/api/empregare/proxy?endpoint=vaga/detalhes/${v.ID}`);
        const dData = await dRes.json();
        const details = dData.vaga || {};

        const rawSalario = details.salario;
        const salaryValue = (typeof rawSalario === 'object' && rawSalario !== null)
          ? (rawSalario.salarioInicial || 0)
          : (parseFloat(rawSalario as any) || 0);

        const jobPayload = {
          title: details.titulo || v.Titulo,
          open_positions: details.totalVagas || 1,
          department: (details.setores && details.setores.length > 0) ? details.setores[0].Nome : 'Operações',
          skills: (details.requisito || 'Consultar na Empregare').replace(/<[^>]*>/g, ''),
          salary: salaryValue
        };

        // 3. Upsert no Supabase
        // Como o serviço não tem upsert exposto com conflito de título, vamos simplificar criando se não existir
        const existing = jobOpenings.find(j => j.title === jobPayload.title);
        if (existing) {
          await jobOpeningsService.update(existing.id, jobPayload);
        } else {
          await jobOpeningsService.create(jobPayload);
        }
        count++;
      }
      alert(`${count} vagas processadas com sucesso!`);
      await fetchJobs();
    } catch (error: any) {
      console.error(error);
      alert('Erro na sincronização: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditJob = (job: any) => {
    setJobToEdit(job);
    setSelectedDepartment(job.department || '');
    setIsCreating(true);
  };

  const handleDeleteJobInternal = async (id: string | number, name: string) => {
    onDelete(id as number, name); // Cast back to number for the onDelete prop if it expects number
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
      if (jobToEdit) {
        await jobOpeningsService.update(jobToEdit.id, data);
      } else {
        await jobOpeningsService.create(data as any);
      }

      await fetchJobs();
      onCreated();
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
              <>
                <button
                  onClick={handleSyncEmpregare}
                  disabled={isSyncing}
                  className="px-8 py-3.5 bg-sky-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-sky-700 transition-all flex items-center gap-3 shadow-xl shadow-sky-600/20 disabled:opacity-50"
                >
                  <Download size={18} /> {isSyncing ? "Sincronizando..." : "Sincronizar Empregare"}
                </button>
                <button
                  onClick={() => { setIsCreating(true); setSelectedDepartment(''); }}
                  className="px-8 py-3.5 bg-deep-blue text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-3 shadow-xl shadow-deep-blue/20"
                >
                  <Plus size={18} /> Nova Vaga
                </button>
              </>
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
                {isLoadingJobs ? (
                  <div className="col-span-full py-16 flex flex-col items-center gap-4">
                    <div style={{ position: 'relative', width: '13.6px', height: '48px' }}>
                      <div className="jimu-primary-loading" />
                    </div>
                    <span className="jimu-loader-label">Carregando vagas...</span>
                  </div>
                ) : (
                  <>
                    {jobFetchError && (
                      <div className="col-span-full py-8 flex flex-col items-center gap-4 bg-red-50 rounded-3xl border border-red-100 px-8">
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest">Erro ao carregar vagas</p>
                        <p className="text-xs text-red-500 font-mono text-center break-all">{jobFetchError}</p>
                        <button onClick={fetchJobs} className="px-6 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-200 transition-all">
                          Tentar novamente
                        </button>
                      </div>
                    )}
                    {!jobFetchError && jobOpenings.map(job => (
                      <div key={job.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-premium hover:border-primary/20 transition-all relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditJob(job)} className="p-2 bg-slate-50 text-deep-navy/40 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors" title="Editar Vaga">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteJobInternal(job.id, job.title)} className="p-2 bg-slate-50 text-deep-navy/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Vaga">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-deep-navy pr-16">{job.title}</h4>
                          <p className="text-sm font-bold text-deep-navy/40">{job.department}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-deep-navy/60"><strong>Vagas em aberto:</strong> {job.open_positions}</p>
                          <p className="text-sm text-deep-navy/60"><strong>Salário:</strong> R$ {Number(job.salary || 0).toFixed(2)}</p>
                          <p className="text-sm text-deep-navy/60 max-h-16 overflow-hidden text-ellipsis line-clamp-2"><strong>Habilidades:</strong> {job.skills}</p>
                        </div>
                      </div>
                    ))}
                    {jobOpenings.length === 0 && (
                      <div className="col-span-full py-12 text-center text-deep-navy/40 font-bold">Nenhuma vaga cadastrada. Cadastre a primeira oportunidade de sua equipe!</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ArchiveConfirmationModal({ isOpen, onClose, onConfirm, candidate }: { isOpen: boolean; onClose: () => void; onConfirm: (reason: string, date?: string) => void; candidate: Candidate | null }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [terminationDate, setTerminationDate] = useState('');

  if (!isOpen) return null;

  const isAppliedStatus = candidate?.status === 'applied';

  const handleConfirm = () => {
    const finalReason = selectedOption === 'Outros' ? `Outros: ${customReason}` : selectedOption;
    if (!finalReason) return;
    onConfirm(finalReason, terminationDate);
  };

  const appliedOptions = [
    'Fora do Perfil Técnico',
    'Fora do Perfil Comportamental',
    'Desistência do Candidato',
    'Candidato Duplicado',
    'Outros'
  ];

  const defaultOptions = [
    'Pedido de Demissão (Iniciativa do Colaborador)',
    'Demissão Sem Justa Causa (Iniciativa da Empresa)',
    'Demissão Por Justa Causa (Falta Grave)',
    'Demissão por Comum Acordo',
    'Outros'
  ];

  const options = isAppliedStatus ? appliedOptions : defaultOptions;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-deep-navy/20 flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-[500px] rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden p-10 space-y-8"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner border transition-colors",
            isAppliedStatus ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-rose-50 text-rose-500 border-rose-100"
          )}>
            <Archive size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-deep-navy tracking-tight uppercase">
              {isAppliedStatus ? "Excluir do Fluxo" : "Arquivar Registro"}
            </h3>
            <p className="text-deep-navy/50 font-bold text-xs uppercase tracking-[0.1em] px-4 leading-relaxed">
              {isAppliedStatus
                ? "Este talento será removido das etapas ativas mas permanecerá em nossa base histórica para consultas futuras."
                : "Informe o motivo estratégico e a data efetiva para o arquivamento deste colaborador na base."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] ml-1">
              {isAppliedStatus ? "Motivo da Remoção" : "Motivo do Desligamento"}
            </label>
            <select
              value={selectedOption}
              onChange={(e) => {
                setSelectedOption(e.target.value);
                if (e.target.value === 'Outros') setTerminationDate('');
              }}
              className="premium-input bg-slate-50 border-slate-200 h-[54px] px-6 text-sm font-bold text-deep-navy cursor-pointer"
            >
              <option value="" disabled>Selecione uma justificativa...</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <AnimatePresence>
            {selectedOption && selectedOption !== 'Outros' && !isAppliedStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5"
              >
                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  Data do Desligamento <span className="w-1 h-1 bg-rose-400 rounded-full" />
                </label>
                <input
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="premium-input bg-slate-50 border-slate-200 h-[54px] px-6 text-sm font-bold text-deep-navy"
                />
                <p className="text-[9px] font-bold text-rose-500/60 uppercase tracking-widest ml-1 animate-pulse">
                  Início da contagem de 10 dias para acerto
                </p>
              </motion.div>
            )}

            {selectedOption === 'Outros' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5"
              >
                <label className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] ml-1">Complemento do Motivo</label>
                <textarea
                  autoFocus
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="premium-input bg-slate-50 border-slate-200 min-h-[100px] resize-none p-5 text-sm font-bold text-deep-navy"
                  placeholder="Forneça detalhes estratégicos sobre esta decisão..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleConfirm}
            disabled={!selectedOption || (selectedOption === 'Outros' && !customReason) || (!isAppliedStatus && selectedOption !== 'Outros' && !terminationDate)}
            className={cn(
              "w-full py-4.5 font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed",
              isAppliedStatus
                ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600"
                : "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600"
            )}
          >
            {isAppliedStatus ? "Executar Remoção" : "Confirmar Arquivamento"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-deep-navy/40 font-black uppercase text-[10px] tracking-[0.2em] hover:text-deep-navy transition-colors"
          >
            Manter no Fluxo
          </button>
        </div>
      </motion.div>
    </div>
  );
}


function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-deep-navy/20 flex items-center justify-center z-[200] animate-in fade-in duration-300 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-[450px] rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden p-8 space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner border border-rose-100/50">
            <Trash2 size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-deep-navy tracking-tight uppercase">{title}</h3>
            <p className="text-deep-navy/50 font-bold text-[11px] leading-relaxed lowercase first-letter:uppercase tracking-tight">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-8 py-4 bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95"
          >
            Confirmar Exclusão
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-slate-100 text-deep-navy font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-200 transition-all active:scale-95"
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

  const getAge = (birthDateStr: string) => {
    if (!birthDateStr) return '';
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  const formatSalary = (val: string) => {
    if (!val) return 'Não informado';
    if (typeof val === 'string' && val.startsWith('APartir')) {
      const num = val.replace('APartir', '');
      return `A partir de R$ ${Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return val;
  };

  const formatExperiencePeriod = (start: string, end: string, current: boolean) => {
    const startDate = new Date(start);
    const endDate = (current || !end || end.startsWith('0001')) ? new Date() : new Date(end);

    const diffInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    const years = Math.floor(diffInMonths / 12);
    const months = diffInMonths % 12;

    let periodStr = '';
    if (years > 0) periodStr += `${years} ano${years > 1 ? 's' : ''}`;
    if (months > 0) periodStr += `${years > 0 ? ' e ' : ''}${months} me${months > 1 ? 'ses' : 's'}`;

    const startFormatted = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const endFormatted = (current || !end || end.startsWith('0001')) ? 'o momento' : new Date(end).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return `${startFormatted} até ${endFormatted} (${periodStr})`;
  };

  const candidate = data.pessoa || data;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-deep-navy/40 flex items-center justify-center z-[150] animate-in fade-in duration-300 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#f1f4f9] w-full max-w-5xl h-[95vh] rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Header Bar */}
        <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-deep-navy/70">
            <FileText size={20} className="text-primary/60" />
            <h3 className="text-sm font-black uppercase tracking-widest">Visualizar Currículo</h3>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-deep-navy/20 hover:text-deep-navy">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-10 mb-6 flex flex-col md:flex-row gap-10 items-start">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner shrink-0 bg-slate-50 flex items-center justify-center">
              <img src={candidate.foto || "https://storage.empregare.com/pessoas/sem-foto.png"} alt="Foto" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-4">
              <h1 className="text-4xl font-black text-deep-navy tracking-tight">{candidate.nome}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold text-deep-navy/60">
                  {candidate.sexo === 'M' ? 'Masculino' : candidate.sexo === 'F' ? 'Feminino' : candidate.sexo}, {getAge(candidate.dataNascimento)}
                </span>
                <span className="bg-slate-100 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg text-deep-navy/40 border border-slate-200/60">
                  {candidate.curriculo?.deficiencia?.length > 0 ? candidate.curriculo.deficiencia.join(', ') : 'Não informou dados de Diversidade'}
                </span>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 text-deep-navy/50 text-xs font-bold">
                  <Scan size={16} className="text-primary/40" />
                  {candidate.localidade?.bairro} - {candidate.localidade?.cidade}, {candidate.localidade?.estado}, {candidate.localidade?.pais}
                </div>
                {candidate.localidade?.logradouro && (
                  <p className="text-deep-navy/40 text-[11px] font-bold ml-7">
                    {candidate.localidade.logradouro}, CEP: {candidate.localidade.cep}
                  </p>
                )}

                <div className="flex flex-wrap gap-6 mt-4">
                  <div className="flex items-center gap-3 text-deep-navy/60 text-xs font-bold">
                    <UserSearch size={16} className="text-primary/40" />
                    {candidate.celularPaisCode || '+55'} {candidate.celular || candidate.telefone} (celular)
                  </div>
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-primary text-xs font-bold hover:underline">
                    <Mail size={16} className="text-primary/40" />
                    {candidate.email}
                  </a>
                </div>

                <div className="flex gap-2.5 pt-6">
                  {candidate.curriculo?.redeSocial?.find((r: any) => r.id === 'LinkedIn') && (
                    <a href={`https://${candidate.curriculo.redeSocial.find((r: any) => r.id === 'LinkedIn').url.replace(/^https?:\/\//, '')}`} target="_blank" className="w-9 h-9 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
                      <Linkedin size={18} fill="currentColor" />
                    </a>
                  )}
                  <a href="#" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFB347] via-[#FFCC33] to-[#FFB347] flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
                    <Instagram size={18} />
                  </a>
                  <a href={`https://wa.me/${candidate.celular?.replace(/\D/g, '') || candidate.telefone?.replace(/\D/g, '')}`} target="_blank" className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
                    <MessageCircle size={18} fill="currentColor" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
            {/* Sidebar Left */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-8 space-y-10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-50" />

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] border-l-4 border-slate-100 pl-4">ÁREA DE INTERESSE</h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.curriculo?.areas?.map((area: any) => (
                    <span key={area.id} className="bg-indigo-50/50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-indigo-100/30">
                      {area.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] border-l-4 border-slate-100 pl-4">PRETENSÃO SALARIAL</h4>
                <p className="text-[13px] font-bold text-deep-navy/70">{formatSalary(candidate.curriculo?.pretensaoSalarial)}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] border-l-4 border-slate-100 pl-4">ESTADO CIVIL</h4>
                <p className="text-[13px] font-bold text-deep-navy/70">{candidate.estadoCivil || 'Não informado'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] border-l-4 border-slate-100 pl-4">DATA DE NASCIMENTO</h4>
                <p className="text-[13px] font-bold text-deep-navy/70">{(candidate.dataNascimento?.split('T')[0] || 'N/A')} ({getAge(candidate.dataNascimento)})</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] border-l-4 border-slate-100 pl-4">ÚLTIMA ATUALIZAÇÃO</h4>
                <p className="text-[13px] font-bold text-deep-navy/70">{candidate.dataAtualizacao ? `${formatDate(candidate.dataAtualizacao)} ${candidate.dataAtualizacao.split('T')[1]?.slice(0, 5)}` : 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-deep-navy/40 uppercase tracking-[0.2em] border-l-4 border-slate-100 pl-4">CÓDIGO</h4>
                <p className="text-[13px] font-bold text-deep-navy/70">{candidate.id}</p>
              </div>
            </div>

            {/* Content Right */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-10 space-y-12 shadow-sm">
              {/* Resumo Profissional */}
              <div className="flex gap-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100/50">
                  <FileText size={20} />
                </div>
                <div className="space-y-4 flex-1">
                  <h4 className="text-xl font-black text-deep-navy tracking-tight">Resumo Profissional</h4>
                  <p className="text-sm text-deep-navy/70 leading-relaxed font-medium whitespace-pre-line">
                    {candidate.curriculo?.sintese || 'Não informado.'}
                  </p>
                </div>
              </div>

              {/* Formação */}
              <div className="flex gap-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100/50">
                  <Network size={20} />
                </div>
                <div className="space-y-8 flex-1">
                  <h4 className="text-xl font-black text-deep-navy tracking-tight border-b border-slate-50 pb-4">Formação</h4>
                  <div className="space-y-8">
                    {candidate.curriculo?.formacao?.map((form: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <h5 className="font-black text-lg text-deep-navy">{form.grauNome}</h5>
                        <p className="text-sm font-bold text-deep-navy/60">{form.curso} - {form.local}</p>
                        <p className="text-xs text-deep-navy/40 font-black uppercase tracking-widest">
                          de {new Date(form.dataInicio).getMonth() + 1}/{new Date(form.dataInicio).getFullYear()} a {form.incompleto ? 'cursando' : `${new Date(form.dataFim).getMonth() + 1}/${new Date(form.dataFim).getFullYear()}`} ({form.incompleto ? 'cursando' : 'concluído'})
                        </p>
                      </div>
                    ))}
                    {(!candidate.curriculo?.formacao || candidate.curriculo.formacao.length === 0) && (
                      <p className="text-sm text-deep-navy/40 font-bold">Nenhuma formação registrada.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Experiência */}
              <div className="flex gap-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100/50">
                  <Briefcase size={20} />
                </div>
                <div className="space-y-10 flex-1">
                  <h4 className="text-xl font-black text-deep-navy tracking-tight border-b border-slate-50 pb-4">Experiência</h4>
                  <div className="space-y-12">
                    {candidate.curriculo?.experiencia?.map((exp: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        <div className="space-y-1">
                          <h5 className="font-black text-xl text-deep-navy">{exp.cargo}</h5>
                          <div className="flex items-center gap-3 text-sm font-bold text-deep-navy/50">
                            {exp.empresa} <span className="w-1 h-1 bg-slate-300 rounded-full" /> <span className="flex items-center gap-1.5"><Scan size={12} /> {exp.cidade}</span>
                          </div>
                          <p className="text-xs text-deep-navy/30 font-black uppercase tracking-[0.1em] mt-1">
                            {formatExperiencePeriod(exp.dataInicio, exp.dataFim, exp.atual)}
                          </p>
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
                          <p className="text-[10px] font-black text-deep-navy/80 uppercase tracking-[0.2em] mb-3">Atividades:</p>
                          <p className="text-sm text-deep-navy/70 leading-relaxed font-medium whitespace-pre-line">
                            {exp.descricao || 'Atividades não descritas.'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!candidate.curriculo?.experiencia || candidate.curriculo.experiencia.length === 0) && (
                      <p className="text-sm text-deep-navy/40 font-bold">Nenhuma experiência registrada.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


// -----------------------------------------------------------------------------------------------------------------------------------------
// COMPONENT: Empregare Batch Import Modal (v2 — vaga-linked)
// Step 1: Fetch vagas from Empregare  →  Step 2: Select vagas  →  Step 3: Fetch+preview candidates per vaga  →  Step 4: Import
// -----------------------------------------------------------------------------------------------------------------------------------------

type EmpregareImportStep = 'loading_vagas' | 'select_vagas' | 'loading_candidates' | 'preview' | 'importing' | 'done' | 'error';

type EmpregareVaga = {
  id: number;
  titulo: string;
  selected: boolean;
};

type EmpregareImportCandidate = {
  id: number | string;
  nome: string;
  email: string;
  celular?: string;
  cpf?: string;
  telefone?: string;
  sexo?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  localidade?: any;
  curriculo?: any;
  foto?: string;
  vagaTitulo: string; // vaga automatically linked
  vagaId: number;
  selected: boolean;
};

function EmpregareImportModal({ isOpen, onClose, onImported }: { isOpen: boolean; onClose: () => void; onImported: () => void }) {
  const [step, setStep] = useState<EmpregareImportStep>('loading_vagas');
  const [errorMsg, setErrorMsg] = useState('');
  const [vagas, setVagas] = useState<EmpregareVaga[]>([]);
  const [candidates, setCandidates] = useState<EmpregareImportCandidate[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  // Auto-fetch vagas on open
  useEffect(() => {
    if (isOpen) fetchVagas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedVagas = vagas.filter(v => v.selected);
  const selectedCandidates = candidates.filter(c => c.selected);

  // ----- Fetch vagas from Empregare -----
  const fetchVagas = async () => {
    setStep('loading_vagas');
    setErrorMsg('');
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/empregare-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ url: '/vaga/listar?quantidade=50' })
      });

      if (!response.ok) {
        throw new Error(`Erro ao conectar com a function (Status: ${response.status})`);
      }

      const data = await response.json();
      const list: any[] = data?.vagas || [];
      if (list.length === 0) throw new Error('Nenhuma vaga ativa encontrada na Empregare.');
      setVagas(list.map(v => ({ id: v.ID, titulo: v.Titulo, selected: false })));
      setStep('select_vagas');
    } catch (err: any) {
      console.error('FETCH VAGAS ERROR:', err);
      setErrorMsg(err.message || 'Erro ao buscar vagas da Empregare.');
      setStep('error');
    }
  };

  // ----- Fetch candidates for selected vagas -----
  const fetchCandidatesForVagas = async () => {
    if (selectedVagas.length === 0) return;
    setStep('loading_candidates');
    setErrorMsg('');
    const all: EmpregareImportCandidate[] = [];
    try {
      const { data: dbCands } = await supabase.from('candidates').select('raw_data');
      const knownCPFs = new Set(
        (dbCands || [])
          .map((c: any) => c.raw_data?.cpf)
          .filter((cpf: any) => Boolean(cpf))
      );

      for (const vaga of selectedVagas) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/empregare-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ url: `/Pessoas?pagina=1&itensPorPagina=15&idVaga=${vaga.id}` })
        });

        const data = await response.json();

        if (!response.ok) {
          console.log('Error data from Edge:', data);
          // Convert explicit known 503/HTML errors to a better message
          if (data.error && (data.error.includes("Erro em nossos servidores") || data.error.includes("Non-JSON"))) {
            throw new Error(`A API da Empregare está instável e retornou um "Erro em nossos servidores" (Sistêmico da Empregare) para a vaga ${vaga.titulo}. Tente mais tarde.`);
          }
          throw new Error(data.error || `Erro HTTP ${response.status}`);
        }

        const list: any[] = (data?.pessoas || []).filter((p: any) => p !== null);

        for (const p of list) {
          // Avoid duplicates
          const alreadyIn = all.some(c => c.id === (p.idPessoa || p.id));
          const inDb = p.cpf && knownCPFs.has(p.cpf);

          if (!alreadyIn && !inDb) {
            all.push({
              id: p.idPessoa || p.id || `${vaga.id}-${Math.random()}`,
              nome: p.nome || '—',
              email: p.email || '',
              celular: p.celular || p.telefone || '',
              cpf: p.cpf,
              telefone: p.telefone,
              sexo: p.sexo,
              dataNascimento: p.dataNascimento,
              estadoCivil: p.estadoCivil,
              localidade: p.localidade,
              curriculo: p.curriculo,
              foto: p.foto,
              vagaTitulo: vaga.titulo,
              vagaId: vaga.id,
              selected: true,
            });
          }
        }
      }
      if (all.length === 0) {
        throw new Error('Nenhum candidato encontrado nas vagas selecionadas.');
      }
      setCandidates(all);
      setStep('preview');
    } catch (err: any) {
      console.error('FETCH CANDIDATES ERROR:', err);
      setErrorMsg(err.message || 'Erro ao buscar candidatos.');
      setStep('error');
    }
  };

  // ----- Import selected candidates -----
  const buildObs = (p: EmpregareImportCandidate) => {
    let t = '';
    const c = p.curriculo;
    if (!c) return t;
    if (c.sintese) t += `SÍNTESE:\n${c.sintese}\n\n`;
    if (c.experiencia?.length > 0) {
      t += 'EXPERIÊNCIAS:\n';
      c.experiencia.slice(0, 3).forEach((e: any) => { t += `- ${e.cargo} na ${e.empresa}\n`; });
      t += '\n';
    }
    if (c.formacao?.length > 0) {
      t += 'FORMAÇÃO:\n';
      c.formacao.slice(0, 2).forEach((f: any) => { t += `- ${f.grauNome} em ${f.curso} (${f.local})\n`; });
    }
    return t;
  };

  const handleImport = async () => {
    setStep('importing');
    setErrorMsg('');
    let count = 0;
    for (const c of selectedCandidates) {
      try {
        const raw: any = {
          dataNascimento: c.dataNascimento, sexo: c.sexo, estadoCivil: c.estadoCivil,
          localidade: c.localidade, curriculo: c.curriculo, foto: c.foto, cpf: c.cpf
        };
        await candidatesService.create({
          name: c.nome,
          email: c.email || `sem-email-${c.id}@importado.empregare`,
          position: c.vagaTitulo, // ← linked to the Empregare vaga title
          phone: c.celular || c.telefone || null,
          observations: buildObs(c),
          status: 'pool', // Enforcing the required business rule
          raw_data: raw,
        } as any);
        count++;
      } catch (e) { console.warn('Falha ao importar candidato', c.nome, e); }
    }
    setImportedCount(count);
    setStep('done');
  };

  const toggleVaga = (id: number) => setVagas(prev => prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v));
  const toggleCandidate = (id: number | string) => setCandidates(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));

  // Group candidates by vaga for display
  const grouped = selectedCandidates.length > 0
    ? candidates.reduce<Record<string, EmpregareImportCandidate[]>>((acc, c) => {
      const key = c.vagaTitulo;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {})
    : {};

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-deep-navy/30 flex items-center justify-center z-[80] animate-in fade-in duration-300 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-3xl max-h-[92vh] rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-10 py-7 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-inner"><Download size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-deep-navy tracking-tight uppercase">Importar da Empregare</h3>
              <p className="text-[10px] font-bold text-deep-navy/40 uppercase tracking-widest mt-0.5">
                {step === 'loading_vagas' && 'Carregando vagas...'}
                {step === 'select_vagas' && `${vagas.length} vagas disponíveis`}
                {step === 'loading_candidates' && 'Buscando candidatos...'}
                {step === 'preview' && `${candidates.length} candidatos encontrados`}
                {step === 'importing' && 'Importando...'}
                {step === 'done' && 'Concluído'}
                {step === 'error' && 'Erro de conexão'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-deep-navy/20 hover:text-deep-navy"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* STEP: Loading vagas / Loading candidates */}
          {(step === 'loading_vagas' || step === 'loading_candidates') && (
            <div className="flex flex-col items-center justify-center gap-6 min-h-[320px]">
              <div style={{ position: 'relative', width: '13.6px', height: '48px' }}>
                <div className="jimu-primary-loading" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-deep-navy uppercase tracking-widest">
                  {step === 'loading_vagas' ? 'Buscando vagas na Empregare...' : 'Buscando candidatos por vaga...'}
                </p>
                <p className="text-[10px] font-bold text-deep-navy/40 uppercase tracking-widest">Conectando à API corporativa</p>
              </div>
            </div>
          )}

          {/* STEP: Select vagas */}
          {step === 'select_vagas' && (
            <div className="p-10 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">Selecione as vagas para importar candidatos</p>
                <button
                  onClick={() => { const all = vagas.every(v => v.selected); setVagas(prev => prev.map(v => ({ ...v, selected: !all }))); }}
                  className="text-[9px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors"
                >
                  {vagas.every(v => v.selected) ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              </div>
              <div className="space-y-2">
                {vagas.map(v => (
                  <div key={v.id} onClick={() => toggleVaga(v.id)} className={cn('flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all', v.selected ? 'bg-sky-50/60 border-sky-200' : 'bg-slate-50 border-slate-100 opacity-60')}>
                    <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all', v.selected ? 'bg-sky-600 border-sky-600' : 'border-slate-300')}>
                      {v.selected && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0"><Briefcase size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-deep-navy leading-none truncate">{v.titulo}</p>
                      <p className="text-[10px] font-bold text-deep-navy/40 uppercase tracking-widest mt-0.5">ID: {v.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Preview candidates */}
          {step === 'preview' && (
            <div className="p-10 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-deep-navy/40 uppercase tracking-widest">Candidatos ({selectedCandidates.length} selecionados)</p>
                <button
                  onClick={() => { const all = candidates.every(c => c.selected); setCandidates(prev => prev.map(c => ({ ...c, selected: !all }))); }}
                  className="text-[9px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors"
                >
                  {candidates.every(c => c.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>
              {/* Grouped by vaga */}
              {(Object.entries(
                candidates.reduce<Record<string, EmpregareImportCandidate[]>>((acc, c) => {
                  if (!acc[c.vagaTitulo]) acc[c.vagaTitulo] = [];
                  acc[c.vagaTitulo].push(c);
                  return acc;
                }, {})
              ) as [string, EmpregareImportCandidate[]][]).map(([vagaTitulo, grp]) => (
                <div key={vagaTitulo} className="space-y-2">
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600"><Briefcase size={12} /></div>
                    <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest">{vagaTitulo}</p>
                    <span className="text-[9px] font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">{grp.length} candidatos</span>
                  </div>
                  {grp.map(c => (
                    <div key={String(c.id)} onClick={() => toggleCandidate(c.id)} className={cn('flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ml-8', c.selected ? 'bg-sky-50/60 border-sky-200' : 'bg-slate-50 border-slate-100 opacity-50')}>
                      <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all', c.selected ? 'bg-sky-600 border-sky-600' : 'border-slate-300')}>
                        {c.selected && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 text-xs font-black uppercase">
                        {c.foto ? <img src={c.foto} alt={c.nome} className="w-full h-full object-cover" /> : c.nome.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-deep-navy leading-none truncate">{c.nome}</p>
                        <p className="text-[10px] font-bold text-deep-navy/40 uppercase tracking-widest mt-0.5 truncate">{c.email || 'Sem email'}</p>
                      </div>
                      <div className="text-[9px] font-black text-deep-navy/30 uppercase tracking-widest text-right shrink-0">{c.localidade?.cidade || '—'}</div>
                    </div>
                  ))}
                </div>
              ))}
              {errorMsg && <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-700 font-bold">{errorMsg}</div>}
            </div>
          )}

          {/* STEP: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center gap-6 min-h-[280px]">
              <div style={{ position: 'relative', width: '13.6px', height: '48px' }}>
                <div className="jimu-primary-loading" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-deep-navy uppercase tracking-widest">Importando candidatos...</p>
                <p className="text-[10px] font-bold text-deep-navy/40 uppercase tracking-widest">Salvando no banco de talentos</p>
              </div>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="p-10 flex flex-col items-center justify-center gap-6 min-h-[280px]">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner"><CheckCircle size={40} /></div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-black text-deep-navy tracking-tight">{importedCount} candidatos importados!</p>
                <p className="text-sm font-bold text-deep-navy/40">Adicionados ao Banco de Talentos, vinculados às vagas da Empregare.</p>
              </div>
              <button onClick={onImported} className="px-10 py-4 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">Concluir</button>
            </div>
          )}

          {/* STEP: Error */}
          {step === 'error' && (
            <div className="p-10 flex flex-col items-center justify-center gap-6 min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500"><X size={28} /></div>
              <div className="text-center space-y-2 max-w-md">
                <p className="text-sm font-black text-deep-navy uppercase tracking-widest">Falha na conexão</p>
                <p className="text-xs font-bold text-rose-600 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        {(step === 'loading_vagas' || step === 'loading_candidates') && (
          <div className="px-10 py-6 border-t border-slate-100 flex justify-end shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-deep-navy/40 font-black uppercase text-[10px] tracking-widest hover:text-deep-navy transition-colors">Cancelar</button>
          </div>
        )}
        {step === 'select_vagas' && (
          <div className="px-10 py-6 border-t border-slate-100 flex justify-between items-center shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-deep-navy/40 font-black uppercase text-[10px] tracking-widest hover:text-deep-navy transition-colors">Cancelar</button>
            <button
              onClick={fetchCandidatesForVagas}
              disabled={selectedVagas.length === 0}
              className="px-10 py-4 bg-sky-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <UserSearch size={18} /> Buscar Candidatos ({selectedVagas.length} vaga{selectedVagas.length !== 1 ? 's' : ''})
            </button>
          </div>
        )}
        {step === 'error' && (
          <div className="px-10 py-6 border-t border-slate-100 flex justify-between items-center shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-deep-navy/40 font-black uppercase text-[10px] tracking-widest hover:text-deep-navy transition-colors">Cancelar</button>
            <button onClick={fetchVagas} className="px-10 py-4 bg-sky-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20 flex items-center gap-3">
              <Download size={18} /> Tentar Novamente
            </button>
          </div>
        )}
        {step === 'preview' && (
          <div className="px-10 py-6 border-t border-slate-100 flex justify-between items-center shrink-0">
            <button onClick={() => { setStep('select_vagas'); setCandidates([]); setErrorMsg(''); }} className="px-6 py-3 text-deep-navy/40 font-black uppercase text-[10px] tracking-widest hover:text-deep-navy transition-colors">← Voltar</button>
            <button
              onClick={handleImport}
              disabled={selectedCandidates.length === 0}
              className="px-10 py-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={18} /> Importar {selectedCandidates.length} Candidato{selectedCandidates.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
