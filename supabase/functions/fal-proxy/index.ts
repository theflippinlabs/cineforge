/**
 * fal.ai Proxy — Supabase Edge Function
 *
 * Forwards requests from the frontend to fal.ai, injecting the FAL_KEY
 * server-side so it is never exposed to the browser.
 *
 * Deploy:
 *   supabase functions deploy fal-proxy
 *
 * Set secret:
 *   supabase secrets set FAL_KEY=your_fal_key_here
 */

const FAL_API_BASE = 'https://queue.fal.run';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fal-target-url',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const falKey = Deno.env.get('FAL_KEY');
  if (!falKey) {
    return new Response(
      JSON.stringify({ error: 'FAL_KEY not configured on server' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // The @fal-ai/client sets x-fal-target-url to the actual fal endpoint
  const targetUrl = req.headers.get('x-fal-target-url');
  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing x-fal-target-url header' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Forward request to fal.ai with server-side API key
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set('Authorization', `Key ${falKey}`);
  forwardedHeaders.delete('x-fal-target-url'); // fal.ai doesn't expect this

  try {
    const falResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const responseHeaders = new Headers(falResponse.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => responseHeaders.set(k, v));

    return new Response(falResponse.body, {
      status: falResponse.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy request failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
