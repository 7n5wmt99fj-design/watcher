export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      const tag = url.searchParams.get("c") || "";
      const t = new Date().toISOString();

      // 1. In KV speichern (falls gebunden)
      if (env.HITS) {
        await env.HITS.put(Date.now() + "-" + ip, JSON.stringify({ ip, ua, tag, t }));
      }

      // 2. Infos über die IP holen (Provider, Stadt, Land)
      let info = "Keine Info";
      try {
        // Wir holen uns die Daten von ip-api.com
        const apiRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org`);
        const data = await apiRes.json();
        if (data.status === "success") {
          info = `${data.city}, ${data.country} | Provider: ${data.isp}`;
        }
      } catch (e) {
        info = "API Fehler";
      }

      // 3. An Telegram senden
      if (env.BOT_TOKEN && env.CHAT_ID) {
        const msg = 
          `🎯 **Hit!**\n` +
          `🏷️ Tag: ${tag || "-"}\n` +
          `🌐 IP: ${ip}\n` +
          `📍 Ort: ${info}\n` +
          `📱 Device: ${ua.slice(0, 60)}...\n` +
          `⏰ Zeit: ${t}`;

        try {
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: env.CHAT_ID,
              text: msg,
              parse_mode: "Markdown"
            })
          });
        } catch (e) {}
      }

      // Unsichtbares Bild zurückgeben
      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif" } });
    }

    return new Response("Läuft.", { status: 200 });
  }
};
