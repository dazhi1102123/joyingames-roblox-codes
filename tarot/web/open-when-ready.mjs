#!/usr/bin/env node
/** Open a browser once the port actually answers.
 *
 *     node open-when-ready.mjs <port> [path]
 *
 * Both launchers used to fire the browser and *then* start the server, so the
 * first load raced the boot and usually showed a connection error — which
 * reads as "it did not work" seconds before it does.
 *
 * Exits quietly if nothing is listening within the timeout: a browser that
 * fails to open is not a reason to fail the run.
 */

import { exec } from "node:child_process"
import net from "node:net"

const port = Number(process.argv[2] ?? 3000)
const path = process.argv[3] ?? "/"
const url = `http://localhost:${port}${path}`
const deadline = Date.now() + 90_000

const listening = () =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" })
    const done = (ok) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(500)
    socket.once("connect", () => done(true))
    socket.once("error", () => done(false))
    socket.once("timeout", () => done(false))
  })

function open() {
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`
  exec(command, () => {})
}

while (Date.now() < deadline) {
  if (await listening()) {
    open()
    process.exit(0)
  }
  await new Promise((r) => setTimeout(r, 400))
}
process.exit(0)
