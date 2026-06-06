import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { EventTemplate } from "@/lib/event-templates";
import { saveInvitation } from "@/lib/invitations-service";

interface Props {
  template: EventTemplate;
  data: Record<string, string>;
  onBack: () => void;
}

export function ResultView({ template, data, onBack }: Props) {
  const w4h1 = template.buildW4H1(data);
  const prompt = template.buildPrompt(data);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const qrPayload = {
    rsvp: true,
    whatsapp: data.whatsapp || null,
    instagram: data.instagram || null,
    evento: template.name,
    fecha: data.fecha,
  };
  const qrPayloadString = JSON.stringify(qrPayload);

  useEffect(() => {
    QRCode.toDataURL(qrPayloadString, {
      width: 512,
      margin: 1,
      color: { dark: "#111111", light: "#FFFFFF" },
    }).then(setQrUrl);
  }, [qrPayloadString]);

  // Persist invitation once QR is ready
  useEffect(() => {
    if (!qrUrl || savedId) return;
    saveInvitation({ template, data, qrPayload, qrDataUrl: qrUrl })
      .then((res) => {
        setSavedId(res.event.id);
        toast.success("Invitación guardada en tu biblioteca");
      })
      .catch((err) => {
        console.error("save invitation failed", err);
        toast.error("No se pudo guardar la invitación");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrUrl]);


  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qr-${template.id}.png`;
    a.click();
  };

  const downloadPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, w, pdf.internal.pageSize.getHeight(), "F");

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(180, 140, 60);
    pdf.setFontSize(11);
    pdf.text("INVITAIA · DESIGN GENERATOR", w / 2, 60, { align: "center" });

    pdf.setTextColor(15, 15, 15);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.text(template.name.toUpperCase(), w / 2, 120, { align: "center" });

    pdf.setDrawColor(200, 165, 90);
    pdf.setLineWidth(1);
    pdf.line(w / 2 - 40, 140, w / 2 + 40, 140);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(13);
    let y = 200;
    template.fields.forEach((f) => {
      const v = data[f.name];
      if (!v) return;
      pdf.setTextColor(120, 120, 120);
      pdf.text(f.label.toUpperCase(), w / 2, y, { align: "center" });
      pdf.setTextColor(15, 15, 15);
      pdf.setFontSize(16);
      pdf.text(String(v), w / 2, y + 22, { align: "center" });
      pdf.setFontSize(13);
      y += 56;
    });

    if (qrUrl) pdf.addImage(qrUrl, "PNG", w / 2 - 70, y + 10, 140, 140);
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Escanea para confirmar asistencia", w / 2, y + 170, { align: "center" });

    pdf.save(`invitacion-${template.id}.pdf`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* Invitation preview */}
      <Card className="overflow-hidden border-border p-0">
        <div
          ref={cardRef}
          className="relative flex min-h-[640px] flex-col items-center justify-center gap-6 bg-gradient-to-b from-white to-accent/40 p-10 text-center"
        >
          <div className="text-xs uppercase tracking-[0.3em] text-gold">
            {template.name}
          </div>
          <div className="h-px w-16 bg-gold" />
          <h2 className="font-display text-4xl font-semibold">
            {data.nombre || data.novia || "Tu evento"}
            {data.novio && <> <span className="text-gold">&</span> {data.novio}</>}
          </h2>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {data.fecha && <p className="text-base text-foreground">{data.fecha} · {data.hora}</p>}
            {data.lugar && <p>{data.lugar}</p>}
            {data.ceremonia && <p>Ceremonia: {data.ceremonia}</p>}
            {data.recepcion && <p>Recepción: {data.recepcion}</p>}
            {data.tema && <p className="italic">Tema: {data.tema}</p>}
          </div>
          {qrUrl && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <img src={qrUrl} alt="QR" className="h-32 w-32 rounded-lg border bg-white p-2" />
              <p className="text-xs text-muted-foreground">Escanea para confirmar</p>
            </div>
          )}
        </div>
      </Card>

      {/* Side panel */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadPDF} className="bg-foreground text-background hover:bg-foreground/90">
            Descargar PDF
          </Button>
          <Button onClick={downloadQR} variant="outline">Descargar QR</Button>
          <Button onClick={onBack} variant="ghost">← Editar</Button>
        </div>

        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">JSON W4H1</h3>
            <Button size="sm" variant="ghost" onClick={() => copy(JSON.stringify(w4h1, null, 2), "JSON")}>
              Copiar
            </Button>
          </div>
          <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
            {JSON.stringify(w4h1, null, 2)}
          </pre>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Prompt IA
            </h3>
            <Button size="sm" variant="ghost" onClick={() => copy(prompt, "Prompt")}>
              Copiar
            </Button>
          </div>
          <p className="rounded-lg bg-muted p-4 text-sm leading-relaxed">{prompt}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Listo para usar con OpenAI Images, Pollinations, Flux o Ideogram.
          </p>
        </Card>
      </div>
    </div>
  );
}
