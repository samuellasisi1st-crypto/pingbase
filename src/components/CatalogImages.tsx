import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Signed preview URLs for private catalogue photos. */
export function useSignedImages(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.join("|");
  useEffect(() => {
    const missing = paths.filter((p) => !urls[p] && !/^https?:/.test(p));
    if (!missing.length) return;
    void supabase.storage.from("attachments").createSignedUrls(missing, 3600).then(({ data }) => {
      const next: Record<string, string> = {};
      for (const d of data ?? []) if (d.path && d.signedUrl) next[d.path] = d.signedUrl;
      setUrls((u) => ({ ...u, ...next }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (p: string) => (/^https?:/.test(p) ? p : urls[p]);
}

export function CatalogImages({ workspaceId, paths, onChange, max = 8 }: { workspaceId: string; paths: string[]; onChange: (p: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const src = useSignedImages(paths);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, max - paths.length)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} isn't an image.`); continue; }
      if (file.size > 8 * 1024 * 1024) { toast.error(`${file.name} is over 8 MB.`); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${workspaceId}/catalog/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type });
      if (error) toast.error(error.message); else added.push(path);
    }
    onChange([...paths, ...added]);
    setBusy(false);
    if (input.current) input.current.value = "";
  };
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {paths.map((p, i) => (
        <div key={p} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-hover">
          {src(p) && <img src={src(p)} alt="" className="size-full object-cover" />}
          {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-panel px-1.5 py-0.5 text-[10px] text-foreground">Cover</span>}
          <button type="button" aria-label="Remove photo" onClick={() => onChange(paths.filter((x) => x !== p))} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-panel text-foreground shadow-xs">
            <X className="size-3.5" />
          </button>
          {i > 0 && <button type="button" onClick={() => onChange([p, ...paths.filter((x) => x !== p)])} className="absolute inset-x-1.5 bottom-1.5 rounded bg-panel px-1.5 py-0.5 text-[10px] text-foreground opacity-0 group-hover:opacity-100">Make cover</button>}
        </div>
      ))}
      {paths.length < max && (
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="grid aspect-square place-items-center rounded-lg border border-dashed border-border-strong bg-panel-subtle text-[11px] text-secondary hover:bg-hover">
          <span className="grid place-items-center gap-1">{busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}{busy ? "Uploading…" : "Add photos"}</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} />
    </div>
  );
}
