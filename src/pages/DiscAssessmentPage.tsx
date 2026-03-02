import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const QUESTIONS = [
    { id: 1, text: "Eu me considero uma pessoa que foca sempre em resultados rápidos e não tenho medo de cobrar os outros.", type: "D" },
    { id: 2, text: "Eu prefiro agir com cautela e perfeição, evitando erros a todo custo.", type: "C" },
    { id: 3, text: "Eu faço amizades facilmente e gosto de ser o centro das atenções.", type: "I" },
    { id: 4, text: "Eu procuro resolver conflitos de forma pacífica e prezo pela harmonia da equipe.", type: "S" },
    { id: 5, text: "Eu assumo a liderança rapidamente em projetos que precisam de atitude e direcionamento.", type: "D" },
    { id: 6, text: "Eu sou extremamente analítico e prefiro basear minhas decisões apenas em fatos lógicos.", type: "C" },
    { id: 7, text: "Eu me motivo muito pelo reconhecimento público das minhas conquistas e pelo trabalho em equipe.", type: "I" },
    { id: 8, text: "Eu prefiro um ritmo de trabalho estável e consistente e não lido bem com mudanças bruscas.", type: "S" },
    { id: 9, text: "Eu sou impaciente com tarefas demoradas e sempre procuro atalhos eficientes.", type: "D" },
    { id: 10, text: "Eu gosto de assegurar que toda a documentação esteja perfeitamente elaborada e revisada.", type: "C" },
    { id: 11, text: "Eu me sinto energizado ao conhecer novas pessoas e apresentar novas ideias com muito entusiasmo.", type: "I" },
    { id: 12, text: "Eu prefiro ser um bom ouvinte e oferecer suporte a meus colegas quando eles estão com problemas.", type: "S" },
    { id: 13, text: "Eu gosto de desafios frequentes, pois sinto que a vida precisa ter momentos de adrenalina e conquistas.", type: "D" },
    { id: 14, text: "Eu sempre avalio criticamente uma ideia nova antes de aceitar que ela é a melhor direção.", type: "C" },
    { id: 15, text: "Eu sou muito otimista diante de problemas, muitas vezes convencendo os outros a não se preocuparem.", type: "I" },
    { id: 16, text: "Eu evito tomar riscos desnecessários; para mim, o caminho seguro e conhecido é o melhor.", type: "S" },
    { id: 17, text: "Eu posso parecer um pouco insensível quando lido com assuntos que requerem urgência extrema.", type: "D" },
    { id: 18, text: "Eu odeio entregar um trabalho pela metade e sempre confiro os mínimos detalhes do meu produto.", type: "C" },
    { id: 19, text: "Eu falo bastante e tendo a envolver as pessoas nas minhas conversas por longos períodos.", type: "I" },
    { id: 20, text: "Eu aprecio sinceramente quando percebo que sou essencial e que minha ajuda sustentou uma grande tarefa.", type: "S" },
];

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function DiscAssessmentPage() {
    const { id } = useParams<{ id: string }>();
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [resultData, setResultData] = useState<{ profile: string; explanation: string; color: string } | null>(null);
    const [error, setError] = useState("");

    const shuffledQuestions = useMemo(() => shuffleArray(QUESTIONS), []);

    const answeredCount = Object.keys(answers).length;
    const isReady = answeredCount === QUESTIONS.length;

    const handleSelect = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const getDetailedProfile = () => {
        let d = 0, i = 0, s = 0, c = 0;
        QUESTIONS.forEach(q => {
            const score = answers[q.id] || 0;
            if (q.type === 'D') d += score;
            if (q.type === 'I') i += score;
            if (q.type === 'S') s += score;
            if (q.type === 'C') c += score;
        });

        const scores = [
            { type: 'D', value: d, label: 'Dominância', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', expl: 'Focado em resultados rápidos, desafiador e assertivo. Tende a ser direto e adora desafios (Quadrante: Ativo/Questionador).' },
            { type: 'I', value: i, label: 'Influência', color: 'text-amber-600 bg-amber-50 border-amber-200', expl: 'Entusiasta, sociável e extrovertido. Foca na colaboração e adora ser o centro das soluções criativas (Quadrante: Ativo/Receptivo).' },
            { type: 'S', value: s, label: 'Estabilidade', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', expl: 'Paciente, confiável e diplomático. Preza por ambientes estáveis, calmos e pelo constante apoio mútuo (Quadrante: Ponderado/Receptivo).' },
            { type: 'C', value: c, label: 'Cautela', color: 'text-blue-600 bg-blue-50 border-blue-200', expl: 'Analítico, metódico e preciso. Separa estritamente emoções de fatos para garantir a qualidade impecável (Quadrante: Ponderado/Questionador).' },
        ].sort((a, b) => b.value - a.value);

        const primary = scores[0];
        const secondary = scores[1];

        let matchStr = `${primary.label} (${primary.type})`;
        let explStr = primary.expl;

        // Validation for adjacent profiles (12 styles rule)
        const isAdjacent = (t1: string, t2: string) => {
            const adj: Record<string, string[]> = {
                'D': ['I', 'C'],
                'I': ['D', 'S'],
                'S': ['I', 'C'],
                'C': ['S', 'D']
            };
            return adj[t1].includes(t2);
        };

        // If the secondary trait is very close to primary (e.g. within 3 points), it creates a blended style
        if (primary.value - secondary.value <= 3 && isAdjacent(primary.type, secondary.type)) {
            const combo = `${primary.type}${secondary.type}`;
            matchStr = `Perfil ${combo} (${primary.label} + ${secondary.label})`;

            switch (combo) {
                case 'DI': case 'ID': explStr = 'Dinâmico e Empreendedor. Busca resultados rápidos em parceria, combinando pura assertividade e forte carisma social.'; break;
                case 'IS': case 'SI': explStr = 'Comunitário e Agregador. Coloca as pessoas em primeiro lugar, promove harmonia e um entusiasmo constante no time.'; break;
                case 'SC': case 'CS': explStr = 'Preciso e Apoiador. Prefere processos muito estruturados e cautelosos, garantindo suporte estável sem correr riscos.'; break;
                case 'CD': case 'DC': explStr = 'Lógico e Resolutivo. Perfil cético que foca inteiramente em fatos eficientes para chegar ao resultado final com perfeição.'; break;
            }
        }

        return {
            profile: matchStr,
            explanation: explStr,
            color: primary.color
        };
    };

    const handleSubmit = async () => {
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < QUESTIONS.length) {
            setError(`Ainda faltam ${QUESTIONS.length - answeredCount} afirmações para serem respondidas.`);
            // Scroll to top of the error to ensure user sees it
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            return;
        }
        setError("");

        const calculatedResult = getDetailedProfile();

        // Attempt to save to backend
        try {
            await fetch(`/api/candidates/${id}/disc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: calculatedResult.profile, rawScores: answers })
            });
        } catch (e) {
            console.error("Failed to save DISC profile", e);
        }

        // Delay slightly for UX
        setTimeout(() => {
            setResultData(calculatedResult);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    };

    if (resultData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-primary/20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white max-w-2xl w-full rounded-3xl p-10 text-center shadow-xl border border-slate-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-primary"></div>

                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-emerald-100">
                        <CheckCircle size={36} />
                    </div>

                    <h2 className="text-3xl font-black text-deep-navy tracking-tight mb-2">Questionário Concluído</h2>
                    <p className="text-deep-navy/40 font-bold uppercase tracking-widest text-xs mb-10">Análise Processada com Sucesso</p>

                    <div className={`p-8 rounded-[2rem] border mb-10 ${resultData.color} bg-opacity-30`}>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-2">Seu Perfil Comportamental é:</p>
                        <h3 className="text-4xl font-black tracking-tight mb-4">{resultData.profile}</h3>
                        <p className="font-medium text-sm leading-relaxed opacity-90">{resultData.explanation}</p>
                    </div>

                    <p className="text-sm text-deep-navy/60 leading-relaxed mb-6 font-medium">
                        Muito obrigado por participar. Suas respostas de Perfil Comportamental foram enviadas e atreladas à sua candidatura no nosso setor de Recursos Humanos.
                    </p>
                    <p className="text-[11px] text-deep-navy/40 uppercase tracking-widest font-black bg-slate-50 p-3 rounded-xl inline-block">Você já pode fechar esta aba.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans selection:bg-primary/20">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-[2rem] p-8 md:p-12 mb-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-deep-navy tracking-tight">Análise Comportamental (DISC)</h1>
                            <p className="text-deep-navy/40 font-bold uppercase tracking-widest text-[10px] mt-1">Mapeamento de Competências Socioemocionais</p>
                        </div>
                    </div>
                    <p className="text-deep-navy/60 leading-relaxed">
                        Bem-vindo ao mapeamento de perfil. Abaixo, você encontrará 20 afirmações. Para cada uma, indique o quanto você concorda ou discorda, onde <strong className="text-primary">1 significa "Discordo Totalmente"</strong> e <strong className="text-primary">5 significa "Concordo Totalmente"</strong>. Seja honesto para o melhor direcionamento!
                    </p>
                </div>

                {/* Questões */}
                <div className="space-y-6">
                    {shuffledQuestions.map((q, index) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white rounded-[1.5rem] p-6 shadow-sm border transition-all ${answers[q.id] ? 'border-primary/30 shadow-primary/5' : 'border-slate-100'}`}
                        >
                            <h3 className="text-sm font-black text-deep-navy mb-4"><span className="text-deep-navy/30 mr-2">{String(index + 1).padStart(2, '0')}.</span> {q.text}</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-deep-navy/40 tracking-widest mr-2">Discordo</span>
                                {[1, 2, 3, 4, 5].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleSelect(q.id, val)}
                                        className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center transition-all ${answers[q.id] === val
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                            : 'bg-slate-50 text-deep-navy/50 hover:bg-slate-100'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                                <span className="text-[10px] font-black uppercase text-deep-navy/40 tracking-widest ml-2">Concordo</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="bg-white rounded-[2rem] p-8 mt-8 shadow-sm border border-slate-100 flex flex-col items-center">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 bg-rose-50 text-rose-600 px-6 py-4 rounded-xl text-sm font-medium flex items-center gap-3 w-full"
                            >
                                <AlertCircle size={18} /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={handleSubmit}
                        className={`w-full md:w-auto font-black uppercase tracking-widest text-xs px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isReady
                            ? 'bg-deep-blue hover:bg-primary text-white shadow-xl shadow-deep-blue/20'
                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                    >
                        <Send size={18} />
                        {isReady ? 'Processar Análise DISC' : `Finalizar Questionário (${answeredCount}/${QUESTIONS.length})`}
                    </button>
                </div>

            </div>
        </div>
    );
}
