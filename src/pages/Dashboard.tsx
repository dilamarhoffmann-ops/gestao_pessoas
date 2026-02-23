import React from 'react';
import { LayoutDashboard, Users, Scale, DollarSign, ArrowUpRight, Clock, FileText, Activity, Search } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-10 space-y-10 animate-slide-up pb-20">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 transition-transform hover:rotate-3">
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-deep-navy tracking-tight uppercase">Painel de <span className="text-primary">Controle</span></h2>
            <p className="text-deep-navy/40 font-bold text-sm tracking-tight">Visão estratégica e analítica das operações em tempo real.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-navy flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm">
            <Clock size={16} />
            Relatório de Performance
          </button>
        </div>
      </div>

      {/* Primary Context Search */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-deep-navy/30 group-focus-within:text-primary transition-colors" size={20} />
        <input
          className="search-input"
          placeholder="Pesquise por processos, nomes, códigos ou transações..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-premium transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner group-hover:scale-110 transition-transform">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-1">Fluxo Financeiro</p>
              <p className="text-2xl font-black text-deep-navy tracking-tighter">Descontos Pendentes</p>
            </div>
          </div>
          <span className="text-5xl font-black text-indigo-500 opacity-20">12</span>
        </div>

        <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-premium transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
              <Scale size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-1">Status Jurídico</p>
              <p className="text-2xl font-black text-deep-navy tracking-tighter">Processos Ativos</p>
            </div>
          </div>
          <span className="text-5xl font-black text-amber-500 opacity-20">05</span>
        </div>

        <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-premium transition-all relative overflow-hidden">
          <div className="absolute top-4 right-6 bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
            SYSTEM OK
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-deep-navy/30 uppercase tracking-[0.2em] mb-1">Banco de Talentos</p>
              <p className="text-2xl font-black text-deep-navy tracking-tighter">Vagas em Aberto</p>
            </div>
          </div>
          <span className="text-5xl font-black text-emerald-500 opacity-20">08</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-deep-navy/60 uppercase tracking-[0.3em] flex items-center gap-3">
              <Activity size={18} className="text-primary" />
              Linha do Tempo Operacional
            </h3>
            <button className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline px-4 py-1.5 bg-primary/5 rounded-lg border border-primary/10">Histórico Completo</button>
          </div>
          <div className="p-10">
            <ul className="space-y-10">
              <ActivityItem
                color="bg-primary"
                title="Contratação Realizada"
                description={<><strong className="text-deep-navy">João Silva</strong> foi admitido no time de TI.</>}
                time="Há 2 horas"
              />
              <ActivityItem
                color="bg-accent-orange"
                title="Financeiro"
                description={<>Novo adiantamento para <strong className="text-deep-navy">Maria Souza</strong> cadastrado.</>}
                time="Há 5 horas"
              />
              <ActivityItem
                color="bg-emerald-500"
                title="Prazo Jurídico"
                description={<>O caso <strong className="text-deep-navy">00234-2024</strong> vence em 3 dias.</>}
                time="Há 1 dia"
              />
            </ul>
          </div>
        </div>

        <div className="bg-deep-navy p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
            <FileText size={240} />
          </div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />

          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-white/40 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-white/20" />
            Ações de Alta Prioridade
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
            <QuickAction
              icon={<Users size={24} />}
              label="Nova Admissão"
              subtext="Pipeline de Gestão"
            />
            <QuickAction
              icon={<FileText size={24} />}
              label="Auditoria"
              subtext="Relatórios Consolidados"
            />
            <QuickAction
              icon={<DollarSign size={24} />}
              label="Financeiro"
              subtext="Lançar Desconto"
            />
            <QuickAction
              icon={<Scale size={24} />}
              label="Jurídico"
              subtext="Sincronizar CNJ"
            />
          </div>

          <div className="mt-12 flex items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Sincronização com tribunais ativa há 14 minutos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ color, title, description, time }: { color: string, title: string, description: React.ReactNode, time: string }) {
  return (
    <li className="flex gap-4 group cursor-default">
      <div className={`w-1 rounded-full ${color} opacity-40 group-hover:opacity-100 transition-opacity`}></div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-navy/40">{title}</span>
          <span className="text-[10px] font-medium text-deep-navy/30">{time}</span>
        </div>
        <p className="text-sm text-deep-navy/70 leading-relaxed">{description}</p>
      </div>
    </li>
  );
}

function QuickAction({ icon, label, subtext }: { icon: React.ReactNode, label: string, subtext: string }) {
  return (
    <button className="bg-white/5 border border-white/10 p-5 rounded-2xl text-left transition-all hover:bg-white/10 hover:translate-y-[-2px] hover:shadow-xl group">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="block text-sm font-black uppercase tracking-tight mb-1">{label}</span>
      <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{subtext}</span>
    </button>
  );
}

