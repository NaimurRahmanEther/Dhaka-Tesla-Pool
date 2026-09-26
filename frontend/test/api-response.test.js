import assert from 'node:assert/strict'
import test from 'node:test'
import { readApiPayload } from '../src/api/response.js'

test('registration cannot report success when the server returns the SPA HTML', async () => {
  const response = new Response('<!doctype html><div id="root"></div>', {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
  await assert.rejects(readApiPayload(response), { code: 'INVALID_API_RESPONSE' })
})

test('a confirmed registration returns its saved account', async () => {
  const payload = { success: true, data: { id: 42, email: 'nusrat@example.test' } }
  assert.deepEqual(await readApiPayload(Response.json(payload, { status: 201 })), payload)
})

test('incomplete or unsuccessful responses cannot become false successes', async () => {
  for (const payload of [null, {}, { success: true }, { success: false, data: null }]) {
    await assert.rejects(readApiPayload(Response.json(payload)), { code: 'INVALID_API_RESPONSE' })
  }
})

test('login errors retain the backend message', async () => {
  const payload = { success: false, message: 'Invalid email or password' }
  assert.deepEqual(await readApiPayload(Response.json(payload, { status: 401 })), payload)
})
