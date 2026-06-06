export type FieldType = "text" | "date" | "time" | "number" | "textarea";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: FieldDef[];
  buildW4H1: (data: Record<string, string>) => {
    who: Record<string, unknown>;
    what: Record<string, unknown>;
    when: Record<string, unknown>;
    where: Record<string, unknown>;
    why: Record<string, unknown>;
    how: Record<string, unknown>;
  };
  buildPrompt: (data: Record<string, string>) => string;
}

const common = (data: Record<string, string>) => ({
  instagram: data.instagram || "",
  whatsapp: data.whatsapp || "",
});

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "cumpleanos",
    name: "Cumpleaños",
    description: "Celebra un año más con una invitación memorable.",
    icon: "🎂",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "edad", label: "Edad", type: "number", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "hora", label: "Hora", type: "time", required: true },
      { name: "lugar", label: "Lugar", type: "text", required: true },
      { name: "tema", label: "Tema", type: "text", placeholder: "Ej: Tropical, Neón" },
      { name: "colores", label: "Colores", type: "text", placeholder: "Ej: Dorado y blanco" },
      { name: "instagram", label: "Instagram", type: "text", placeholder: "@usuario" },
      { name: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+57 300 000 0000" },
    ],
    buildW4H1: (d) => ({
      who: { celebrante: d.nombre, edad: Number(d.edad) || d.edad, ...common(d) },
      what: { evento: "Cumpleaños", tema: d.tema || null },
      when: { fecha: d.fecha, hora: d.hora },
      where: { lugar: d.lugar },
      why: { motivo: `Celebración de ${d.edad} años de ${d.nombre}` },
      how: { estilo: d.tema || "Elegante", paleta: d.colores || "Dorado y blanco" },
    }),
    buildPrompt: (d) =>
      `Elegant premium birthday invitation card for ${d.nombre} turning ${d.edad}. ` +
      `Theme: ${d.tema || "modern minimal"}. Color palette: ${d.colores || "gold, white and black"}. ` +
      `Event on ${d.fecha} at ${d.hora}, location ${d.lugar}. ` +
      `Style: Apple-like minimal, luxury typography, soft golden accents, photorealistic, high detail, 4k.`,
  },
  {
    id: "matrimonio",
    name: "Matrimonio",
    description: "Una invitación elegante para el día más especial.",
    icon: "💍",
    fields: [
      { name: "novia", label: "Nombre Novia", type: "text", required: true },
      { name: "novio", label: "Nombre Novio", type: "text", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "hora", label: "Hora", type: "time", required: true },
      { name: "ceremonia", label: "Ceremonia", type: "text", required: true, placeholder: "Iglesia / lugar" },
      { name: "recepcion", label: "Recepción", type: "text", required: true, placeholder: "Salón / lugar" },
      { name: "instagram", label: "Instagram", type: "text", placeholder: "@hashtag" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
    ],
    buildW4H1: (d) => ({
      who: { novia: d.novia, novio: d.novio, ...common(d) },
      what: { evento: "Matrimonio" },
      when: { fecha: d.fecha, hora: d.hora },
      where: { ceremonia: d.ceremonia, recepcion: d.recepcion },
      why: { motivo: `Unión en matrimonio de ${d.novia} y ${d.novio}` },
      how: { estilo: "Elegante clásico", paleta: "Dorado, blanco y negro" },
    }),
    buildPrompt: (d) =>
      `Luxury wedding invitation for ${d.novia} & ${d.novio}. Date ${d.fecha} at ${d.hora}. ` +
      `Ceremony at ${d.ceremonia}, reception at ${d.recepcion}. ` +
      `Style: timeless elegance, white and black with gold foil details, botanical accents, editorial typography, photorealistic 4k.`,
  },
  {
    id: "quince",
    name: "Quince Años",
    description: "Diseño sofisticado para una noche inolvidable.",
    icon: "👑",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "hora", label: "Hora", type: "time", required: true },
      { name: "lugar", label: "Lugar", type: "text", required: true },
      { name: "tema", label: "Tema", type: "text", placeholder: "Ej: Cenicienta, Hollywood" },
      { name: "instagram", label: "Instagram", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
    ],
    buildW4H1: (d) => ({
      who: { quinceanera: d.nombre, ...common(d) },
      what: { evento: "Quince Años", tema: d.tema || null },
      when: { fecha: d.fecha, hora: d.hora },
      where: { lugar: d.lugar },
      why: { motivo: `Celebración de los 15 años de ${d.nombre}` },
      how: { estilo: d.tema || "Glamour", paleta: "Dorado, blanco y negro" },
    }),
    buildPrompt: (d) =>
      `Sophisticated quinceañera invitation for ${d.nombre}. Theme: ${d.tema || "royal glamour"}. ` +
      `Event on ${d.fecha} at ${d.hora}, venue ${d.lugar}. ` +
      `Style: premium editorial, gold and black accents on white, tiara motif, luxurious, photorealistic 4k.`,
  },
];

export const getTemplate = (id: string) => EVENT_TEMPLATES.find((t) => t.id === id);
