# Friends & Family SAFE – Invite Pass

The **Friends & Family SAFE Offering** section on `index.html` is gated by an invite pass. The pass is **not** hard-coded: it is read from environment and only a **SHA-256 hash** is embedded at build time.

## Setup

1. In the `investor` folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Set your secret pass in `.env`:
   ```
   INVESTOR_INVITE_PASS=your_secret_invite_pass
   ```

3. Run the build script to generate the hash and write `assets/js/invite-config.js`:
   ```bash
   # From repo root
   node investor/scripts/inject-invite-pass.js

   # Or from investor folder
   cd investor && node scripts/inject-invite-pass.js
   ```

4. Deploy or serve the `investor` folder as usual. Share the pass only with invited friends & family.

If `INVESTOR_INVITE_PASS` is not set, the page still loads: the gated section shows a **configuration error** message instead of the SAFE content. Check the browser console for a warning.
