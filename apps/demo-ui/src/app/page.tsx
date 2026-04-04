'use client';

import { ChatCreateBodySchema, type ChatRecord } from '@ai-chat/contracts';
import { useCallback, useState } from 'react';

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function HomePage() {
  const [userId, setUserId] = useState('demo-user');
  const [prompt, setPrompt] = useState('Say hello in one sentence.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<ChatRecord | null>(null);

  const submit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const body = ChatCreateBodySchema.parse({ userId, prompt });
      const res = await fetch(`${apiBase()}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ChatRecord;
      setRecord(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [userId, prompt]);

  return (
    <main>
      <h1>AI Chat Demo</h1>
      <p className="sub">
        Posts to <code>{apiBase()}/v1/chat</code> — set{' '}
        <code>NEXT_PUBLIC_API_URL</code> for other hosts.
      </p>

      <div className="card">
        <div className="row">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="row">
          <label htmlFor="prompt">Prompt</label>
          <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <button type="button" onClick={() => void submit()} disabled={loading}>
          {loading ? 'Sending…' : 'Send'}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {record ? (
        <div className="card" data-testid="result">
          <div className="reply">{record.reply}</div>
          <div className="meta">
            id: {record.id} · provider: {record.provider}
            {record.model ? ` · model: ${record.model}` : ''}
          </div>
        </div>
      ) : null}
    </main>
  );
}
