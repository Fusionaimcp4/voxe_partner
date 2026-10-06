# voxe_partner

Voxe investor portal and Friends & Family EOI site.

## Run locally

```bash
npm install
npm start
```

The site is served at `http://localhost:3333`. Set `PORT` in the environment to use a different port.

## Invite pass

Copy `.env.example` to `.env`, set `INVESTOR_INVITE_PASS`, and run:

```bash
node scripts/inject-invite-pass.js
```

Never commit `.env` or raw credentials.
