# Invite Passes

Protected portal sections are gated by invite passes. Passwords are **not** hard-coded: they are read from environment and only a **SHA-256 hash** is embedded at build time.

| Program | Environment variable | Client hash global | localStorage scope |
|---------|----------------------|--------------------|--------------------|
| Friends & Family / investor | `INVESTOR_INVITE_PASS` | `window.__INVITE_PASS_HASH__` | `friends_family_access` |
| Growth Partner Program | `GROWTH_PARTNER_INVITE_PASS` | `window.__GROWTH_PARTNER_INVITE_PASS_HASH__` | `growth_partner_program_access` |

These credentials are independent. Admin login uses a separate `ADMIN_PASS` and is not tied to either invite pass.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Set secrets in `.env` (do not commit `.env`):
   ```
   INVESTOR_INVITE_PASS=your_investor_invite_pass
   GROWTH_PARTNER_INVITE_PASS=your_growth_partner_invite_pass
   ```

3. Run the build script to write hash-only client configs:
   ```bash
   node scripts/inject-invite-pass.js
   ```

   This updates:
   - `assets/js/invite-config.js` (investor)
   - `assets/js/growth-partner-invite-config.js` (Growth Partner)

4. Deploy or serve the site. Share each pass only with the intended invitees.

## Fail closed

- If `INVESTOR_INVITE_PASS` is missing/empty, investor gated pages show a configuration error.
- If `GROWTH_PARTNER_INVITE_PASS` is missing/empty, Growth Partner gated pages show a configuration error and do **not** fall back to `INVESTOR_INVITE_PASS`.
