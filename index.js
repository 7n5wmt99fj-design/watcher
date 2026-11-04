export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/test-telegram") {
      try {
        if (!env.BOT_TOKEN) return new Response("FEHLER: BOT_TOKEN fehlt in Cloudflare Secrets!", { status: 500 });
        if (!env.CHAT_ID) return new Response("FEHLER: CHAT_ID fehlt in Cloudflare Secrets!", { status: 500 });

        const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
            text: "Test vom Cloudflare Worker!"
          })
        });
        
        const text = await res.text();
        return new Response("Telegram Antwort:\n\n" + text, {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      } catch (err) {
        return new Response("Fehler im Code: " + err.message, { status: 500 });
      }
    }

    // Der normale Pixel-Teil
    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      const tag = url.searchParams.get("c") || "";
      const t = new Date().toISOString();

      try {
        if (env.HITS) {
          await env.HITS.put(Date.now() + "-" + ip, JSON.stringify({ ip, ua, tag, t }));
        }
        
        if (env.BOT_TOKEN && env.CHAT_ID) {
          // Wir warten hier mit "await"!
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: env.CHAT_ID,
              text: `hit\ntag: ${tag}\nip: ${ip}`
            })
          });
        }
      } catch (e) {
        // Fehler beim Senden ignorieren, damit das Bild trotzdem lädt
      }

      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif" } });
    }

    return new Response("Läuft. Nutze /test-telegram oder /pixel?c=test", { status: 200 });
  }
};
