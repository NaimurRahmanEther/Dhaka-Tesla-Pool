// An HTTP 200 alone is not confirmation: an incorrectly routed API request
// can return the SPA's index.html instead of creating an account.
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
