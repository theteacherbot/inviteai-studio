import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  deleteProject,
  duplicateProject,
  listProjectsWithCover,
  type ProjectWithCoverDB,
} from "@/lib/invitations-service";
import { getTemplate } from "@/lib/event-templates";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Mis Proyectos · INVITAIA Studio" },
      { name: "description", content: "Tu biblioteca de invitaciones generadas con INVITAIA Studio." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithCoverDB[] | null>(null);

  const refresh = () => {
    listProjectsWithCover()
      .then(setProjects)
      .catch((e) => {
        console.error(e);
        toast.error("No se pudieron cargar los proyectos");
        setProjects([]);
      });
  };

  useEffect(refresh, []);

  const onView = (p: ProjectWithCoverDB) => {
    sessionStorage.setItem(
      "invitaia:prefill",
      JSON.stringify({ templateId: p.event_type_slug, data: p.form_data, step: "result" }),
    );
    navigate({ to: "/" });
  };

  const onDuplicate = async (p: ProjectWithCoverDB) => {
    try {
      await duplicateProject(p.id);
      toast.success("Proyecto duplicado");
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo duplicar");
    }
  };

  const onDelete = async (p: ProjectWithCoverDB) => {
    if (!confirm(`¿Eliminar "${p.event_type_name}"?`)) return;
    try {
      await deleteProject(p.id);
      toast.success("Proyecto eliminado");
      setProjects((cur) => cur?.filter((x) => x.id !== p.id) ?? null);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)]">
      <Toaster position="top-center" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background font-display text-sm font-bold">
            iA
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">INVITAIA</span>
        </Link>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Studio</Link>
          <Link to="/projects" className="text-foreground">Mis Proyectos</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-gold">Biblioteca</div>
          <h1 className="mt-2 font-display text-4xl font-semibold">Mis Proyectos</h1>
          <p className="mt-2 text-muted-foreground">
            Todas tus invitaciones guardadas automáticamente.
          </p>
        </div>

        {projects === null && (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        )}

        {projects && projects.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground">Aún no tienes proyectos.</p>
            <Button asChild className="mt-4 bg-foreground text-background hover:bg-foreground/90">
              <Link to="/">Crear tu primera invitación</Link>
            </Button>
          </Card>
        )}

        {projects && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const t = getTemplate(p.event_type_slug);
              const title =
                p.form_data?.nombre ||
                p.form_data?.novia ||
                p.form_data?.graduado ||
                p.form_data?.titulo ||
                p.event_type_name;
              return (
                <Card key={p.id} className="flex flex-col overflow-hidden p-0">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={title}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-muted text-4xl">
                      {t?.icon ?? "✨"}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{t?.icon ?? "✨"}</div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.event_type_name}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold leading-tight">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onView(p)} className="bg-foreground text-background hover:bg-foreground/90">
                      Ver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDuplicate(p)}>
                      Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(p)} className="text-destructive hover:text-destructive">
                      Eliminar
                    </Button>
                  </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © INVITAIA · Studio
      </footer>
    </div>
  );
}
