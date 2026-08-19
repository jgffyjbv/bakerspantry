/* The Baker's Pantry — API worker (KV-backed shop + admin) */

import { EmailMessage } from "cloudflare:email";

const CATS = [
  { key: "cheesecakes", name: "10″ Cheesecakes" },
  { key: "logs", name: "Cheesecake Logs" },
  { key: "babkas", name: "Cream-Topped Babkas" },
  { key: "tarts", name: "Cheese Tarts" },
  { key: "dozen", name: "Treats by the Dozen" },
  { key: "s-cakes", name: "Sukkos Collection · Cakes" },
  { key: "s-logs", name: "Sukkos Collection · Chocolate Logs" },
  { key: "s-ices", name: "Sukkos Collection · Ices" },
  { key: "s-mini", name: "Sukkos Collection · Miniatures" },
  { key: "s-cookies", name: "Sukkos Collection · Cookies" },
  { key: "platters", name: "Assorted Combo Platters" }
];

/* Occasion / dietary tags. Seeded once into KV ("occasions") — after that the
   admin's list is the source of truth and he can add, rename or remove freely. */
const DEFAULT_OCCASIONS = [
  { key: "birthday", name: "Birthday" },
  { key: "bar-mitzvah", name: "Bar Mitzvah" },
  { key: "upsherin", name: "Upsherin" },
  { key: "purim", name: "Purim" },
  { key: "sukkos", name: "Sukkos" },
  { key: "special-occasion", name: "Special Occasion" },
  { key: "milchig", name: "Milchig" },
  { key: "pareve", name: "Pareve" }
];

const SEED = [
  { slug: "vanilla-cheesecake", name: "Vanilla Cheesecake", cat: "cheesecakes", price: 85, per: "", img: "images/vanilla-cheesecake.jpg", trio: "Signature" },
  { slug: "marble-cheesecake", name: "Marble Cheesecake", cat: "cheesecakes", price: 85, per: "", img: "images/marble-cheesecake.jpg", fav: true },
  { slug: "oreo-cheesecake", name: "Cookies 'n' Cream Cheesecake", cat: "cheesecakes", price: 85, per: "", img: "images/oreo-cheesecake.jpg", fav: true },
  { slug: "strawberry-cheesecake", name: "Strawberry Cheesecake", cat: "cheesecakes", price: 85, per: "", img: "images/strawberry-cheesecake.jpg" },
  { slug: "strawberry-cheesecake-log", name: "Strawberry Log", cat: "logs", price: 95, per: "", img: "images/strawberry-cheesecake-log.jpg", fav: true },
  { slug: "oreo-cheesecake-log", name: "Cookies 'n' Cream Log", cat: "logs", price: 95, per: "", img: "images/oreo-cheesecake-log.jpg" },
  { slug: "marble-cheesecake-log", name: "Marble Log", cat: "logs", price: 95, per: "", img: "images/marble-cheesecake-log.jpg" },
  { slug: "vanilla-cheesecake-log", name: "Vanilla Log", cat: "logs", price: 95, per: "", img: "images/vanilla-cheesecake-log.jpg", trio: "Simcha Special" },
  { slug: "carrot-cheese-log", name: "Carrot 'n' Cheese Log", cat: "logs", price: 49, per: "", img: "images/carrot-cheese-log.jpg", fav: true },
  { slug: "nine-inch-cheesecake", name: "9″ Cheesecake", cat: "logs", price: 39, per: "12 pcs", img: "images/nine-inch-cheesecake.jpg" },
  { slug: "dairy-wafer-cake-log", name: "Dairy Wafer Cake Log", cat: "logs", price: 125, per: "", img: "images/wafer-cake-log.jpg" },
  { slug: "wafer-cake-slices", name: "Wafer Cake Slices", cat: "logs", price: 32, per: "12 pcs", img: "images/wafer-cake-slices.jpg" },
  { slug: "cheese-babka", name: "Cheese Babka", cat: "babkas", price: 85, per: "", img: "images/cheese-babka.jpg", trio: "Fan Favorite" },
  { slug: "cinnamon-cheese-babka", name: "Cinnamon Cheese Babka", cat: "babkas", price: 85, per: "", img: "images/cinnamon-cheese-babka.jpg" },
  { slug: "chocolate-cheese-babka", name: "Chocolate Cheese Babka", cat: "babkas", price: 85, per: "", img: "images/chocolate-cheese-babka.jpg", fav: true },
  { slug: "lotus-cheese-tart", name: "Lotus Cheese Tart", cat: "tarts", price: 79, per: "", img: "images/lotus-cheese-tart.jpg", fav: true },
  { slug: "caramel-cheese-tart", name: "Caramel Cheese Tart", cat: "tarts", price: 79, per: "", img: "images/caramel-cheese-tart.jpg" },
  { slug: "chocolate-cheese-tart", name: "Chocolate Cheese Tart", cat: "tarts", price: 79, per: "", img: "images/chocolate-cheese-tart.jpg" },
  { slug: "cheese-buns", name: "Cheese Buns", cat: "dozen", price: 36, per: "12 pcs", img: "images/cheese-buns.jpg" },
  { slug: "cheese-bars", name: "Cheese Bars", cat: "dozen", price: 21, per: "12 pcs", img: "images/cheese-bars.jpg" },
  { slug: "cheese-bites", name: "Cheese Bites", cat: "dozen", price: 30, per: "12 pcs", img: "images/cheese-bites.jpg", fav: true },
  { slug: "cheese-hearts", name: "Cheese Hearts", cat: "dozen", price: 51, per: "12 pcs", img: "images/cheese-hearts.jpg", fav: true },
  { slug: "cheese-cannolis", name: "Cheese Cannolis", cat: "dozen", price: 36, per: "12 pcs", img: "images/cheese-cannolis.jpg", fav: true },
  { slug: "cheese-florets", name: "Cheese Florets", cat: "dozen", price: 18, per: "12 pcs", img: "images/cheese-florets.jpg" },
  { slug: "cheese-balls", name: "Cheese Balls", cat: "dozen", price: 39, per: "12 pcs", img: "images/cheese-balls.jpg" },
  { slug: "melt-in-mouth-cookies", name: "Melt-in-Mouth Cookies", cat: "dozen", price: 39, per: "12 pcs", img: "images/melt-in-mouth-cookies.jpg", fav: true },
  { slug: "pecan-cheese-squares", name: "Pecan Cheese Squares", cat: "dozen", price: 32, per: "12 pcs", img: "images/pecan-cheese-squares.jpg" },
  { slug: "cheesecake-squares", name: "Cheesecake Squares", cat: "dozen", price: 32, per: "12 pcs", img: "images/cheesecake-square.jpg" },
  { slug: "mini-carrot-cheese-cakes", name: "Mini Carrot Cheese Cakes", cat: "dozen", price: 56, per: "12 pcs", img: "images/mini-carrot-cheese-cakes.jpg" },
  { slug: "large-carrot-muffins", name: "Large Carrot Muffins", cat: "dozen", price: 51, per: "12 pcs", img: "images/large-carrot-muffins.jpg" },
  { slug: "mini-carrot-muffins", name: "Mini Carrot Muffins", cat: "dozen", price: 39, per: "12 pcs", img: "images/mini-carrot-muffins.jpg" },
  { slug: "crumble-muffins", name: "Crumble Muffins", cat: "dozen", price: 51, per: "12 pcs", img: null },
  { slug: "strawberry-cheesecake-pops", name: "Strawberry Cheesecake Pops", cat: "dozen", price: 60, per: "12 pcs", img: null },
  { slug: "cheesecake-pops", name: "Cheesecake Pops", cat: "dozen", price: 51, per: "12 pcs", img: null },
  { slug: "chocolate-cheese-flower-balls", name: "Chocolate Cheese Flower Balls", cat: "dozen", price: 48, per: "12 pcs", img: null },
  { slug: "cheese-surprise-cookies", name: "Cheese Surprise Cookies", cat: "dozen", price: 36, per: "12 pcs", img: null },
  { slug: "cheese-donuts", name: "Cheese Donuts", cat: "dozen", price: 32, per: "12 pcs", img: null },
  { slug: "mini-jack-n-jill-stacks", name: "Mini Jack n' Jill Stacks", cat: "dozen", price: 45, per: "12 pcs", img: null },
  { slug: "butterfly-cookies", name: "Butterfly Cookies", cat: "dozen", price: 45, per: "12 pcs", img: null },
  { slug: "flower-cookies", name: "Flower Cookies", cat: "dozen", price: 45, per: "12 pcs", img: null },
  { slug: "cinnamon-sticks", name: "Cinnamon Sticks", cat: "dozen", price: 60, per: "12 pcs", img: null },
  { slug: "rectangle-combo", name: "Rectangle Assorted Combo", cat: "platters", price: 95, per: "", img: "images/rectangle-combo.jpg", desc: "A generous presentation box filled with an assortment of our most-loved petite cheese treats." },
  { slug: "oblong-combo", name: "Oblong Assorted Combo", cat: "platters", price: 135, per: "", img: "images/oblong-combo.jpg", desc: "Our grand oblong tray — an abundant, party-ready spread of assorted dairy delicacies." }
];

const J = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...extra } });

const slugify = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const usd = n => "$" + (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2));

async function getProducts(env) {
  let raw = await env.BP_KV.get("products");
  if (!raw) { await env.BP_KV.put("products", JSON.stringify(SEED)); return SEED; }
  return JSON.parse(raw);
}

async function getOccasions(env) {
  let raw = await env.BP_KV.get("occasions");
  if (!raw) { await env.BP_KV.put("occasions", JSON.stringify(DEFAULT_OCCASIONS)); return DEFAULT_OCCASIONS; }
  return JSON.parse(raw);
}

async function getPlanners(env) {
  return JSON.parse((await env.BP_KV.get("planners")) || "[]");
}

/* ---- session auth (HMAC cookie) ---- */
async function hmac(env, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function makeToken(env) {
  const exp = Date.now() + 7 * 864e5;
  return exp + "." + (await hmac(env, String(exp)));
}
async function isAuthed(req, env) {
  const m = (req.headers.get("cookie") || "").match(/bp_s=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return (await hmac(env, exp)) === sig;
}

/* ---- party-planner session (separate HMAC cookie, bp_p) ---- */
async function plannerFromRequest(req, env) {
  const m = (req.headers.get("cookie") || "").match(/bp_p=([^;]+)/);
  if (!m) return null;
  const [id, exp, sig] = m[1].split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now()) return null;
  if ((await hmac(env, "planner|" + id + "|" + exp)) !== sig) return null;
  const planners = await getPlanners(env);
  return planners.find(p => p.id === id) || null;
}

/* ============================================================
   Order notifications.

   Primary sender: Cloudflare Email Workers (SEND_EMAIL binding),
   from orders@bhwebs.com — a zone with Email Routing enabled.
   The recipient must be verified once as a Destination Address
   on the Cloudflare account; until then sends fail loudly with
   a hint rather than vanishing.

   FormSubmit is kept only as a last resort if the binding is
   missing: it answers 429 to every request from a Cloudflare
   Worker IP (verified 2026-08-18), so it only really works when
   the BROWSER posts to it — which shop.html does as a fallback
   whenever the server-side send fails.
   ============================================================ */
function headerSafe(s) { return String(s == null ? "" : s).replace(/[\r\n]+/g, " ").slice(0, 200); }
function addressOnly(s) { const m = String(s).match(/<([^>]+)>/); return (m ? m[1] : String(s)).trim(); }
const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

function buildMime(from, sender, to, subject, body, replyTo) {
  const domain = sender.split("@")[1] || "bhwebs.com";
  const h = [
    "From: " + headerSafe(from),
    "To: " + headerSafe(to),
    "Subject: " + headerSafe(subject),
    "Message-ID: <" + crypto.randomUUID() + "@" + domain + ">",
    "Date: " + new Date().toUTCString(),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8"
  ];
  if (replyTo && EMAIL_RE.test(replyTo)) h.push("Reply-To: " + headerSafe(replyTo));
  return h.join("\r\n") + "\r\n\r\n" + body + "\r\n";
}

async function notify(env, subject, message, replyTo) {
  try {
    const cfg = JSON.parse((await env.BP_KV.get("config")) || "{}");
    const to = String(cfg.notifyEmail || "").trim();
    if (!to) return { sent: false, reason: "no email configured" };

    if (env.SEND_EMAIL) {
      try {
        const from = env.MAIL_FROM || "The Baker's Pantry <orders@bhwebs.com>";
        const sender = addressOnly(from);
        const raw = buildMime(from, sender, to, subject, message, replyTo);
        await env.SEND_EMAIL.send(new EmailMessage(sender, to, raw));
        return { sent: true, provider: "cloudflare", to };
      } catch (e) {
        const msg = String((e && e.message) || e);
        const hint = /verif/i.test(msg)
          ? " — one-time step: this address must be verified. A verification email from Cloudflare was sent to it; click the link inside once and order emails flow."
          : "";
        return { sent: false, provider: "cloudflare", to, reason: msg + hint };
      }
    }

    /* legacy path — see note above */
    const r = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ _subject: subject, name: "The Baker's Pantry Website", message })
    });
    const text = await r.text();
    let ok = false;
    try { const j = JSON.parse(text); ok = j.success === true || j.success === "true"; } catch {}
    return { sent: ok, provider: "formsubmit", to, reason: ok ? undefined : "HTTP " + r.status };
  } catch (e) { return { sent: false, reason: String(e) }; }
}

function orderText(o) {
  const lines = o.items.map(i => `${i.qty} x ${i.name} — ${usd(i.price * i.qty)}`);
  const out = [`Order ${o.id}`, "", ...lines, ""];
  if (o.discount) {
    out.push(`Subtotal: ${usd(o.subtotal)}`);
    out.push(`Party planner discount — ${o.discount.plannerName} (${o.discount.pct}% off): -${usd(o.discount.amount)}`);
  }
  out.push(
    `TOTAL: ${usd(o.total)}`,
    "",
    `Customer: ${o.customer.name}`,
    `Phone: ${o.customer.phone}`,
    o.customer.email ? `Email: ${o.customer.email}` : null,
    o.customer.pickup ? `Requested pickup: ${o.customer.pickup}` : null,
    o.customer.note ? `Note: ${o.customer.note}` : null,
    "",
    "Payment at pickup."
  );
  return out.filter(Boolean).join("\n");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (!p.startsWith("/api/")) return env.ASSETS.fetch(request);

    /* ---------- public ---------- */
    if (p === "/api/products" && request.method === "GET") {
      const products = await getProducts(env);
      const occasions = await getOccasions(env);
      return J({ products, cats: CATS, occasions }, 200, { "cache-control": "no-store" });
    }

    if (p === "/api/order" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      const name = String(b.name || "").trim().slice(0, 120);
      const phone = String(b.phone || "").trim().slice(0, 40);
      const items = Array.isArray(b.items) ? b.items.slice(0, 60) : [];
      if (!name || !phone || !items.length) return J({ error: "Name, phone and at least one item are required." }, 400);
      const products = await getProducts(env);
      const clean = [];
      for (const it of items) {
        const pr = products.find(x => x.slug === it.slug);
        const qty = Math.max(1, Math.min(99, parseInt(it.qty) || 1));
        if (pr) clean.push({ slug: pr.slug, name: pr.name, price: pr.price, per: pr.per, qty });
      }
      if (!clean.length) return J({ error: "No valid items." }, 400);

      const subtotal = clean.reduce((s, i) => s + i.price * i.qty, 0);
      /* the discount is computed HERE from the planner cookie — the browser
         only ever displays it, it never gets to set it */
      const planner = await plannerFromRequest(request, env);
      let total = subtotal, discount;
      if (planner && Number(planner.discount) > 0) {
        const pct = Math.max(0, Math.min(100, Number(planner.discount)));
        const amount = Math.round(subtotal * pct) / 100;
        total = Math.round((subtotal - amount) * 100) / 100;
        discount = { pct, amount, plannerId: planner.id, plannerName: planner.name, plannerEmail: planner.email };
      }

      const d = new Date();
      const id = "BP-" + d.toISOString().slice(2, 10).replace(/-/g, "") + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      const order = {
        id, items: clean, subtotal, total, discount,
        customer: {
          name, phone,
          email: String(b.email || "").trim().slice(0, 120),
          pickup: String(b.pickup || "").trim().slice(0, 120),
          note: String(b.note || "").trim().slice(0, 500)
        },
        created: d.toISOString(), status: "new"
      };
      const mail = await notify(env, "New order " + id + " — " + usd(total), orderText(order), order.customer.email);
      order.mail = { sent: mail.sent, provider: mail.provider, reason: mail.reason };
      await env.BP_KV.put("order:" + d.getTime() + ":" + id, JSON.stringify(order));
      return J({
        ok: true, id, subtotal, total,
        discount: discount ? { pct: discount.pct, amount: discount.amount } : null,
        emailSent: mail.sent,
        /* lets the browser fire the FormSubmit fallback when server-side mail failed */
        notifyTo: mail.sent ? undefined : mail.to
      });
    }

    /* ---------- party planner ---------- */
    if (p === "/api/planner/login" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      const planners = await getPlanners(env);
      const pl = planners.find(x => x.email === email && x.password === password);
      if (!pl) return J({ error: "Wrong email or password." }, 401);
      const exp = Date.now() + 30 * 864e5;
      const sig = await hmac(env, "planner|" + pl.id + "|" + exp);
      return J({ ok: true, name: pl.name, discount: pl.discount }, 200, {
        "set-cookie": `bp_p=${pl.id}.${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`
      });
    }
    if (p === "/api/planner/logout" && request.method === "POST") {
      return J({ ok: true }, 200, { "set-cookie": "bp_p=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
    }
    if (p === "/api/planner/me" && request.method === "GET") {
      const pl = await plannerFromRequest(request, env);
      if (!pl) return J({ error: "not signed in" }, 401);
      return J({ ok: true, name: pl.name, email: pl.email, discount: pl.discount });
    }

    if (p.startsWith("/api/img/") && request.method === "GET") {
      const rec = await env.BP_KV.get("img:" + p.slice(9));
      if (!rec) return new Response("not found", { status: 404 });
      const { ct, b64 } = JSON.parse(rec);
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return new Response(bytes, { headers: { "content-type": ct, "cache-control": "public, max-age=604800" } });
    }

    /* ---------- admin ---------- */
    if (p === "/api/admin/login" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      /* two valid passwords: the original (on the Mac) and the one given to the client */
      const okPw = b.password && (
        (env.ADMIN_PASSWORD && b.password === env.ADMIN_PASSWORD) ||
        (env.ADMIN_PASSWORD_2 && b.password === env.ADMIN_PASSWORD_2)
      );
      if (!okPw) return J({ error: "Wrong password." }, 401);
      const token = await makeToken(env);
      return J({ ok: true }, 200, {
        "set-cookie": `bp_s=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}`
      });
    }
    if (p === "/api/admin/logout" && request.method === "POST") {
      return J({ ok: true }, 200, { "set-cookie": "bp_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
    }

    if (!(await isAuthed(request, env))) return J({ error: "unauthorized" }, 401);

    if (p === "/api/admin/me") return J({ ok: true });

    if (p === "/api/admin/products" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      if (!Array.isArray(b.products)) return J({ error: "products must be an array" }, 400);
      const seen = new Set();
      const cleaned = b.products.slice(0, 300).map(x => {
        let slug = String(x.slug || x.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
        while (seen.has(slug)) slug += "-2";
        seen.add(slug);
        const tags = Array.isArray(x.tags)
          ? [...new Set(x.tags.map(slugify).filter(Boolean))].slice(0, 20)
          : [];
        return {
          slug,
          name: String(x.name || "").slice(0, 120),
          cat: CATS.some(c => c.key === x.cat) ? x.cat : "dozen",
          price: Math.max(0, Math.round(Number(x.price) || 0)),
          per: String(x.per || "").slice(0, 30),
          img: x.img ? String(x.img).slice(0, 300) : null,
          fav: !!x.fav,
          tags: tags.length ? tags : undefined,
          trio: x.trio ? String(x.trio).slice(0, 40) : undefined,
          desc: x.desc ? String(x.desc).slice(0, 300) : undefined
        };
      }).filter(x => x.name);
      await env.BP_KV.put("products", JSON.stringify(cleaned));
      return J({ ok: true, count: cleaned.length });
    }

    if (p === "/api/admin/occasions" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      if (!Array.isArray(b.occasions)) return J({ error: "occasions must be an array" }, 400);
      const seen = new Set();
      const cleaned = b.occasions.slice(0, 40).map(x => {
        const name = String(x.name || "").trim().slice(0, 40);
        const key = slugify(x.key || name);
        return { key, name };
      }).filter(x => x.key && x.name && !seen.has(x.key) && seen.add(x.key));
      await env.BP_KV.put("occasions", JSON.stringify(cleaned));
      return J({ ok: true, occasions: cleaned });
    }

    if (p === "/api/admin/planners" && request.method === "GET") {
      return J({ planners: await getPlanners(env) });
    }
    if (p === "/api/admin/planners" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      if (!Array.isArray(b.planners)) return J({ error: "planners must be an array" }, 400);
      const cleaned = b.planners.slice(0, 100).map(x => ({
        id: /^pl_[a-z0-9]+$/.test(String(x.id || "")) ? x.id : "pl_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        name: String(x.name || "").trim().slice(0, 80),
        email: String(x.email || "").trim().toLowerCase().slice(0, 120),
        password: String(x.password || "").slice(0, 80),
        discount: Math.max(0, Math.min(100, Math.round(Number(x.discount) || 0))),
        created: x.created || new Date().toISOString()
      })).filter(x => x.name && x.email && x.password);
      await env.BP_KV.put("planners", JSON.stringify(cleaned));
      return J({ ok: true, planners: cleaned });
    }

    if (p === "/api/admin/orders" && request.method === "GET") {
      const list = await env.BP_KV.list({ prefix: "order:", limit: 200 });
      const keys = list.keys.map(k => k.name).sort().reverse().slice(0, 100);
      const orders = [];
      for (const k of keys) {
        const v = await env.BP_KV.get(k);
        if (v) { const o = JSON.parse(v); o._key = k; orders.push(o); }
      }
      return J({ orders });
    }

    if (p === "/api/admin/order-update" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      const key = String(b.key || "");
      if (!key.startsWith("order:")) return J({ error: "bad key" }, 400);
      if (b.action === "delete") { await env.BP_KV.delete(key); return J({ ok: true }); }
      const v = await env.BP_KV.get(key);
      if (!v) return J({ error: "not found" }, 404);
      const o = JSON.parse(v);
      o.status = b.status === "done" ? "done" : "new";
      await env.BP_KV.put(key, JSON.stringify(o));
      return J({ ok: true });
    }

    if (p === "/api/admin/settings" && request.method === "GET") {
      return J(JSON.parse((await env.BP_KV.get("config")) || "{}"));
    }
    if (p === "/api/admin/settings" && request.method === "POST") {
      let b; try { b = await request.json(); } catch { return J({ error: "bad json" }, 400); }
      const cfg = { notifyEmail: String(b.notifyEmail || "").trim().slice(0, 120) };
      await env.BP_KV.put("config", JSON.stringify(cfg));
      return J({ ok: true, ...cfg });
    }
    if (p === "/api/admin/test-email" && request.method === "POST") {
      const r = await notify(env, "Test — The Baker's Pantry website",
        "This is a test notification from your website's admin panel. If you received this, order emails are working.");
      return J(r);
    }

    if (p === "/api/admin/upload" && request.method === "POST") {
      const ct = request.headers.get("content-type") || "application/octet-stream";
      if (!/^image\//.test(ct)) return J({ error: "Only image uploads are allowed." }, 400);
      const buf = await request.arrayBuffer();
      if (buf.byteLength > 4 * 1024 * 1024) return J({ error: "Image too large (max 4 MB)." }, 400);
      let bin = ""; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await env.BP_KV.put("img:" + id, JSON.stringify({ ct, b64: btoa(bin) }));
      return J({ ok: true, url: "/api/img/" + id });
    }

    return J({ error: "not found" }, 404);
  }
};
