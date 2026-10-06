# voxe_partner

Voxe investor portal and Friends & Family EOI site.

## Run locally

```bash
npm install
npm start
```

The site is served at `http://localhost:3333`. Set `PORT` in the environment to use a different port.

## Invite passes

Copy `.env.example` to `.env`, set the invite passwords, and run:

```bash
node scripts/inject-invite-pass.js
```

Required environment variables:

- `INVESTOR_INVITE_PASS` — Friends & Family / investor gated pages
- `GROWTH_PARTNER_INVITE_PASS` — Growth Partner Program gated pages (separate; no fallback)

Never commit `.env` or raw credentials. See `README-invite-pass.md`.
