import { useEffect, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Att = { path: string; filename: string; mime?: string; kind?: string };

const URL_RE = /(https?:\/\/[^\s]+)/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{p}</a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

function useSigned(path: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    supabase.storage.from("attachments").createSignedUrl(path, 3600).then(({ data }) => { if (live) setUrl(data?.signedUrl ?? null); });
    return () => { live = false; };
  }, [path]);
  return url;
}

function ImageAtt({ a }: { a: Att }) {
  const url = useSigned(a.path);
  const [open, setOpen] = useState(false);
  if (!url) return <div className="h-40 w-56 animate-pulse rounded-lg bg-hover" />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block overflow-hidden rounded-lg border border-border-subtle">
        <img src={url} alt={a.filename} className="max-h-64 w-full max-w-[280px] object-cover" loading="lazy" />
      </button>
      {open && (
        <div role="dialog" aria-label={a.filename} className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4" onClick={() => setOpen(false)}>
          <button type="button" aria-label="Close" className="absolute right-4 top-4 rounded-full bg-panel p-2 text-foreground"><X className="size-5" /></button>
          <img src={url} alt={a.filename} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}

function FileAtt({ a }: { a: Att }) {
  const url = useSigned(a.path);
  const ext = a.filename.split(".").pop()?.toUpperCase().slice(0, 4) ?? "FILE";
  return (
    <a href={url ?? undefined} target="_blank" rel="noopener noreferrer" download={a.filename}
      className="flex w-full max-w-[280px] items-center gap-3 rounded-lg border border-border-subtle bg-panel px-3 py-2.5 hover:bg-hover">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-cyan-soft text-primary"><FileText className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-foreground">{a.filename}</span>
        <span className="block text-[11px] text-tertiary">{ext}</span>
      </span>
      <Download className="size-4 shrink-0 text-tertiary" />
    </a>
  );
}

/** Renders message text (with clickable links) plus image previews and document cards. */
export function MessageContent({ body, attachments }: { body: string | null; attachments: unknown }) {
  const atts = (Array.isArray(attachments) ? attachments : []).filter((a): a is Att => !!a && typeof a === "object" && "path" in a);
  const text = atts.length
    ? (body ?? "").split("\n").filter((l) => !/^\[Customer sent .*\]$/.test(l.trim()) && !l.startsWith("📎 ")).join("\n").trim()
    : body ?? "";
  return (
    <div className="space-y-2">
      {atts.map((a) => ((a.kind ?? (a.mime?.startsWith("image/") ? "image" : "file")) === "image" ? <ImageAtt key={a.path} a={a} /> : <FileAtt key={a.path} a={a} />))}
      {text && <Linkified text={text} />}
    </div>
  );
}
