# Investor portal – server & form

## Running the site with form submission

To use the **Friends & Family Expression of Interest** form (and save submissions to JSON), run the small Node server from the `investor` folder:

```bash
cd investor
npm install
npm start
```

Then open **http://localhost:3333** (or the port in `PORT` env). The same origin will allow the form to POST to `/api/friends-family-interest`.

- Static files (index.html, assets/, docs/) are served from this directory.
- Submissions are appended to **data/friends_family_investors.json**.

## JSON submissions spec

**Endpoint:** `POST /api/friends-family-interest`  
**Body:** JSON with the form fields.

**Stored file:** `investor/data/friends_family_investors.json` — array of objects:

```json
[
  {
    "id": "1730210400000-abc12xyz",
    "full_name": "…",
    "email": "…",
    "phone": "…",
    "location": "…",
    "amount_usd": 2500,
    "notes": "…",
    "submitted_at": "2026-02-28T17:00:00.000Z"
  }
]
```

- **id:** generated (timestamp + short random string).
- **submitted_at:** ISO 8601 UTC.
- Optional fields may be omitted if empty.

**Security:** Do not commit `data/friends_family_investors.json`; it contains PII. Add it to `.gitignore` if the repo tracks the investor folder.

## PHP hosting (e.g. SiteGround)

On static/PHP hosting (e.g. [investor.voxe.us](https://investor.voxe.us/)), the form posts to **api/friends-family-interest.php**. No Node server is needed.

1. Upload the whole `investor` folder (including **api/** and **data/**) to your host.
2. Ensure **data/** is writable by the web server (e.g. chmod 755 or 775 on `data`). The PHP script will create **data/friends_family_investors.json** on first submission.
3. **data/.htaccess** denies direct web access to the JSON file (recommended).

If you still get “We couldn’t send your submission”, check: (a) **api/friends-family-interest.php** is present and reachable at `https://your-domain/api/friends-family-interest.php`, (b) **data/** exists and is writable, (c) the server allows PHP and has no firewall blocking the request.

## Static-only (no server)

If you open `index.html` via the file system or another static host and do not use the PHP script, the form will render but submit will fail (no backend). Use the Node server, the PHP endpoint above, or another backend that implements this API.
