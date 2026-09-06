import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * CSP production. Pas de 'unsafe-eval' : utiliser
 * https://grist.numerique.gouv.fr/grist-plugin-api.js (build prod),
 * pas docs.getgrist.com (devtool eval → bloqué → « Hors Grist »).
 */
const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' https://grist.numerique.gouv.fr",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https://grist.numerique.gouv.fr",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
].join("; ");

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "inject-prod-csp",
      transformIndexHtml(html) {
        if (command !== "build") {
          return html;
        }
        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PROD_CSP}" />`,
        );
      },
    },
  ],
  base: "./",
  build: {
    sourcemap: false,
    minify: true,
  },
  server: {
    port: 5175,
    strictPort: true,
  },
  preview: {
    port: 5175,
    strictPort: true,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
}));
