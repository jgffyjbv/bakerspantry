/* The Baker's Pantry — API worker (KV-backed shop + admin) */

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

async function getProducts(env) {
  let raw = await env.BP_KV.get("products");
  if (!raw) { await env.BP_KV.put("products", JSON.stringify(SEED)); return SEED; }
  return JSON.parse(raw);
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

async function notify(env, subject, message) {
  try {
    const cfg = JSON.parse((await env.BP_KV.get("config")) || "{}");
    if (!cfg.notifyEmail) return { sent: false, reason: "no email configured" };
    const r = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(cfg.notifyEmail), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ _subject: subject, name: "The Baker's Pantry Website", message })
    });
    return { sent: r.ok, status: r.status };
  } catch (e) { return { sent: false, reason: String(e) }; }
}

function orderText(o) {
  const lines = o.items.map(i => `${i.qty} x ${i.name} — $${i.price * i.qty}`);
  return [
    `Order ${o.id}`,
    "",
    ...lines,
    "",
    `TOTAL: $${o.total}`,
    "",
    `Customer: ${o.customer.name}`,
    `Phone: ${o.customer.phone}`,
    o.customer.email ? `Email: ${o.customer.email}` : null,
    o.customer.pickup ? `Requested pickup: ${o.customer.pickup}` : null,
    o.customer.note ? `Note: ${o.customer.note}` : null,
    "",
    "Payment at pickup."
  ].filter(Boolean).join("\n");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (!p.startsWith("/api/")) return env.ASSETS.fetch(request);

    /* ---------- public ---------- */
    if (p === "/api/products" && request.method === "GET") {
      const products = await getProducts(env);
      return J({ products, cats: CATS }, 200, { "cache-control": "no-store" });
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
      const total = clean.reduce((s, i) => s + i.price * i.qty, 0);
      const d = new Date();
      const id = "BP-" + d.toISOString().slice(2, 10).replace(/-/g, "") + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      const order = {
        id, items: clean, total,
        customer: {
          name, phone,
          email: String(b.email || "").trim().slice(0, 120),
          pickup: String(b.pickup || "").trim().slice(0, 120),
          note: String(b.note || "").trim().slice(0, 500)
        },
        created: d.toISOString(), status: "new"
      };
      await env.BP_KV.put("order:" + d.getTime() + ":" + id, JSON.stringify(order));
      const mail = await notify(env, "New order " + id + " — $" + total, orderText(order));
      return J({ ok: true, id, total, emailSent: mail.sent });
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
      if (!env.ADMIN_PASSWORD || b.password !== env.ADMIN_PASSWORD) return J({ error: "Wrong password." }, 401);
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
        return {
          slug,
          name: String(x.name || "").slice(0, 120),
          cat: CATS.some(c => c.key === x.cat) ? x.cat : "dozen",
          price: Math.max(0, Math.round(Number(x.price) || 0)),
          per: String(x.per || "").slice(0, 30),
          img: x.img ? String(x.img).slice(0, 300) : null,
          fav: !!x.fav,
          trio: x.trio ? String(x.trio).slice(0, 40) : undefined,
          desc: x.desc ? String(x.desc).slice(0, 300) : undefined
        };
      }).filter(x => x.name);
      await env.BP_KV.put("products", JSON.stringify(cleaned));
      return J({ ok: true, count: cleaned.length });
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
        "This is a test notification from your website's admin panel. If you received this, order emails are working.\n\nNote: the very first email from FormSubmit is an activation request — click the button in it once, then emails flow normally.");
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
