import { supabase } from './supabase';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// AWS S3 Client Initialization
const s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION || 'sa-east-1',
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
    }
});

// Helper for S3 Uploads
const uploadToS3 = async (file: File, folder: string): Promise<string> => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileKey = `${folder}/${uniqueSuffix}-${file.name}`;
    const bucketName = import.meta.env.VITE_AWS_S3_BUCKET || 'gestao-dp';
    const region = import.meta.env.VITE_AWS_REGION || 'sa-east-1';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const body = new Uint8Array(arrayBuffer);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: body,
            ContentType: file.type
        });

        await s3Client.send(command);
        return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw error;
    }
};

// =============================================
// AUTH SERVICE (Supabase Auth Nativo)
// =============================================

export const authService = {
    async login(email: string, password: string) {
        console.log('[authService.login] Starting login for', email);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        console.log('[authService.login] signInWithPassword completed. Error:', error);
        if (error) throw new Error(error.message);

        console.log('[authService.login] Fetching profile for id:', data.user.id);
        // Fetch or Create profile
        let { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        console.log('[authService.login] Profile fetch completed. Error:', profileErr);

        // If profile is missing but user is authenticated, try to auto-create it (Synchronize)
        if (profileErr || !profile) {
            console.warn('Profile missing for authenticated user, attempting self-registration...');
            const { data: newProfile, error: createErr } = await supabase
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    name: data.user.user_metadata?.name || email.split('@')[0],
                    email: email,
                    role: 'Usuario',
                    allowed: true // Auto-allow during self-fix for legacy users
                }])
                .select()
                .single();

            if (createErr) {
                console.error('Failed to auto-create profile:', createErr);
                throw new Error('Perfil não encontrado e falha na sincronização automática.');
            }
            profile = newProfile;
        }

        if (!profile.allowed) throw new Error('Acesso ainda não liberado. Aguarde aprovação de um gestor.');

        return { user: { ...profile, email: data.user.email } };
    },

    async register(name: string, email: string, password: string, area: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role: 'Usuario', allowed: false },
                emailRedirectTo: window.location.origin,
            }
        });
        if (error) throw new Error(error.message);

        // Update profile with area
        if (data.user) {
            await supabase
                .from('profiles')
                .update({ area, name })
                .eq('id', data.user.id);
        }

        return { success: true };
    },

    async changePassword(newPassword: string) {
        // 1. Update password in Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        const { error: authErr } = await supabase.auth.updateUser({ password: newPassword });
        if (authErr) throw new Error(authErr.message);

        // 2. Clear force change flag in profiles
        const { error: profileErr } = await supabase
            .from('profiles')
            .update({ must_change_password: false })
            .eq('id', user.id);

        if (profileErr) throw new Error('Erro ao atualizar status do perfil.');

        return { success: true };
    },

    async logout() {
        await supabase.auth.signOut();
    },

    async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    async getCurrentProfile(userId?: string) {
        let uid = userId;
        let authUser: any = null;

        if (!uid) {
            console.log('[authService.getCurrentProfile] Calling supabase.auth.getUser()');
            const { data: { user }, error: userErr } = await supabase.auth.getUser();
            if (userErr || !user) return null;
            uid = user.id;
            authUser = user;
        } else {
            console.log('[authService.getCurrentProfile] Using provided userId:', uid);
            // Minimal mock for the self-fix feature if authUser isn't fully loaded
            authUser = { id: uid };
        }

        console.log('[authService.getCurrentProfile] Fetching profile for user', uid);
        let { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();
        console.log('[authService.getCurrentProfile] Fetched profile. Error:', profileErr);

        // Self-fix profile if missing while session is active
        if ((profileErr || !profile) && authUser) {
            const { data: newProfile } = await supabase
                .from('profiles')
                .insert([{
                    id: authUser.id,
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                    email: authUser.email || '',
                    role: 'Usuario',
                    allowed: true
                }])
                .select()
                .single();
            profile = newProfile;
        }

        return profile ? { ...profile, email: authUser?.email } : null;
    }
};

// =============================================
// DISCOUNTS SERVICE
// =============================================

export const discountsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(discount: { employee_name: string; type: string; original_value?: number; value: number; installments?: number }) {
        const { data, error } = await supabase
            .from('discounts')
            .insert(discount)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStatus(id: string | number, status: string) {
        const { error } = await supabase
            .from('discounts')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    }
};

// =============================================
// LAWSUITS SERVICE
// =============================================

export const lawsuitsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('lawsuits')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(lawsuit: any) {
        const { data, error } = await supabase
            .from('lawsuits')
            .insert(lawsuit)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string | number, lawsuit: any) {
        const { error } = await supabase
            .from('lawsuits')
            .update(lawsuit)
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async delete(id: string | number) {
        const { error } = await supabase
            .from('lawsuits')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async getDocuments(lawsuitId: string | number) {
        const { data, error } = await supabase
            .from('lawsuit_documents')
            .select('*')
            .eq('lawsuit_id', lawsuitId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addDocument(lawsuitId: string | number, file: File, uploadType: string) {
        const publicUrl = await uploadToS3(file, `lawsuit-docs/${lawsuitId}`);

        const { data, error } = await supabase
            .from('lawsuit_documents')
            .insert({
                lawsuit_id: lawsuitId,
                file_name: file.name,
                file_path: publicUrl,
                upload_type: uploadType
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteDocument(docId: string | number) {
        const { error } = await supabase
            .from('lawsuit_documents')
            .delete()
            .eq('id', docId);
        if (error) throw error;
        return { success: true };
    }
};

// =============================================
// CANDIDATES SERVICE
// =============================================

export const candidatesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(candidate: any, resumeFile?: File) {
        let resume_url = null;

        if (resumeFile) {
            resume_url = await uploadToS3(resumeFile, 'curriculos');
        }

        const { data, error } = await supabase
            .from('candidates')
            .insert({ ...candidate, resume_url })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string | number, candidate: any, resumeFile?: File) {
        let updateData = { ...candidate };

        if (resumeFile) {
            try {
                updateData.resume_url = await uploadToS3(resumeFile, 'curriculos');
            } catch (err) {
                console.error("Resume upload failed:", err);
            }
        }

        const { error } = await supabase
            .from('candidates')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        return { success: true, resume_url: updateData.resume_url };
    },

    async updateStatus(id: string | number, statusData: any) {
        const updateObj: any = { status: statusData.status };

        if (statusData.status === 'archived' || statusData.status === 'applied') {
            updateObj.match_score = null;
            updateObj.match_reason = null;
        }
        if (statusData.archive_reason !== undefined) updateObj.archive_reason = statusData.archive_reason;
        if (statusData.interview_notes !== undefined) updateObj.interview_notes = statusData.interview_notes;
        if (statusData.interview_notes_2 !== undefined) updateObj.interview_notes_2 = statusData.interview_notes_2;
        if (statusData.termination_date !== undefined) updateObj.termination_date = statusData.termination_date;

        const { error } = await supabase
            .from('candidates')
            .update(updateObj)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    },

    async delete(id: string | number) {
        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async updateDisc(id: string | number, profile: string) {
        const { error } = await supabase
            .from('candidates')
            .update({ disc_profile: profile })
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async matchCandidate(id: string | number) {
        const res = await fetch('/api/match-candidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro no motor de IA');
        return data;
    }
};

// =============================================
// JOB OPENINGS SERVICE
// =============================================

export const jobOpeningsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('job_openings')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(job: { title: string; open_positions: number; department: string; skills: string; salary: number }) {
        const { data, error } = await supabase
            .from('job_openings')
            .insert(job)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: number, job: any) {
        const { error } = await supabase
            .from('job_openings')
            .update(job)
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('job_openings')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    }
};

// =============================================
// COMPANIES SERVICE
// =============================================

export const companiesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async create(company: { name: string; cnpj: string }) {
        const { data, error } = await supabase
            .from('companies')
            .insert([company])
            .select();
        if (error) throw error;
        return data ? data[0] : null;
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    }
};

// =============================================
// RECEIPT CONFIGURATIONS SERVICE
// =============================================

export const receiptConfigService = {
    async getAll() {
        const { data, error } = await supabase
            .from('receipt_configurations')
            .select('*');
        if (error) throw error;
        return data;
    },

    async getById(receiptId: string) {
        const { data, error } = await supabase
            .from('receipt_configurations')
            .select('*, companies(name)')
            .eq('receipt_id', receiptId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    async save(config: any) {
        const items_json = config.items ? config.items : null;
        const payload = {
            receipt_id: config.receipt_id,
            company_id: config.company_id || null,
            supplier_name: config.supplier_name || null,
            supplier_document: config.supplier_document || null,
            payment_reason: config.payment_reason || null,
            value: config.value || null,
            date: config.date || null,
            has_template: config.has_template || false,
            template_url: config.template_url || null,
            requires_approval: config.requires_approval || false,
            approver_id: config.approver_id || null,
            is_approved: config.is_approved || false,
            pix_key: config.pix_key || null,
            items_json,
            requester: config.requester || null,
            custom_id: config.custom_id || null
        };

        const { error } = await supabase
            .from('receipt_configurations')
            .upsert(payload, { onConflict: 'receipt_id' });
        if (error) throw error;
        return { success: true };
    },

    async approve(receiptId: string) {
        const { error } = await supabase
            .from('receipt_configurations')
            .update({ is_approved: true })
            .eq('receipt_id', receiptId);
        if (error) throw error;
        return { success: true };
    },

    async emit(receiptId: string, entryData: any) {
        // Get current history
        const { data: config } = await supabase
            .from('receipt_configurations')
            .select('history_json, requires_approval, is_approved')
            .eq('receipt_id', receiptId)
            .single();

        let history: any[] = [];
        if (config?.history_json) {
            history = Array.isArray(config.history_json) ? config.history_json : [];
        }

        const newEntry = {
            id: Date.now().toString(),
            requires_approval: !!config?.requires_approval,
            is_approved: !!config?.is_approved,
            ...entryData,
            emitted_at: new Date().toISOString()
        };

        history.unshift(newEntry);
        if (history.length > 50) history = history.slice(0, 50);

        const { error } = await supabase
            .from('receipt_configurations')
            .update({ history_json: history })
            .eq('receipt_id', receiptId);

        if (error) throw error;
        return { success: true, entry: newEntry };
    },

    async deleteHistoryEntry(receiptId: string, entryId: string) {
        const { data: config } = await supabase
            .from('receipt_configurations')
            .select('history_json')
            .eq('receipt_id', receiptId)
            .single();

        if (!config?.history_json) return;

        let history = Array.isArray(config.history_json) ? config.history_json : [];
        history = history.filter((e: any) => e.id !== entryId);

        const { error } = await supabase
            .from('receipt_configurations')
            .update({ history_json: history })
            .eq('receipt_id', receiptId);

        if (error) throw error;
        return { success: true };
    },

    async uploadTemplate(file: File): Promise<string> {
        return await uploadToS3(file, 'templates');
    }
};

// =============================================
// USERS/PROFILES SERVICE (Admin)
// =============================================

export const usersService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async update(id: string, userData: any) {
        const { data, error } = await supabase
            .from('profiles')
            .update(userData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    }
};

// =============================================
// ISSUED RECEIPTS SERVICE
// =============================================

export const issuedReceiptsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('issued_receipts')
            .select('*, companies(name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as any[];
    },

    async save(receipt: any) {
        const { error } = await supabase
            .from('issued_receipts')
            .upsert(receipt);
        if (error) throw error;
        return { success: true };
    },

    async updateStatus(id: number, status: string) {
        const { error } = await supabase
            .from('issued_receipts')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('issued_receipts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    }
};
