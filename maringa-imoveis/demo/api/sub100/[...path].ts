export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const incoming = new URL(request.url);
  const suffix = incoming.pathname.replace(/^\/api\/sub100\/?/, '');
  const target = new URL(`https://beta-api.sub100.com.br/api/${suffix}`);

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
      'Cache-Control': 'public, max-age=60',
    },
  });
}
