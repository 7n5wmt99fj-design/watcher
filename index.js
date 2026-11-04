export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "";
      const tag = url.searchParams.get("c") || "";
      const t = new Date().toISOString();

      // 1. Geo-Infos abrufen (Stadt, Land, Provider)
      let geoInfo = "Unbekannt";
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org`);
        const geo = await geoRes.json();
        if (geo.status === "success") {
          geoInfo = `${geo.city || '?'}, ${geo.country || '?'} | ${geo.isp || geo.org || '?'}`;
        }
      } catch (e) {
        geoInfo = "API Fehler";
      }

      // 2. In KV speichern
      try {
        if (env.HITS) {
          await env.HITS.put(Date.now() + "-" + ip, JSON.stringify({ ip, ua, tag, t, geoInfo }));
        }
      } catch (e) {}

      // 3. An Telegram senden
      if (env.BOT_TOKEN && env.CHAT_ID) {
        const msg = 
          `🎯 **Neuer Hit!**\n` +
          `🏷️ **Tag:** ${tag || "-"}\n` +
          `🌐 **IP:** ${ip}\n` +
          `📍 **Ort:** ${geoInfo}\n` +
          `📱 **Device:** ${ua.slice(0, 80)}...\n` +
          `⏰ **Zeit:** ${t}`;

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

      // 4. Unsichtbares Bild zurückgeben
      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
    }

    return new Response("Läuft.", { status: 200 });
  }
};
