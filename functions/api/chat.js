
export async function onRequestPost() {
  return new Response(
    JSON.stringify({ text: '✅ Backend alcançado com sucesso' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
