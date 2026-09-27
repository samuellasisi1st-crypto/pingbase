import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createWhatsAppTemplate, listWhatsAppTemplates, sendWhatsAppTest } from "@/lib/channels.functions";

export function WhatsAppTestConsole() {
  const qc = useQueryClient();
  const send = useServerFn(sendWhatsAppTest);
  const list = useServerFn(listWhatsAppTemplates);
  const create = useServerFn(createWhatsAppTemplate);

  const [to, setTo] = useState("");
  const [text, setText] = useState("Hi! This is Nia from Studio Nine Hair. How can I help you today?");
  const [tplName, setTplName] = useState("hello_world");
  const [tplLang, setTplLang] = useState("en_US");
  const [sending, setSending] = useState(false);

  const [newName, setNewName] = useState("appointment_reminder");
  const [newCat, setNewCat] = useState<"UTILITY" | "MARKETING">("UTILITY");
  const [newLang, setNewLang] = useState("en_GB");
  const [newBody, setNewBody] = useState("Hi {{1}}, this is a reminder of your appointment at Studio Nine Hair tomorrow at {{2}}.");
  const [creating, setCreating] = useState(false);

  const templates = useQuery({ queryKey: ["wa-templates"], queryFn: () => list() });

  async function doSend(mode: "text" | "template") {
    setSending(true);
    try {
      const r = await send({ data: { to: to.trim(), mode, text, templateName: tplName, language: tplLang } });
      if (r.ok) toast.success(`Sent. Meta message ID: ${r.messageId ?? "unknown"}`);
      else toast.error(r.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setSending(false);
    }
  }

  async function doCreate() {
    setCreating(true);
    try {
      const body = newBody.trim();
      const vars = body.match(/\{\{\d+\}\}/g)?.length ?? 0;
      const r = await create({ data: { name: newName.trim(), category: newCat, language: newLang.trim(), body } });
      if (r.ok) {
        toast.success(`Template created — status ${r.status}`);
        qc.invalidateQueries({ queryKey: ["wa-templates"] });
      } else toast.error(vars ? `${r.error} (templates with {{n}} placeholders may need example values in Meta)` : r.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create template");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-3">
        <p className="font-medium">WhatsApp test console</p>
        <p className="text-sm text-muted-foreground">
          Send real messages and manage templates through Meta's API from your connected number.
        </p>
      </div>
      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send">Send message</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="wa-to">Recipient phone (with country code)</Label>
            <Input id="wa-to" placeholder="+447407054474" value={to} onChange={(e) => setTo(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Free text only arrives if this person messaged your number in the last 24 hours. Otherwise send a template.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wa-text">Free-text message</Label>
            <Textarea id="wa-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            <div>
              <Button disabled={sending || !to} onClick={() => doSend("text")}>
                {sending ? "Sending…" : "Send text"}
              </Button>
            </div>
          </div>
          <div className="grid gap-1.5 border-t pt-4">
            <Label>Or send an approved template</Label>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Template"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={`${tplName}|${tplLang}`}
                onChange={(e) => {
                  const [n, l] = e.target.value.split("|");
                  setTplName(n);
                  setTplLang(l);
                }}
              >
                <option value="hello_world|en_US">hello_world (en_US)</option>
                {(templates.data?.templates ?? [])
                  .filter((t) => t.status === "APPROVED" && t.name !== "hello_world")
                  .map((t) => (
                    <option key={t.id} value={`${t.name}|${t.language}`}>
                      {t.name} ({t.language})
                    </option>
                  ))}
              </select>
              <Button variant="outline" disabled={sending || !to} onClick={() => doSend("template")}>
                Send template
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-name">Name</Label>
              <Input id="tpl-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-cat">Category</Label>
              <select
                id="tpl-cat"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as "UTILITY" | "MARKETING")}
              >
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-lang">Language</Label>
              <Input id="tpl-lang" value={newLang} onChange={(e) => setNewLang(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-body">Body</Label>
            <Textarea id="tpl-body" rows={3} value={newBody} onChange={(e) => setNewBody(e.target.value)} />
          </div>
          <div>
            <Button disabled={creating} onClick={doCreate}>
              {creating ? "Creating…" : "Create template"}
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Templates on this WhatsApp account</p>
              <Button variant="ghost" size="sm" onClick={() => templates.refetch()}>
                Refresh
              </Button>
            </div>
            {templates.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {templates.data && !templates.data.ok && <p className="text-sm text-destructive">{templates.data.error}</p>}
            {templates.error && <p className="text-sm text-destructive">{(templates.error as Error).message}</p>}
            <ul className="grid gap-1.5">
              {(templates.data?.templates ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    {t.name} <span className="text-muted-foreground">· {t.language} · {t.category.toLowerCase()}</span>
                  </span>
                  <Badge variant={t.status === "APPROVED" ? "default" : t.status === "REJECTED" ? "destructive" : "secondary"}>
                    {t.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
