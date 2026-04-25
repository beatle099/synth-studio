import type { InstrumentId } from './engine';

export interface FreesoundResult {
  id: number;
  name: string;
  url: string;
  username: string;
  duration: number;
  license: string;
  previews: { 'preview-hq-mp3': string; 'preview-lq-mp3': string };
}

const BASE = 'https://freesound.org/apiv2';

export const RECOMMENDED_QUERIES: Record<Exclude<InstrumentId, 'drums'>, string> = {
  synth: 'analog synth lead one shot',
  guitar: 'acoustic guitar single note clean',
  bass: 'electric bass single note clean',
  vocal: 'vocal aah note sustained',
};

interface SearchOpts {
  query: string;
  token: string;
  pageSize?: number;
}

export async function searchSamples({ query, token, pageSize = 12 }: SearchOpts): Promise<FreesoundResult[]> {
  const params = new URLSearchParams({
    query,
    fields: 'id,name,url,username,duration,license,previews',
    page_size: String(pageSize),
    filter: 'duration:[0.2 TO 6.0]',
    token,
  });
  const res = await fetch(`${BASE}/search/text/?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Freesound ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.results as FreesoundResult[];
}

export const FREESOUND_TOKEN_KEY = 'synth-studio.freesound-token';
