import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { candidateId } = req.body;

    if (!candidateId) {
        return res.status(400).json({ error: 'candidateId is required' });
    }

    try {
        // Fetch candidate from Supabase
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (candidateError || !candidate) {
            return res.status(400).json({ error: 'Candidate not found' });
        }

        if (!candidate.resume_url) {
            return res.status(400).json({ error: 'Candidate does not have a resume uploaded' });
        }

        // Fetch matching job opening
        const { data: job, error: jobError } = await supabase
            .from('job_openings')
            .select('*')
            .eq('title', candidate.position)
            .single();

        if (jobError || !job) {
            return res.status(400).json({ error: 'Job opening not found for this candidate position' });
        }

        // Download the resume file for OpenAI
        let fileSource: File;
        if (candidate.resume_url.startsWith('http')) {
            const response = await fetch(candidate.resume_url);
            if (!response.ok) throw new Error('Failed to download resume from storage');
            const arrayBuffer = await response.arrayBuffer();
            fileSource = new File([arrayBuffer], 'curriculo.pdf', { type: 'application/pdf' });
        } else {
            return res.status(400).json({ error: 'Resume URL is not a valid HTTP URL' });
        }

        // Initialize OpenAI
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Upload file to OpenAI for analysis
        const file = await openai.files.create({
            file: fileSource,
            purpose: 'assistants'
        });

        // Build skills evaluation prompt
        const skillsList = job.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        const skillsInstruction = skillsList.map((s: string, i: number) => `  ${i + 1}. "${s}"`).join('\n');

        const prompt = `Analise o currículo anexo em relação à vaga e habilidades exigidas usando o método de pontuação abaixo.

VAGA: ${job.title} (${job.department})

HABILIDADES EXIGIDAS (avalie CADA uma individualmente):
${skillsInstruction}

MÉTODO DE PONTUAÇÃO OBRIGATÓRIO:
Para CADA habilidade listada acima, atribua uma nota de 0 a 100:
- 100: Habilidade explicitamente mencionada com experiência comprovada
- 75: Habilidade mencionada mas sem detalhamento de experiência
- 50: Habilidade indiretamente relacionada a algo mencionado no currículo
- 25: Habilidade vagamente inferível pelo contexto geral
- 0: Habilidade não mencionada nem inferível

O "score" final é a MÉDIA ARITMÉTICA das notas individuais, arredondada para inteiro.

Retorne APENAS um JSON válido com:
- "skills_evaluation": array de objetos com { "skill": string, "points": number }
- "score": número inteiro (média das notas acima)
- "reason": justificativa de até 2 frases informando os principais acertos e faltas em relação às habilidades exigidas`;

        // Call GPT-4o with file attachment
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0,
            seed: 42,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um sistema de pontuação de RH. Seja estritamente objetivo e determinístico. Avalie APENAS o que está escrito no currículo, sem inferir ou supor habilidades não mencionadas. Siga o método de pontuação fornecido sem desvios.'
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'file', file: { file_id: file.id } }
                    ] as any
                }
            ],
            response_format: { type: 'json_object' }
        });

        const aiText = completion.choices[0].message.content || '';

        // Cleanup temporary file from OpenAI
        try {
            await openai.files.delete(file.id);
        } catch (e) {
            console.warn('Could not delete OpenAI file:', file.id);
        }

        // Parse AI response
        let matchScore = 0;
        let matchReason = 'Análise concluída, porém sem justificativa estruturada.';

        if (aiText) {
            try {
                const parsed = JSON.parse(aiText);
                matchScore = typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score, 10) || 0;
                matchReason = parsed.reason || matchReason;
            } catch (err) {
                console.error('Failed to parse match JSON:', err);
                console.log('AI Raw text:', aiText);
            }
        }

        // Update candidate in Supabase
        const { error: updateError } = await supabase
            .from('candidates')
            .update({ match_score: matchScore, match_reason: matchReason })
            .eq('id', candidateId);

        if (updateError) {
            console.error('Error updating candidate match:', updateError);
        }

        return res.json({ success: true, match_score: matchScore, match_reason: matchReason });
    } catch (err) {
        console.error('Error calculating match:', err);
        return res.status(500).json({ error: 'Erro técnico no motor de IA.' });
    }
}
