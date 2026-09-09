export default {
  async fetch(request) {
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

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};
