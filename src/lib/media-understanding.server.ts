import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY = "https://ai.gateway.lovable.dev";
const TRANSCRIBE_MODEL = "google/gemini-3.5-transcribe";
const MAX_AUDIO_BYTES = 14 * 1024 * 1024;

/** Transcribe a stored voice note. Returns null if it can't be transcribed. */
export async function transcribeStoredAudio(path: string, mime: string, filename: string): Promise<string | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  const { data: blob, error } = await supabaseAdmin.storage.from("attachments").download(path);
  if (error || !blob || !blob.size || blob.size > MAX_AUDIO_BYTES) return null;
  // WhatsApp sends "audio/ogg; codecs=opus"; keep only the base type.
  const type = (mime.split(";")[0] || "audio/ogg").trim().replace(/^video\//, "audio/");
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("file", new File([blob], filename || "voice-note.ogg", { type }));
  form.append("response_format", "json");
  form.append("stream", "true");
  const res = await fetch(`${GATEWAY}/v1/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
    body: form,
  });
  if (!res.ok || !res.body) {
    console.error("Transcription failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let deltas = "";
  let final: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as { type?: string; delta?: string; text?: string };
        if (evt.type === "transcript.text.delta" && evt.delta) deltas += evt.delta;
        if (evt.type === "transcript.text.done" && typeof evt.text === "string") final = evt.text;
      } catch {
        /* ignore partial lines */
      }
    }
  }
  const text = (final ?? deltas).trim();
  return text || null;
}

export function isAudio(att: { mime?: string; filename?: string }) {
  return (att.mime ?? "").startsWith("audio/") || /\.(ogg|opus|m4a|mp3|aac|amr|wav)$/i.test(att.filename ?? "");
}
