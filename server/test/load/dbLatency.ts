import net from 'node:net'
import type { AddressInfo } from 'node:net'

/** Delays traffic in both directions; `delayMs` is one-way latency. */
export interface DelayedRelay {
  port: number
  close: () => Promise<void>
}

export async function startDelayedRelay(
  target: { host: string, port: number },
  delayMs: number,
): Promise<DelayedRelay> {
  const sockets = new Set<net.Socket>()

  // Equal timeouts fire in the order scheduled, so chunks stay in order.
  const forward = (from: net.Socket, to: net.Socket): void => {
    from.on('data', (chunk: Buffer) => {
      setTimeout(() => {
        if (!to.destroyed) to.write(chunk)
      }, delayMs)
    })
    from.on('close', () => {
      setTimeout(() => to.destroy(), delayMs)
    })
    from.on('error', () => from.destroy())
  }

  const server = net.createServer((client) => {
    const upstream = net.connect(target.port, target.host)
    upstream.setNoDelay(true)
    client.setNoDelay(true)
    sockets.add(client).add(upstream)
    client.on('close', () => sockets.delete(client))
    upstream.on('close', () => sockets.delete(upstream))
    forward(client, upstream)
    forward(upstream, client)
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  return {
    port: (server.address() as AddressInfo).port,
    close: () => new Promise<void>((resolve, reject) => {
      for (const socket of sockets) socket.destroy()
      server.close(err => err ? reject(err) : resolve())
    }),
  }
}
