export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL('https://beta-api.sub100.com.br/api/properties');

  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const upstream = await fetch(target.toString(), {
    headers: {
      Accept: 'application/json',
      Origin: 'https://sub100.com.br',
      Referer: 'https://sub100.com.br/',
    },
  });

  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
