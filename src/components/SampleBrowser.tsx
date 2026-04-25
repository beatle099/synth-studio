import { useEffect, useState } from 'react';
import {
  searchSamples,
  RECOMMENDED_QUERIES,
  FREESOUND_TOKEN_KEY,
  type FreesoundResult,
} from '../audio/freesound';
import { engine, type InstrumentId } from '../audio/engine';

interface Props {
  pitchInstrument: InstrumentId;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function SampleBrowser({ pitchInstrument }: Props) {
  const [token, setToken] = useState<string>(() => localStorage.getItem(FREESOUND_TOKEN_KEY) ?? '');
  const [query, setQuery] = useState<string>(
    pitchInstrument === 'drums' ? 'drum kick one shot' : RECOMMENDED_QUERIES[pitchInstrument],
  );
  const [results, setResults] = useState<FreesoundResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [previewing, setPreviewing] = useState<number | null>(null);

  useEffect(() => {
    setQuery(pitchInstrument === 'drums' ? 'drum kick one shot' : RECOMMENDED_QUERIES[pitchInstrument]);
  }, [pitchInstrument]);

  const saveToken = (t: string) => {
    setToken(t);
    if (t) localStorage.setItem(FREESOUND_TOKEN_KEY, t);
    else localStorage.removeItem(FREESOUND_TOKEN_KEY);
  };

  const onSearch = async () => {
    setError(null);
    if (!token) {
      setError('Paste a Freesound API token first (free at freesound.org/help/developers/).');
      return;
    }
    setSearching(true);
    try {
      const r = await searchSamples({ query, token });
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearching(false);
    }
  };

  const preview = (r: FreesoundResult) => {
    setPreviewing(r.id);
    const audio = new Audio(r.previews['preview-hq-mp3']);
    audio.play().catch(() => undefined);
    audio.onended = () => setPreviewing((p) => (p === r.id ? null : p));
  };

  const loadIntoInstrument = async (r: FreesoundResult) => {
    if (pitchInstrument === 'drums') {
      setError('Drum samples are not supported yet — switch the pitched track to synth/guitar/bass/vocal.');
      return;
    }
    setLoadState('loading');
    try {
      await engine.loadSamples(pitchInstrument, { C4: r.previews['preview-hq-mp3'] });
      setLoadState('loaded');
    } catch (e) {
      setLoadState('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const clearLoaded = () => {
    if (pitchInstrument === 'drums') return;
    engine.clearSamples(pitchInstrument);
    setLoadState('idle');
  };

  return (
    <section className="card">
      <header className="card-header">
        <h2>Free Sample Browser · Freesound</h2>
        <span className="muted small">CC-licensed sounds · attribute the author when you publish</span>
      </header>

      <details className="settings">
        <summary>API token</summary>
        <p className="small muted">
          Sign in at freesound.org, visit <code>/apiv2/apply/</code> to create an application, copy the API key, and paste it here. Stored locally in your browser only.
        </p>
        <input
          type="password"
          placeholder="Freesound API token"
          value={token}
          onChange={(e) => saveToken(e.target.value)}
          style={{ width: '100%' }}
        />
      </details>

      <div className="row gap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search query"
          style={{ flex: 1 }}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        />
        <button className="btn primary" onClick={onSearch} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <div className="error small">{error}</div>}

      {loadState === 'loaded' && pitchInstrument !== 'drums' && (
        <div className="row gap small">
          <span className="dot ok" />
          <span>Sample loaded into <b>{pitchInstrument}</b> — pitched across the keyboard from C4.</span>
          <button className="btn small" onClick={clearLoaded}>Reset to default</button>
        </div>
      )}

      <ul className="sample-list">
        {results.map((r) => (
          <li key={r.id}>
            <div className="sample-meta">
              <a href={r.url} target="_blank" rel="noreferrer"><b>{r.name}</b></a>
              <span className="muted small"> · {r.username} · {r.duration.toFixed(2)}s · {r.license.split('/').slice(-2, -1)[0] || 'CC'}</span>
            </div>
            <div className="row gap">
              <button className="btn small" onClick={() => preview(r)} disabled={previewing === r.id}>
                {previewing === r.id ? 'Playing…' : 'Preview'}
              </button>
              <button className="btn small primary" onClick={() => loadIntoInstrument(r)}>
                Load into {pitchInstrument}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
