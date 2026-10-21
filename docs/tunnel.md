# Bringing in claude.ai

claude.ai reaches MCP servers from the internet, so it can't see `localhost`. A
`cloudflared` quick tunnel gives your local server a public HTTPS address for as long as
the tunnel runs. No Cloudflare account needed.

Your own Claude can help with any of these steps. If you have your own VPS or web server,
you can deploy the server there instead. Can't run a tunnel at all? See
[STUCK.md](../STUCK.md) for other ways in.

## 1. Install cloudflared

- macOS: `brew install cloudflared`
- Windows: `winget install --id Cloudflare.cloudflared`
- Linux: a package from Cloudflare's downloads page or its apt/yum repository

Check it with `cloudflared --version`.

## 2. Open the tunnel

With the server running (`npm start`), in another terminal:

```sh
cloudflared tunnel --url http://localhost:3001
```

It prints an address like `https://some-random-words.trycloudflare.com`. Keep this
terminal open: the tunnel lasts as long as the command does.

## 3. Tell the server its public name

Restart the server with the tunnel's hostname, without `https://`:

```sh
PUBLIC_HOST=some-random-words.trycloudflare.com npm start
```

On Windows PowerShell: `$env:PUBLIC_HOST="some-random-words.trycloudflare.com"; npm start`.

Why: the MCP SDK protects local servers from DNS rebinding by checking the `Host` header.
Requests that arrive through the tunnel carry the tunnel's hostname, and the server
answers them with a 403 until you allow that name.

## 4. Add the connector

In claude.ai's settings, under Connectors, add a custom connector with the URL
`https://some-random-words.trycloudflare.com/mcp`. Then, in a new chat, enable it and ask
"Show me my board."

## 5. Stop it when you're done

Press Ctrl+C on `cloudflared`. **The tunnel is public and the server has no
authentication**, so don't leave it running. You can also remove the connector.

A quick tunnel gets a new address each time, so you'll update the connector's URL and
`PUBLIC_HOST` on each run. A named tunnel keeps its address but needs a Cloudflare
account.
