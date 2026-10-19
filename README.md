# Orchid Stay — static website

A static, no-build hotel website (HTML + CSS + vanilla JS) for **Orchid Stay**, 20 & 21 Avinashi Road, opposite KMCH Hospital, Coimbatore 641014.

Pages: `index.html` · `rooms.html` · `explore.html` — booking happens via a WhatsApp enquiry popup (no server needed).

---

## 1. Push to GitHub (2 minutes)

In this folder, run:

```bash
git init -b main
git add .
git commit -m "Orchid Stay — first launch"
git remote add origin https://github.com/<YOUR-USERNAME>/orchid-stay.git
git push -u origin main
```

(Create the empty repo at **github.com/new** first — name it `orchid-stay`, Public, no README.)

## 2. Put it online FREE with GitHub Pages

1. On your repo page: **Settings → Pages**
2. Under "Build and deployment": Source = **Deploy from a branch**, Branch = **main**, Folder = **/(root)** → Save
3. Wait ~2 minutes. Your site is live at:

   `https://<YOUR-USERNAME>.github.io/orchid-stay/`

That's it — free hosting, HTTPS included, unlimited bandwidth for a site like this.

## 3. Real domain (later, optional — recommended)

The site's SEO files currently point to `https://orchidstay.in/` (available to register, ~₹500–800/yr):

1. Buy `orchidstay.in` (GoDaddy / Hostinger / Namecheap).
2. In the repo add a file named exactly `CNAME` containing one line: `orchidstay.in`
3. In DNS: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` + CNAME `www → <username>.github.io`
4. GitHub: **Settings → Pages → Custom domain** = `orchidstay.in`, then enable **Enforce HTTPS**.
5.-domain assets refresh automatically — the canonical/OG/sitemap URLs are already `orchidstay.in`.

If you stay on the free `github.io` URL for a while, replace `https://orchidstay.in` with `https://<user>.github.io/orchid-stay` in the 4 places (index/rooms/explore heads + sitemap.xml + robots.txt).

## 4. Free SEO / Google setup checklist

- [ ] **Google Search Console** (search.google.com/search-console): add property → verify via DNS → submit `https://your-domain/sitemap.xml` → request indexing of all 3 pages.
- [ ] **Google Business Profile** (business.google.com) — this powers Google Maps results, reviews and the local pack:
  - Claim "Orchid Stay" at 20 & 21 Avinashi Road, Coimbatore 641014.
  - Name, address, phone **exactly as on the site**: +91 72000 28882.
  - Category: "Budget hotel" (or "Hotel").
  - Add the same room photos from this site + the listing link → your website URL.
  - Add attributes: free WiFi, AC, parking, 24×7 reception, couples welcome.

- [x] Already built in: LocalBusiness/Hotel + FAQPage + BreadcrumbList JSON-LD, geo meta, Open Graph cards, robots.txt + sitemap.xml, alt text, mobile-first layout, phone/WhatsApp click-to-action.
- [ ] After 2–3 weeks of visits: check Search Console → Performance, and Google Business → Insights.

## 5. Local preview

```bash
python -m http.server 4173
# → http://127.0.0.1:4173
```

## Notes

- Booking = WhatsApp enquiry only (+91 72000 28882). No payment is taken online.
- Rates shown (Deluxe ₹1,199 / Family ₹1,699) are indicative — confirm seasonally on WhatsApp.
- Some gallery photos are representative (Pexels); the actual-property shots are real listing photos. The owner can export originals from their Google Business Profile → Photos and swap files in `assets/img/` (keep same filenames for zero code change).
