// Reject SPA HTML or malformed payloads even when HTTP status is 200.
export async function readApiPayload(response) {
  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (
    response.ok &&
    (payload?.success !== true || !Object.hasOwn(payload, 'data'))
  ) {
    const error = new Error(
      'The server did not confirm this request. Refresh the page and try again.',
    )
    error.code = 'INVALID_API_RESPONSE'
    throw error
  }

  return payload
}
