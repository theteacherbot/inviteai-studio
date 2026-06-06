export type FieldType = "text" | "date" | "time" | "number" | "textarea";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
}

export interface W4H1 {
  who: Record<string, unknown>;
  what: Record<string, unknown>;
  when: Record<string, unknown>;
  where: Record<string, unknown>;
  why: Record<string, unknown>;
  how: Record<string, unknown>;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: FieldDef[];
  buildW4H1: (data: Record<string, string>) => W4H1;
  buildPrompt: (data: Record<string, string>) => string;
}

// ---- Reusable building blocks ---------------------------------------------

const SOCIAL_FIELDS: FieldDef[] = [
  { name: "instagram", label: "Instagram", type: "text", placeholder: "@usuario" },
  { name: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+57 300 000 0000" },
];

const WHEN_WHERE_FIELDS: FieldDef[] = [
  { name: "fecha", label: "Fecha", type: "date", required: true },
  { name: "hora", label: "Hora", type: "time", required: true },
  { name: "lugar", label: "Lugar", type: "text", required: true },
];

const social = (d: Record<string, string>) => ({
  instagram: d.instagram || "",
  whatsapp: d.whatsapp || "",
});

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  extraFields: FieldDef[];
  /** Use full custom field list instead of WHEN_WHERE_FIELDS + extras. */
  customFields?: FieldDef[];
  who: (d: Record<string, string>) => Record<string, unknown>;
  what: (d: Record<string, string>) => Record<string, unknown>;
  where?: (d: Record<string, string>) => Record<string, unknown>;
  why: (d: Record<string, string>) => Record<string, unknown>;
  how: (d: Record<string, string>) => Record<string, unknown>;
  promptStyle: string;
  promptSubject: (d: Record<string, string>) => string;
}

function buildTemplate(cfg: TemplateConfig): EventTemplate {
  const fields =
    cfg.customFields ?? [...cfg.extraFields, ...WHEN_WHERE_FIELDS, ...SOCIAL_FIELDS];

  return {
    id: cfg.id,
    name: cfg.name,
    description: cfg.description,
    icon: cfg.icon,
    fields,
    buildW4H1: (d) => ({
      who: { ...cfg.who(d), ...social(d) },
      what: cfg.what(d),
      when: { fecha: d.fecha, hora: d.hora },
      where: cfg.where ? cfg.where(d) : { lugar: d.lugar },
      why: cfg.why(d),
      how: cfg.how(d),
    }),
    buildPrompt: (d) =>
      `${cfg.promptSubject(d)} Date ${d.fecha} at ${d.hora}, venue ${d.lugar || "—"}. ` +
      `Style: ${cfg.promptStyle}, photorealistic, high detail, 4k, editorial typography, ` +
      `Apple-like minimal luxury, gold accents on white and black.`,
  };
}

// ---- Templates -------------------------------------------------------------

export const EVENT_TEMPLATES: EventTemplate[] = [
  buildTemplate({
    id: "cumpleanos",
    name: "Cumpleaños",
    description: "Celebra un año más con una invitación memorable.",
    icon: "🎂",
    extraFields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "edad", label: "Edad", type: "number", required: true },
      { name: "tema", label: "Tema", type: "text", placeholder: "Ej: Tropical, Neón" },
      { name: "colores", label: "Colores", type: "text", placeholder: "Ej: Dorado y blanco" },
    ],
    who: (d) => ({ celebrante: d.nombre, edad: Number(d.edad) || d.edad }),
    what: (d) => ({ evento: "Cumpleaños", tema: d.tema || null }),
    why: (d) => ({ motivo: `Celebración de ${d.edad} años de ${d.nombre}` }),
    how: (d) => ({ estilo: d.tema || "Elegante", paleta: d.colores || "Dorado y blanco" }),
    promptStyle: "modern minimal birthday luxury",
    promptSubject: (d) =>
      `Elegant premium birthday invitation card for ${d.nombre} turning ${d.edad}. Theme: ${d.tema || "modern minimal"}.`,
  }),

  buildTemplate({
    id: "matrimonio",
    name: "Matrimonio",
    description: "Una invitación elegante para el día más especial.",
    icon: "💍",
    extraFields: [],
    customFields: [
      { name: "novia", label: "Nombre Novia", type: "text", required: true },
      { name: "novio", label: "Nombre Novio", type: "text", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "hora", label: "Hora", type: "time", required: true },
      { name: "ceremonia", label: "Ceremonia", type: "text", required: true, placeholder: "Iglesia / lugar" },
      { name: "recepcion", label: "Recepción", type: "text", required: true, placeholder: "Salón / lugar" },
      ...SOCIAL_FIELDS,
    ],
    who: (d) => ({ novia: d.novia, novio: d.novio }),
    what: () => ({ evento: "Matrimonio" }),
    where: (d) => ({ ceremonia: d.ceremonia, recepcion: d.recepcion }),
    why: (d) => ({ motivo: `Unión en matrimonio de ${d.novia} y ${d.novio}` }),
    how: () => ({ estilo: "Elegante clásico", paleta: "Dorado, blanco y negro" }),
    promptStyle: "timeless elegance, botanical accents, gold foil details",
    promptSubject: (d) =>
      `Luxury wedding invitation for ${d.novia} & ${d.novio}. Ceremony at ${d.ceremonia}, reception at ${d.recepcion}.`,
  }),

  buildTemplate({
    id: "quince",
    name: "Quince Años",
    description: "Diseño sofisticado para una noche inolvidable.",
    icon: "👑",
    extraFields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "tema", label: "Tema", type: "text", placeholder: "Ej: Cenicienta, Hollywood" },
    ],
    who: (d) => ({ quinceanera: d.nombre }),
    what: (d) => ({ evento: "Quince Años", tema: d.tema || null }),
    why: (d) => ({ motivo: `Celebración de los 15 años de ${d.nombre}` }),
    how: (d) => ({ estilo: d.tema || "Glamour", paleta: "Dorado, blanco y negro" }),
    promptStyle: "premium editorial quinceañera, tiara motif, royal glamour",
    promptSubject: (d) =>
      `Sophisticated quinceañera invitation for ${d.nombre}. Theme: ${d.tema || "royal glamour"}.`,
  }),

  buildTemplate({
    id: "graduacion",
    name: "Graduación",
    description: "Honra un logro académico con estilo.",
    icon: "🎓",
    extraFields: [
      { name: "nombre", label: "Nombre del graduado", type: "text", required: true },
      { name: "titulo", label: "Título / Grado", type: "text", required: true, placeholder: "Ej: Ingeniería" },
      { name: "institucion", label: "Institución", type: "text", required: true },
      { name: "promocion", label: "Promoción", type: "text", placeholder: "Ej: 2026" },
    ],
    who: (d) => ({ graduado: d.nombre, titulo: d.titulo, institucion: d.institucion }),
    what: (d) => ({ evento: "Graduación", promocion: d.promocion || null }),
    why: (d) => ({ motivo: `Graduación de ${d.nombre} en ${d.titulo}` }),
    how: () => ({ estilo: "Académico elegante", paleta: "Dorado, negro y azul profundo" }),
    promptStyle: "academic elegance, laurel and graduation cap motif, deep navy and gold",
    promptSubject: (d) =>
      `Premium graduation invitation for ${d.nombre}, graduating in ${d.titulo} at ${d.institucion}.`,
  }),

  buildTemplate({
    id: "comunion",
    name: "Primera Comunión",
    description: "Una invitación serena para un día sagrado.",
    icon: "🕊️",
    extraFields: [
      { name: "nombre", label: "Nombre del niño/a", type: "text", required: true },
      { name: "parroquia", label: "Parroquia / Iglesia", type: "text", required: true },
    ],
    who: (d) => ({ comulgante: d.nombre }),
    what: () => ({ evento: "Primera Comunión" }),
    where: (d) => ({ parroquia: d.parroquia, recepcion: d.lugar }),
    why: (d) => ({ motivo: `Primera Comunión de ${d.nombre}` }),
    how: () => ({ estilo: "Sereno y delicado", paleta: "Blanco, dorado suave y crema" }),
    promptStyle: "serene delicate first communion, soft gold, white doves, watercolor accents",
    promptSubject: (d) =>
      `Refined first communion invitation for ${d.nombre} at ${d.parroquia}.`,
  }),

  buildTemplate({
    id: "babyshower",
    name: "Baby Shower",
    description: "Da la bienvenida con dulzura y elegancia.",
    icon: "👶",
    extraFields: [
      { name: "mama", label: "Nombre de la mamá", type: "text", required: true },
      { name: "bebe", label: "Nombre del bebé", type: "text", placeholder: "Si ya tiene nombre" },
      { name: "genero", label: "Género", type: "text", placeholder: "Niño / Niña / Sorpresa" },
      { name: "tema", label: "Tema", type: "text", placeholder: "Ej: Nubes, Safari" },
    ],
    who: (d) => ({ mama: d.mama, bebe: d.bebe || null, genero: d.genero || null }),
    what: (d) => ({ evento: "Baby Shower", tema: d.tema || null }),
    why: (d) => ({ motivo: `Baby shower de ${d.mama}` }),
    how: (d) => ({ estilo: d.tema || "Dulce minimalista", paleta: "Pastel con dorado" }),
    promptStyle: "soft pastel baby shower, dreamy clouds, delicate gold lines",
    promptSubject: (d) =>
      `Tender baby shower invitation for ${d.mama}${d.bebe ? `, welcoming ${d.bebe}` : ""}.`,
  }),

  buildTemplate({
    id: "aniversario",
    name: "Aniversario",
    description: "Conmemora años de amor o historia.",
    icon: "🥂",
    extraFields: [
      { name: "personas", label: "Personas / Pareja", type: "text", required: true, placeholder: "Ej: Ana & Luis" },
      { name: "anios", label: "Años a celebrar", type: "number", required: true },
      { name: "tipo", label: "Tipo", type: "text", placeholder: "Bodas / Empresa / Amistad" },
    ],
    who: (d) => ({ protagonistas: d.personas, anios: Number(d.anios) || d.anios }),
    what: (d) => ({ evento: "Aniversario", tipo: d.tipo || null }),
    why: (d) => ({ motivo: `Celebración de ${d.anios} años de ${d.personas}` }),
    how: () => ({ estilo: "Sofisticado atemporal", paleta: "Negro, dorado y champagne" }),
    promptStyle: "timeless anniversary, champagne tones, fine art typography",
    promptSubject: (d) =>
      `Sophisticated anniversary invitation celebrating ${d.anios} years of ${d.personas}.`,
  }),

  buildTemplate({
    id: "fiesta",
    name: "Fiesta Especial",
    description: "Para cualquier celebración fuera de catálogo.",
    icon: "🎉",
    extraFields: [
      { name: "titulo", label: "Título del evento", type: "text", required: true, placeholder: "Ej: Halloween Gala" },
      { name: "anfitrion", label: "Anfitrión", type: "text", required: true },
      { name: "tema", label: "Tema / Concepto", type: "text" },
      { name: "dresscode", label: "Dress code", type: "text", placeholder: "Ej: Black tie" },
      { name: "descripcion", label: "Descripción", type: "textarea" },
    ],
    who: (d) => ({ anfitrion: d.anfitrion }),
    what: (d) => ({ evento: d.titulo, tema: d.tema || null, descripcion: d.descripcion || null }),
    why: (d) => ({ motivo: d.descripcion || `Fiesta especial: ${d.titulo}` }),
    how: (d) => ({ estilo: d.tema || "Editorial moderno", dresscode: d.dresscode || null }),
    promptStyle: "bold editorial party, contemporary luxury, dramatic lighting",
    promptSubject: (d) =>
      `Striking invitation for "${d.titulo}" hosted by ${d.anfitrion}${d.tema ? `, theme ${d.tema}` : ""}${d.dresscode ? `, dress code ${d.dresscode}` : ""}.`,
  }),
];

export const getTemplate = (id: string) =>
  EVENT_TEMPLATES.find((t) => t.id === id);
