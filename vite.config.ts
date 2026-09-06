import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * CSP stricte : scripts uniquement same-origin (API Grist vendored dans /grist-plugin-api.js).
 * 'unsafe-inline' pour le bootstrap ready dans index.html.
 */
const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https://grist.numerique.gouv.fr",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
].join("; ");

/** SHA court en CI, sinon timestamp — partagé HTML / bundle / version.json. */
const BUILD_ID =
  (process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 12)) ||
  Date.now().toString(36);

function emitVersionJson(): Plugin {
  return {
    name: "emit-version-json",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId: BUILD_ID }, null, 0),
      });
    },
  };
}

function injectProdHtml(): Plugin {
  return {
    name: "inject-prod-html",
    transformIndexHtml(html) {
      let out = html;
      out = out.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PROD_CSP}" />`,
      );
      out = out.replace(
        'src="./grist-plugin-api.js"',
        `src="./grist-plugin-api.js?b=${BUILD_ID}"`,
      );
      return out;
    },
    apply: "build",
  };
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [react(), injectProdHtml(), emitVersionJson()],
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
});
