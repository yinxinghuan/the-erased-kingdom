/**
 * Minimal AlterU deployment adapter.
 *
 * The deploy package wraps this named API handler with the compiled `dist/`
 * static files. Game saves, player profiles and generated media continue to
 * use the platform runtime adapters in `src/shared/`; this worker deliberately
 * owns no second persistence layer.
 */
export async function handleApi(request) {
  const url = new URL(request.url)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    return Response.json({
      ok: true,
      game: 'the-erased-kingdom',
      campaign: 'complete',
    })
  }

  return new Response('Not Found', { status: 404 })
}
