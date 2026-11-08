# Pre-publication checklist (investor and partner portal)

Internal. Not served by the site. Items below must be closed before the portal is shared publicly.

## Contact mailboxes (not verified)

These addresses are intended, but none is marked verified. Confirm each mailbox or forwarding rule before publishing.

- `support@voxedesk.com`: customer support. Appears in the footers and contact pages.
- `investors@voxedesk.com`: investor communications. Appears on the contact page and the SAFE page.
- `partnerships@voxedesk.com`: business partnerships. Appears on the contact page and the SAFE page.

The domain has mail records (Google Workspace). That does not prove any individual mailbox exists.

## Domains

- `https://partners.voxe.us` is the official investor and partner portal. It resolved and returned HTTP 200 when checked.
- `https://investor.voxe.us` is not used anywhere in the published materials. It did not resolve when checked.
- `partners.voxedesk.com` is the affiliate and partner program. It is separate from the portal.

## Technical claims

| Claim in investor materials | Status from codebase review (read-only) |
|---|---|
| Two-factor authentication | Implemented: TOTP via `otplib` for user accounts, with admin security settings. Not verified: whether 2FA is enforced for every team member. Help-center wording about enforcement was removed. |
| Stripe subscription billing | Integration present: checkout, customer portal, and price IDs. Gated by `isStripeBillingEnabled()`. **Not verified:** whether billing is enabled in production. Confirm the production environment setting. |
| Plan usage limits enforced in the application | Present in `lib/billing/check-access.ts`. Stripe usage metering was not found and has been removed from the wording. |
| Containerized deployment | Supported: `Dockerfile.prod`, `docker-compose.prod.yml`, and the image-based production deploy workflow. |
| Chatwoot | Used as the underlying helpdesk inbox and bot (inbox and bot IDs in the admin code). Described as "VoxeDesk helpdesk (built on Chatwoot)." |
| Live channels | Per the product's channel setup screen: website chat, email, SMS, WhatsApp, Telegram, Line, and API. Voice is marked coming soon; Facebook and Instagram are not offered. Investor materials list these as live. |
| Support for Shopify, WooCommerce, HubSpot, Salesforce, Pipedrive, Google Calendar | Listed on the public pricing page as plan features. Verify the integrations in production. |

## Financial and market claims

- **$30B+ market figure:** removed from all investor materials. No source has been provided. Restore only with a cited source that defines the market measured.
- **"Large and growing," "fast-growing," "millions of SMBs," "millions of potential customers":** unsourced qualitative or quantitative statements. Remain in the pitch deck, prospectus, business plan, and growth model. Source or remove before publishing.
- **$50M+ ARR statement:** reframed as a hypothetical scenario. Year 5 assumptions: 40,000 customers at about $120 per month blended ARPU, giving about $57.6M ARR. Not a forecast and not current revenue.
- **ARR chart bars:** not proportional to the values shown (for example, the Year 2 bar is drawn at 18% of the Year 5 bar, while the values differ by a factor of 40). Still to be corrected in the prospectus and growth model.
- **Pricing:** the prospectus table lists paid plans only and is labeled as monthly list prices from the public pricing page (checked 2026-11-07). Production pricing configuration has not been checked. The Free plan is not on the public pricing page and has been removed.

## Legal representations

- Legal entity wording in the SAFE and growth-partner documents is unchanged: Blockchain Technology International LLC, doing business as Voxe Desk.
- Changes that affect representations: the removal of the $30B figure, the reframing of the $50M figure, the channel counts (now 7 live, per the product screen), and the change from "usage metering" to "usage limits enforced in the application." Review these with the counsel review already planned.

## Certificates

- Tier 1 "Self-hosted" wording removed, because self-hosted deployment is listed for Enterprise only on the public pricing page.
- Certificate tiers, eligibility, and benefits are unchanged.
