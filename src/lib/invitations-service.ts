import { supabase } from "@/integrations/supabase/client";
import type { EventTemplate } from "./event-templates";

export interface ProjectDB {
  id: string;
  event_type_slug: string;
  event_type_name: string;
  form_data: Record<string, string>;
  w4h1: Record<string, unknown>;
  created_at: string;
}

export interface PromptDB {
  id: string;
  project_id: string;
  prompt_text: string;
  provider: string | null;
  model: string | null;
  created_at: string;
}

export interface JsonDB {
  id: string;
  project_id: string;
  w4h1: Record<string, unknown>;
  created_at: string;
}

export interface GeneratedImageDB {
  id: string;
  project_id: string;
  prompt_id: string | null;
  url: string;
  provider: string | null;
  created_at: string;
}

export interface GeneratedQrDB {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
  data_url: string;
  created_at: string;
}

export interface SaveInvitationInput {
  template: EventTemplate;
  data: Record<string, string>;
  qrPayload?: Record<string, unknown>;
  qrDataUrl?: string;
}

export interface SaveInvitationResult {
  project: ProjectDB;
  prompt: PromptDB;
  json: JsonDB;
  qr: GeneratedQrDB | null;
}

export async function saveInvitation({
  template,
  data,
  qrPayload,
  qrDataUrl,
}: SaveInvitationInput): Promise<SaveInvitationResult> {
  const w4h1 = template.buildW4H1(data);
  const promptText = template.buildPrompt(data);

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .insert({
      event_type_slug: template.id,
      event_type_name: template.name,
      form_data: data as never,
      w4h1: w4h1 as never,
    })
    .select()
    .single();
  if (projectErr) throw projectErr;

  const { data: prompt, error: promptErr } = await supabase
    .from("generated_prompts")
    .insert({
      project_id: project.id,
      prompt_text: promptText,
      provider: "pending",
      model: null,
    })
    .select()
    .single();
  if (promptErr) throw promptErr;

  const { data: jsonRow, error: jsonErr } = await supabase
    .from("generated_jsons")
    .insert({
      project_id: project.id,
      w4h1: w4h1 as never,
    })
    .select()
    .single();
  if (jsonErr) throw jsonErr;

  let qr: GeneratedQrDB | null = null;
  if (qrPayload && qrDataUrl) {
    const { data: qrRow, error: qrErr } = await supabase
      .from("generated_qrs")
      .insert({
        project_id: project.id,
        payload: qrPayload as never,
        data_url: qrDataUrl,
      })
      .select()
      .single();
    if (qrErr) throw qrErr;
    qr = qrRow as unknown as GeneratedQrDB;
  }

  return {
    project: project as unknown as ProjectDB,
    prompt: prompt as unknown as PromptDB,
    json: jsonRow as unknown as JsonDB,
    qr,
  };
}

export async function saveGeneratedImage(input: {
  projectId: string;
  promptId?: string | null;
  url: string;
  provider?: string;
}): Promise<GeneratedImageDB> {
  console.log("[saveGeneratedImage] INSERT payload", {
    project_id: input.projectId,
    prompt_id: input.promptId ?? null,
    url: input.url,
    provider: input.provider ?? null,
  });
  const { data, error } = await supabase
    .from("generated_images")
    .insert({
      project_id: input.projectId,
      prompt_id: input.promptId ?? null,
      url: input.url,
      provider: input.provider ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("[saveGeneratedImage] Supabase error", {
      message: error.message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
      full: error,
    });
    throw error;
  }
  console.log("[saveGeneratedImage] INSERT success", data);
  return data as unknown as GeneratedImageDB;
}

export async function listProjects(): Promise<ProjectDB[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProjectDB[];
}

export interface ProjectWithCoverDB extends ProjectDB {
  cover_url: string | null;
}

export async function listProjectsWithCover(): Promise<ProjectWithCoverDB[]> {
  // Fetch only the most recent image per project directly from PostgREST
  // by ordering the embedded resource and limiting it to 1 row.
  const { data, error } = await supabase
    .from("projects")
    .select("*, generated_images(url, created_at)")
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "generated_images", ascending: false })
    .limit(1, { foreignTable: "generated_images" });
  if (error) throw error;
  type Row = ProjectDB & { generated_images?: Array<{ url: string; created_at: string }> };
  return (data ?? []).map((row) => {
    const r = row as unknown as Row;
    const latest = r.generated_images?.[0] ?? null;
    const { generated_images: _omit, ...project } = r;
    return { ...(project as ProjectDB), cover_url: latest?.url ?? null };
  });
}

export async function getProject(id: string): Promise<ProjectDB> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as ProjectDB;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateProject(id: string): Promise<ProjectDB> {
  const original = await getProject(id);
  const { data, error } = await supabase
    .from("projects")
    .insert({
      event_type_slug: original.event_type_slug,
      event_type_name: original.event_type_name,
      form_data: original.form_data as never,
      w4h1: original.w4h1 as never,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ProjectDB;
}
