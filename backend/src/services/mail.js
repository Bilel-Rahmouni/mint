import net from 'node:net'
import tls from 'node:tls'
import { config } from '../config.js'

const TIMEOUT_MS = 15_000

export function mailEnabled() {
  const { host, user, pass, from } = config.smtp
  return Boolean(host && user && pass && from)
}

function wait(socket, event) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      socket.off(event, onReady)
      reject(err)
    }
    const onReady = () => {
      socket.off('error', onError)
      resolve()
    }
    socket.once(event, onReady)
    socket.once('error', onError)
  })
}

function readReply(socket) {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const onData = (chunk) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const last = lines.at(-1) || ''
      if (!/^\d{3} /.test(last)) return
      cleanup()
      const code = Number(last.slice(0, 3))
      if (code >= 400) reject(new Error(last))
      else resolve(buffer)
    }
    const onError = (err) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }
    socket.on('data', onData)
    socket.on('error', onError)
  })
}

function sendLine(socket, line) {
  socket.write(`${line}\r\n`)
  return readReply(socket)
}

function envelopeAddress(from) {
  const match = String(from).match(/<([^>]+)>/)
  return (match ? match[1] : from).trim()
}

function headerValue(value) {
  const single = String(value).replace(/[\r\n]+/g, ' ').trim()
  return /^[\x20-\x7E]*$/.test(single) ? single : `=?UTF-8?B?${Buffer.from(single).toString('base64')}?=`
}

async function openSocket() {
  const { host, port } = config.smtp
  if (port === 465) {
    const socket = tls.connect({ host, port, servername: host })
    socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error('SMTP timeout')))
    await wait(socket, 'secureConnect')
    await readReply(socket)
    await sendLine(socket, 'EHLO mintstudio.io')
    return socket
  }

  const plain = net.connect({ host, port })
  plain.setTimeout(TIMEOUT_MS, () => plain.destroy(new Error('SMTP timeout')))
  await wait(plain, 'connect')
  await readReply(plain)
  const hello = await sendLine(plain, 'EHLO mintstudio.io')
  if (!/STARTTLS/i.test(hello)) return plain

  await sendLine(plain, 'STARTTLS')
  const socket = tls.connect({ socket: plain, servername: host })
  socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error('SMTP timeout')))
  await wait(socket, 'secureConnect')
  await sendLine(socket, 'EHLO mintstudio.io')
  return socket
}

export async function sendMail({ to, subject, text }) {
  const socket = await openSocket()
  try {
    const { user, pass, from } = config.smtp
    await sendLine(socket, 'AUTH LOGIN')
    await sendLine(socket, Buffer.from(user).toString('base64'))
    await sendLine(socket, Buffer.from(pass).toString('base64'))
    await sendLine(socket, `MAIL FROM:<${envelopeAddress(from)}>`)
    await sendLine(socket, `RCPT TO:<${envelopeAddress(to)}>`)
    await sendLine(socket, 'DATA')
    const body = [
      `From: ${headerValue(from)}`,
      `To: ${headerValue(to)}`,
      `Subject: ${headerValue(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      String(text).replace(/^\./gm, '..'),
    ].join('\r\n')
    socket.write(`${body}\r\n.\r\n`)
    await readReply(socket)
    await sendLine(socket, 'QUIT').catch(() => {})
  } finally {
    socket.end()
  }
}
