export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/dump") {
      if (url.searchParams.get("k") !== env.DUMP_KEY) {
        return new Response("nope", { status: 404 });
      }
      const list = await env.HITS.list();
      const rows = [];
      for (const key of list.keys) {
        const v = await env.HITS.get(key.name);
        if (v) rows.push(JSON.parse(v));
      }
      rows.sort((a, b) => a.t.localeCompare(b.t));
      const txt = rows.map(r =>
        `${r.t}  ${r.ip}  ${r.tag}  ${r.ua.slice(0, 50)}`
      ).join("\n");
      return new Response(txt || "no hits yet", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      const ref = request.headers.get("Referer") || "";
      const tag = url.searchParams.get("c") || "";
      const t = new Date().toISOString();

      // In KV speichern
      await env.HITS.put(
        Date.now() + "-" + ip,
        JSON.stringify({ ip, ua, ref, t, tag })
      );

      // An Telegram senden (mit ctx.waitUntil)
      const msg =
        `hit\ntag: ${tag || "-"}\nip: ${ip}\n` +
        `ua: ${ua.slice(0, 70)}\nt: ${t}`;

      ctx.waitUntil(
        fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
            text: msg,
            disable_web_page_preview: true
          })
        }).catch((err) => console.error("Telegram error:", err))
      );

      // Das unsichtbare Bild zurückgeben
      const gif = Uint8Array.from(
        atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="),
        c => c.charCodeAt(0)
      );
      return new Response(gif, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" }
      });
    }

    return new Response("ok", { status: 200 });
  }
};
