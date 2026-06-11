import type { ImageProvider } from "./types";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export const MockProvider: ImageProvider = {
  id: "mock",
  async generate(prompt: string) {
    const seed = hash(prompt);
    // Deterministic placeholder, no external API key needed.
    const url = `https://picsum.photos/seed/invitaia-${seed}/800/1000`;
    return { url, provider: "mock" };
  },
};
