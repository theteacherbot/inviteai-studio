import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { EVENT_TEMPLATES, getTemplate } from "@/lib/event-templates";
import { EventCard } from "@/components/EventCard";
import { DynamicForm } from "@/components/DynamicForm";
import { ResultView } from "@/components/ResultView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INVITAIA · Studio" },
      { name: "description", content: "Crea invitaciones profesionales impulsadas por IA en segundos." },
      { property: "og:title", content: "INVITAIA · Studio" },
      { property: "og:description", content: "Invitaciones premium generadas con IA: JSON, prompt, QR y PDF." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  component: Index,
});

type Step = "select" | "form" | "result";

function Index() {
  const [step, setStep] = useState<Step>("select");
  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const template = getTemplate(selectedId);

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)]">
      <Toaster position="top-center" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background font-display text-sm font-bold">
            iA
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">INVITAIA</span>
        </div>
        <nav className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Studio
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {step === "select" && (
          <section className="mx-auto">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
                Powered by AI
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
                INVITAIA <span className="text-gold">Studio</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Crea invitaciones profesionales impulsadas por IA. Elige el tipo de evento para comenzar.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT_TEMPLATES.map((t) => (
                <EventCard
                  key={t.id}
                  template={t}
                  selected={selectedId === t.id}
                  onSelect={() => setSelectedId(t.id)}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                size="lg"
                disabled={!selectedId}
                onClick={() => setStep("form")}
                className="min-w-[200px] bg-foreground text-background hover:bg-foreground/90"
              >
                Continuar →
              </Button>
            </div>
          </section>
        )}

        {step === "form" && template && (
          <section className="mx-auto max-w-3xl">
            <button
              onClick={() => setStep("select")}
              className="mb-6 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Cambiar tipo de evento
            </button>
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[0.25em] text-gold">{template.name}</div>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                Completa los detalles
              </h2>
              <p className="mt-2 text-muted-foreground">
                Estos datos generarán automáticamente el JSON, prompt, QR y PDF.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8">
              <DynamicForm
                template={template}
                onSubmit={(d) => {
                  setFormData(d);
                  setStep("result");
                }}
              />
            </div>
          </section>
        )}

        {step === "result" && template && (
          <section>
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[0.25em] text-gold">Resultado</div>
              <h2 className="mt-2 font-display text-3xl font-semibold">Tu invitación está lista</h2>
            </div>
            <ResultView template={template} data={formData} onBack={() => setStep("form")} />
          </section>
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © INVITAIA · Diseño premium con IA
      </footer>
    </div>
  );
}
