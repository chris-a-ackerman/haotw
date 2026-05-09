// generate-certificate — Edge Function. Proxies the Anthropic Messages API
// so the API key stays server-side, applies the same markdown-strip pipeline
// the prototype used to run client-side, and returns { text } (or empty
// string on any failure so the client can fall back to MOCK_CERTIFICATE).
//
// Deploy:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy generate-certificate
//
// Invoke (from the browser, via supabase-js):
//   await supabase.functions.invoke('generate-certificate', { body: { prompt } })
//
// The Anthropic model defaults to Haiku 4.5 (cheap + fast — the certificate
// language is 2–4 sentences). Override via the ANTHROPIC_MODEL secret.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripMarkdown = (text: string) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, '$1$2')
    .replace(/(^|\s)_(\S(?:.*?\S)?)_(?=\s|$)/g, '$1$2')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ text: '', error: 'ANTHROPIC_API_KEY is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { prompt } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ text: '', error: 'Missing prompt.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const errBody = await upstream.text();
      console.error('anthropic error', upstream.status, errBody);
      // Return 200 with empty text so the client falls back gracefully
      return new Response(
        JSON.stringify({ text: '', error: `Anthropic returned ${upstream.status}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await upstream.json();
    const raw = data?.content?.[0]?.text ?? '';
    const text = stripMarkdown(raw);

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('generate-certificate threw', e);
    return new Response(
      JSON.stringify({ text: '', error: 'Internal error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
