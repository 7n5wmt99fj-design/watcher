export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      const tag = url.searchParams.get("c") || "";
      const t = new Date().toISOString();

      // 1. In KV speichern
      try {
        if (env.HITS) {
          await env.HITS.put(Date.now() + "-" + ip, JSON.stringify({ ip, ua, tag, t }));
        }
      } catch (e) {}

      // 2. An Telegram senden
      if (env.BOT_TOKEN && env.CHAT_ID) {
        const msg = `🎯 Hit!\n🏷️ Tag: ${tag || "-"}\n🌐 IP: ${ip}\n📱 UA: ${ua.slice(0, 60)}...\n⏰ Zeit: ${t}`;

        try {
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: env.CHAT_ID,
              text: msg
            })
          });
        } catch (e) {}
      }

      // 3. Das unsichtbare Bild zurückgeben
      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
    }

    return new Response("Läuft.", { status: 200 });
  }
};
