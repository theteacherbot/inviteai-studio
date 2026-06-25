import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { EventTemplate } from "@/lib/event-templates";
import { saveInvitation } from "@/lib/invitations-service";
import { useGeneratedImage } from "@/hooks/use-generated-image";

interface Props {
  template: EventTemplate;
  data: Record<string, string>;
  onBack: () => void;
}

const ASPECT_RATIO_TO_SIZE: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "2:3": { width: 1024, height: 1536 },
  "3:4": { width: 960, height: 1280 },
  "16:9": { width: 1366, height: 768 },
  "9:16": { width: 768, height: 1366 },
};

export function ResultView({ template, data, onBack }: Props) {
  const w4h1 = template.buildW4H1(data);
  const prompt = template.buildPrompt(data);
  const selectedModel = data.imageModel || "flux";
  const selectedAspectRatio = data.aspectRatio || "4:5";
  const selectedDesignType = data.designType || template.name;
  const selectedVisualStyle = data.visualStyle || "minimalista";
  const quickParams = data.quickParams?.trim() || "";
  const imageSize = ASPECT_RATIO_TO_SIZE[selectedAspectRatio] ?? ASPECT_RATIO_TO_SIZE["4:5"];
  const imagePrompt = [
    prompt,
    `Model: ${selectedModel}.`,
    `Design type: ${selectedDesignType}.`,
    `Visual style: ${selectedVisualStyle}.`,
    `Aspect ratio: ${selectedAspectRatio}.`,
    quickParams ? `Quick parameters: ${quickParams}.` : "",
    `JSON context: ${JSON.stringify(w4h1)}.`,
  ]
    .filter(Boolean)
    .join(" ");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const primaryName =
    data.nombre ||
    data.novia ||
    data.mama ||
    data.graduado ||
    data.comulgante ||
    data.anfitrion ||
    "Tu evento";
  const secondaryName = data.novio || data.bebe || data.padres || "";
  const dateLine = [data.fecha, data.hora].filter(Boolean).join(" · ");
  const locationLine =
    data.lugar ||
    data.ceremonia ||
    data.parroquia ||
    data.recepcion ||
    data.direccion ||
    data.institucion ||
    "";
  const accentLine = data.tema || data.codigoVestimenta || data.colores || data.mensaje || "";

  const { status: imageStatus, image } = useGeneratedImage({
    projectId: savedId,
    promptId,
    prompt: imagePrompt,
    providerId: "pollinations",
    metadata: {
      model: selectedModel,
      width: imageSize.width,
      height: imageSize.height,
      apiKey: data.pollinationsApiKey?.trim() || undefined,
    },
  });
  const generatedImageUrl = image?.url ?? null;

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
        setSavedId(res.project.id);
        setPromptId(res.prompt.id);
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

  const fetchAsDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const buildLegacyPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, w, pdf.internal.pageSize.getHeight(), "F");

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(180, 140, 60);
    pdf.setFontSize(11);
    pdf.text("INVITAIA · STUDIO", w / 2, 60, { align: "center" });

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
      if (f.name === "pollinationsApiKey") return;
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

  const buildImagePDF = async (imageDataUrl: string) => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageW, pageH, "F");

    // Image ~70% of upper page
    const imgH = pageH * 0.7;
    const imgW = pageW;
    pdf.addImage(imageDataUrl, "JPEG", 0, 0, imgW, imgH, undefined, "FAST");

    // Event data below image
    let y = imgH + 28;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 15, 15);
    pdf.setFontSize(18);
    pdf.text(template.name.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 18;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const lineParts: string[] = [];
    if (data.nombre) lineParts.push(data.nombre);
    if (data.novia && data.novio) lineParts.push(`${data.novia} & ${data.novio}`);
    if (data.fecha) lineParts.push(data.fecha);
    if (data.hora) lineParts.push(data.hora);
    if (data.lugar) lineParts.push(data.lugar);
    if (lineParts.length) {
      pdf.text(lineParts.join(" · "), pageW / 2, y, { align: "center", maxWidth: pageW - 80 });
      y += 16;
    }

    // QR bottom
    if (qrUrl) {
      const qrSize = 90;
      pdf.addImage(qrUrl, "PNG", pageW / 2 - qrSize / 2, pageH - qrSize - 40, qrSize, qrSize);
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text("Escanea para confirmar asistencia", pageW / 2, pageH - 20, { align: "center" });
    }

    pdf.save(`invitacion-${template.id}.pdf`);
  };

  const downloadPDF = async () => {
    if (imageStatus === "ready" && image?.url) {
      try {
        const dataUrl = await fetchAsDataUrl(image.url);
        await buildImagePDF(dataUrl);
        return;
      } catch (err) {
        console.error("PDF with image failed, falling back", err);
        toast.error("No se pudo incluir la imagen, usando PDF estándar");
      }
    }
    buildLegacyPDF();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* Invitation preview */}
      <Card className="overflow-hidden border-border p-0 shadow-lg shadow-black/5">
        <div ref={cardRef} className="relative min-h-[680px] overflow-hidden bg-[#111111] text-white">
          {generatedImageUrl ? (
            <img
              src={generatedImageUrl}
              alt={`Imagen generada para ${template.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(200,165,90,0.35),_transparent_36%),linear-gradient(180deg,_#181818_0%,_#0f0f0f_100%)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/80" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/85 via-black/55 to-transparent" />

          <div className="relative flex min-h-[680px] flex-col justify-between p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-white/90 backdrop-blur">
                  <span>{template.icon}</span>
                  <span>{template.name}</span>
                </div>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/82">
                  {template.description}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/35 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">IA</p>
                <p className="text-xs text-white/90">Preview generado</p>
              </div>
            </div>

            <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-black/20 p-6 backdrop-blur-xl sm:p-8">
              <div className="space-y-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">Invitación</p>
                <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                  {primaryName}
                  {secondaryName ? (
                    <>
                      <span className="mx-2 text-gold">&</span>
                      <span>{secondaryName}</span>
                    </>
                  ) : null}
                </h2>
                {accentLine ? <p className="text-sm italic text-white/80">{accentLine}</p> : null}
              </div>

              <div className="grid gap-3 text-center text-sm text-white/85 sm:grid-cols-3 sm:text-left">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Fecha</p>
                  <p className="mt-1 text-base font-medium text-white">{dateLine || "Por confirmar"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Lugar</p>
                  <p className="mt-1 text-base font-medium text-white">{locationLine || "Lugar por definir"}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="max-w-md text-center sm:text-left">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/55">Detalles</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">
                    {template.description} La imagen se compone a partir del JSON y del prompt creados por la app.
                  </p>
                </div>

                {qrUrl ? (
                  <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white p-3 text-center text-black shadow-2xl shadow-black/30">
                    <img src={qrUrl} alt="QR" className="h-24 w-24 rounded-2xl bg-white" />
                    <p className="text-[10px] uppercase tracking-[0.28em] text-black/55">Escanea para confirmar</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-end justify-between gap-4 text-xs text-white/75">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/50">Imagen generada</p>
                <p className="mt-1">
                  {imageStatus === "loading"
                    ? "Generando invitación…"
                    : imageStatus === "error"
                      ? "Se usará un fondo alternativo"
                      : "Lista para descargar"}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 backdrop-blur">
                {`${image?.provider ?? "mock"} · ${selectedModel}`}
              </div>
            </div>
          </div>
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
              Prompt IA + JSON
            </h3>
            <Button size="sm" variant="ghost" onClick={() => copy(imagePrompt, "Prompt")}>
              Copiar
            </Button>
          </div>
          <p className="rounded-lg bg-muted p-4 text-sm leading-relaxed">{imagePrompt}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Usa modelo {selectedModel} con relación {selectedAspectRatio} y contexto W4H1.
          </p>
        </Card>
      </div>
    </div>
  );
}
