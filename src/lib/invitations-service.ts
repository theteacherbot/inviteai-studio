import { supabase } from "@/integrations/supabase/client";
import type { EventTemplate } from "./event-templates";

export interface InvitationDB {
  id: string;
  event_type_slug: string;
  event_type_name: string;
  form_data: Record<string, string>;
  w4h1: Record<string, unknown>;
  created_at: string;
}

export interface PromptDB {
  id: string;
  event_id: string;
  prompt_text: string;
  provider: string | null;
  model: string | null;
  created_at: string;
}

export interface GeneratedImageDB {
  id: string;
  event_id: string;
  prompt_id: string | null;
  url: string;
  provider: string | null;
  created_at: string;
}

export interface GeneratedQrDB {
  id: string;
  event_id: string;
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
  event: InvitationDB;
  prompt: PromptDB;
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

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .insert({
      event_type_slug: template.id,
      event_type_name: template.name,
      form_data: data as never,
      w4h1: w4h1 as never,
    })
    .select()
    .single();
  if (eventErr) throw eventErr;

  const { data: prompt, error: promptErr } = await supabase
    .from("prompts")
    .insert({
      event_id: event.id,
      prompt_text: promptText,
      provider: "pending",
      model: null,
    })
    .select()
    .single();
  if (promptErr) throw promptErr;

  let qr: GeneratedQrDB | null = null;
  if (qrPayload && qrDataUrl) {
    const { data: qrRow, error: qrErr } = await supabase
      .from("generated_qrs")
      .insert({
        event_id: event.id,
        payload: qrPayload as never,
        data_url: qrDataUrl,
      })
      .select()
      .single();
    if (qrErr) throw qrErr;
    qr = qrRow as GeneratedQrDB;
  }

  return {
    event: event as InvitationDB,
    prompt: prompt as PromptDB,
    qr,
  };
}

export async function saveGeneratedImage(input: {
  eventId: string;
  promptId?: string | null;
  url: string;
  provider?: string;
}): Promise<GeneratedImageDB> {
  const { data, error } = await supabase
    .from("generated_images")
    .insert({
      event_id: input.eventId,
      prompt_id: input.promptId ?? null,
      url: input.url,
      provider: input.provider ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as GeneratedImageDB;
}
