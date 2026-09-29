// Capture the real local application using Chrome's DevTools protocol.
// Requires Node 22+ and Chrome/Edge. Run from the repository root.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createDemoAccounts, DEMO_PASSWORD } = require('../backend/scripts/create-demo-accounts.js')
const base = 'http://localhost:5173'
const output = new URL('./screenshots/', import.meta.url)
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = await mkdtemp(path.join(tmpdir(), 'tesla-docs-'))
const port = 9226
let browser
let socket
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let sequence = 0
const pending = new Map()
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)) }, 15000)
    pending.set(id, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
async function waitFor(text) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`)) return
    await pause(200)
  }
  throw new Error(`Page did not show: ${text}`)
}
async function visit(route, text) {
  await send('Page.navigate', { url: base + route })
  await waitFor(text)
  await pause(500)
}
async function capture(name) {
  await evaluate('document.fonts.ready.then(() => true)')
  const { cssContentSize } = await send('Page.getLayoutMetrics')
  const { data } = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 1440, height: Math.ceil(cssContentSize.height), scale: 1 },
  })
  await writeFile(new URL(name, output), Buffer.from(data, 'base64'))
  console.log(`Captured ${name}`)
}
async function api(route, method = 'GET', body, token) {
  const response = await fetch(`${base}/api${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`${route}: ${result.message}`)
  return result.data
}
async function signIn(email, route, text) {
  await send('Network.clearBrowserCookies')
  await visit('/login', 'Your next ride awaits.')
  const status = await evaluate(`fetch('/api/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email:${JSON.stringify(email)},password:${JSON.stringify(DEMO_PASSWORD)}})
  }).then(r => r.status)`)
  if (status !== 200) throw new Error(`Demo login failed: ${status}`)
  await visit(route, text)
}

try {
  await mkdir(output, { recursive: true })
  await createDemoAccounts()
  browser = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' })
  browser.on('error', (error) => console.error(error.message))
  let targets
  for (let attempt = 0; attempt < 60; attempt++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break } catch { await pause(250) }
  }
  if (!targets) throw new Error('Could not connect to Chrome')
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    const handler = pending.get(message.id)
    if (!handler) return
    pending.delete(message.id)
    clearTimeout(handler.timeout)
    if (message.error) handler.reject(new Error(message.error.message))
    else handler.resolve(message.result)
  }
  await send('Page.enable')
  await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await visit('/', 'Share')
  await capture('01-home.png')

  const locations = await api('/location')
  const id = (name) => locations.find((location) => location.name === name).id
  const login = async (email) => (await api('/auth/login', 'POST', { email, password: DEMO_PASSWORD })).accessToken
  const driver = await login('driver@example.test')
  const first = await login('passenger1@example.test')
  const second = await login('passenger2@example.test')
  try { await api('/vehicle/me', 'GET', undefined, driver) } catch {
    await api('/vehicle', 'POST', { model: 'Bullet · Tesla Model 3', capacity: 4, currentLocationId: id('Banani') }, driver)
  }
  await api('/vehicle/status', 'PATCH', { status: 'ONLINE' }, driver)
  await api('/driver-routes', 'POST', { currentLocationId: id('Banani'), destinationLocationId: id('Gulshan') }, driver)
  await signIn('driver@example.test', '/tesla', 'Where are you heading?')
  await waitFor('Gulshan')
  await capture('02-driver-route.png')

  await signIn('passenger1@example.test', '/request', 'Where are we heading?')
  await evaluate(`(() => {
    const selects = document.querySelectorAll('select');
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    [${id('Banani')},${id('Mohakhali')}].forEach((value,i) => {
      setter.call(selects[i], String(value)); selects[i].dispatchEvent(new Event('change',{bubbles:true}));
    });
  })()`)
  await pause(300)
  await capture('03-request-ride.png')
  const ride = await api('/rides', 'POST', { pickupLocationId: id('Banani'), destinationLocationId: id('Mohakhali'), seatsRequested: 1 }, first)
  await signIn('driver@example.test', '/requests', 'Find your next shared journey.')
  await evaluate(`(() => {
    const input=document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Passenger One');
    input.dispatchEvent(new Event('input',{bubbles:true}));
  })()`)
  await waitFor('Change route and accept')
  await pause(300)
  await capture('04-change-route.png')
  const accepted = await api(`/matching/${ride.id}/accept`, 'POST', { changeRoute: true }, driver)
  const secondRide = await api('/rides', 'POST', { pickupLocationId: id('Gulshan'), destinationLocationId: id('Mohakhali'), seatsRequested: 1 }, second)
  await api(`/matching/${secondRide.id}/accept`, 'POST', {}, driver)
  await visit('/active-trip', 'Your trip route')
  await waitFor('Passenger Two')
  await capture('05-active-trip.png')
  await signIn('passenger1@example.test', `/my-rides/${ride.id}`, 'Your shared trip route')
  await capture('06-passenger-trip.png')

  for (const action of ['arrive', 'start', 'complete']) {
    await api(`/trips/${accepted.assignment.pool.id}/${action}`, 'PATCH', {}, driver)
  }
  await api('/vehicle/status', 'PATCH', { status: 'OFFLINE' }, driver)
  console.log('Demo trip completed and demo driver offline; accounts remain available for README walkthroughs.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: ++sequence, method: 'Browser.close' }))
    socket.close()
  }
  if (browser) browser.kill()
  // The isolated profile stays in the OS temp directory, outside the repository.
}
