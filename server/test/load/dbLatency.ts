import net from 'node:net'
import type { AddressInfo } from 'node:net'

/**
 * A TCP relay that delays every byte in both directions, standing in for the
 * network between the pod and Cloud SQL (story 3-H).
 *
 * Against a loopback Postgres a session `SELECT` costs ~0.2 ms, so a pool of
 * *one* connection sustains thousands of requests per second and pool size is
 * never the constraint — a fact about the laptop, not the deployment.
 *
 * Delaying at the socket rather than around the query is what makes it
 * faithful: the pooled connection stays checked out for the whole round trip,
 * so pool occupancy is real and `pgStore` and `@fastify/postgres` are unmodified.
 *
 * `delayMs` is one-way, so a query pays twice it.
 */
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
    // A relay that threw on a peer's reset would take the run down with it.
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
