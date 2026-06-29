import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { escavadorService } from '../lib/escavador-service';
import { format } from 'date-fns';

export function ProcessTimelineModal({ 
  isOpen, 
  onClose, 
  processoId, 
  caseNumber 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  processoId: string | number;
  caseNumber: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !processoId) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [movData, docData] = await Promise.all([
          escavadorService.getMovimentacoesProcesso(processoId).catch(() => ({ items: [] })),
          escavadorService.getDocumentosProcesso(processoId).catch(() => ({ items: [] }))
        ]);
        
        setMovimentacoes(movData.items || []);
        setDocumentos(docData.items || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar o histórico.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, processoId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-navy/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-3xl shadow-2xl rounded-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-deep-navy uppercase tracking-tight">Histórico Completo</h3>
                <p className="text-[11px] font-bold text-deep-navy/50 uppercase tracking-widest mt-0.5">{caseNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="animate-spin text-primary opacity-50" size={32} />
                <p className="text-xs font-bold text-deep-navy/40 uppercase tracking-widest">Carregando movimentações...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" /> 
                <p>{error}</p>
              </div>
            ) : movimentacoes.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-bold text-deep-navy/40 uppercase tracking-widest">Nenhuma movimentação encontrada.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                {movimentacoes.map((mov, idx) => {
                  const dataMov = mov.data ? new Date(mov.data) : null;
                  const dataFormatada = dataMov && !isNaN(dataMov.getTime()) ? format(dataMov, 'dd/MM/yyyy') : 'Data não informada';
                  
                  // Encontra documentos associados a esta movimentação
                  const docsAssociados = documentos.filter(doc => doc.movimentacao_id === mov.id);

                  return (
                    <div key={mov.id || idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm" />
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md inline-block w-fit">
                            {dataFormatada}
                          </span>
                          <span className="text-[10px] font-bold text-deep-navy/40 uppercase tracking-widest">
                            {mov.tipo || 'Movimentação'}
                          </span>
                        </div>
                        
                        <p className="text-xs font-medium text-deep-navy/80 leading-relaxed whitespace-pre-line">
                          {mov.conteudo || mov.texto || 'Sem descrição.'}
                        </p>

                        {docsAssociados.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                            {docsAssociados.map((doc, docIdx) => (
                              <a
                                key={docIdx}
                                href={doc.url || doc.url_documento || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-deep-navy/70 uppercase tracking-widest transition-colors group"
                              >
                                <FileText size={12} className="text-primary group-hover:scale-110 transition-transform" />
                                {doc.titulo || 'Ver Documento'}
                                <Download size={10} className="ml-1 opacity-50" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
