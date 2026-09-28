import { lazy, Suspense, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Loader2, Paperclip, Smile, Sparkles as Wand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { composerSlots, draftReply, sendAttachment } from "@/lib/inbox.functions";
import { formatSalonDateTime } from "@/lib/time";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

type Props = {
  conversationId: string;
  workspaceId: string;
  draft: string;
  setDraft: (v: string) => void;
  onSent: () => void;
};

export function ChatComposerTools({ conversationId, workspaceId, draft, setDraft, onSent }: Props) {
  const [open, setOpen] = useState<null | "emoji" | "calendar">(null);
  const [uploading, setUploading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const btn = "rounded p-1.5 hover:bg-hover disabled:opacity-40";

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("Files must be under 16 MB"); return; }
    setUploading(true);
    try {
      const path = `${workspaceId}/${conversationId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const up = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      await sendAttachment({ data: { conversationId, path, filename: file.name, mime: file.type || "application/octet-stream" } });
      toast.success("File sent");
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the file");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDraft = async () => {
    setDrafting(true);
    try {
      const r = await draftReply({ data: { conversationId, hint: draft.trim() || undefined } });
      setDraft(r.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not draft a reply");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="relative flex gap-1 text-secondary">
      <input ref={fileRef} type="file" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      <button type="button" title="Attach a file" aria-label="Attach a file" className={btn} disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
      </button>
      <button type="button" title="Emoji" aria-label="Emoji" className={btn} onClick={() => setOpen(open === "emoji" ? null : "emoji")}><Smile className="size-4" /></button>
      <button type="button" title="Offer appointment times" aria-label="Offer appointment times" className={btn} onClick={() => setOpen(open === "calendar" ? null : "calendar")}><CalendarDays className="size-4" /></button>
      <button type="button" title="Draft a reply with AI" aria-label="Draft a reply with AI" className={btn} disabled={drafting} onClick={() => void onDraft()}>
        {drafting ? <Loader2 className="size-4 animate-spin" /> : <Wand className="size-4" />}
      </button>

      {open === "emoji" && (
        <div className="absolute bottom-10 left-0 z-50">
          <Suspense fallback={<div className="rounded-lg border border-border bg-panel p-4 text-[12px]">Loading…</div>}>
            <EmojiPicker
              lazyLoadEmojis
              height={360}
              width={300}
              onEmojiClick={(e) => { setDraft(draft + e.emoji); setOpen(null); }}
            />
          </Suspense>
        </div>
      )}
      {open === "calendar" && (
        <SlotPicker conversationId={conversationId} onPick={(text) => { setDraft(draft ? `${draft}\n${text}` : text); setOpen(null); }} />
      )}
    </div>
  );
}

function SlotPicker({ conversationId, onPick }: { conversationId: string; onPick: (text: string) => void }) {
  const [serviceId, setServiceId] = useState<string>("");
  const services = useQuery({
    queryKey: ["composer-services"],
    queryFn: async () => (await supabase.from("services").select("id,name,duration_minutes").eq("active", true).order("name")).data ?? [],
  });
  const slots = useQuery({
    queryKey: ["composer-slots", conversationId, serviceId],
    enabled: Boolean(serviceId),
    queryFn: () => composerSlots({ data: { conversationId, serviceId } }),
  });
  const service = services.data?.find((s) => s.id === serviceId);
  return (
    <div className="absolute bottom-10 left-0 z-50 w-72 rounded-lg border border-border bg-panel p-3 shadow-md">
      <p className="mb-2 text-[12px] text-foreground">Offer real open times</p>
      <select className="mb-2 w-full rounded-md border border-border bg-panel px-2 py-1.5 text-[12px] text-foreground" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
        <option value="">Choose a service…</option>
        {services.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {slots.isFetching && <p className="text-[11px] text-tertiary">Checking availability…</p>}
      {slots.data?.error && <p className="text-[11px] text-red-strong">{slots.data.error}</p>}
      {slots.data && !slots.data.error && slots.data.slots.length === 0 && <p className="text-[11px] text-tertiary">No open times found.</p>}
      <div className="grid max-h-56 gap-1 overflow-y-auto">
        {slots.data?.slots.map((s) => (
          <button key={s.starts_at + s.staff_id} type="button" className="rounded-md border border-border-subtle px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-hover"
            onClick={() => onPick(`${service?.name ?? "Appointment"} with ${s.staff_name}: ${formatSalonDateTime(s.starts_at)}`)}>
            {formatSalonDateTime(s.starts_at)} · {s.staff_name}
          </button>
        ))}
      </div>
      {slots.data?.slots.length ? (
        <button type="button" className="mt-2 w-full rounded-md bg-primary px-2 py-1.5 text-[12px] text-white hover:bg-primary-hover"
          onClick={() => onPick(`Here are some open times for ${service?.name ?? "your appointment"}:\n${slots.data!.slots.slice(0, 4).map((s) => `• ${formatSalonDateTime(s.starts_at)} with ${s.staff_name}`).join("\n")}\nWhich works best for you?`)}>
          Insert all as options
        </button>
      ) : null}
    </div>
  );
}
