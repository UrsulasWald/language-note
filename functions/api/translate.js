// Cloudflare Pages Functions 版
// 配置場所: functions/api/translate.js  → エンドポイントは /api/translate（Vercel時と同じ）

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequest(context) {
  const { request } = context;

  // CORS プリフライト
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { text, target_lang, source_lang, api_key } = body;

  if (!text || !target_lang) {
    return json({ error: 'text and target_lang are required' }, 400);
  }

  // ユーザーが送ってきたAPIキーを使う（環境変数は使わない）
  const apiKey = api_key;
  if (!apiKey) {
    return json(
      { error: 'API key is required. Please set your DeepL API key in the app settings.' },
      403
    );
  }

  const isFree = apiKey.endsWith(':fx');
  const baseUrl = isFree
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  try {
    const params = new URLSearchParams({ text, target_lang });
    if (source_lang) params.append('source_lang', source_lang);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return json({ error: data.message || 'DeepL error' }, response.status);
    }
    return json(data, 200);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
