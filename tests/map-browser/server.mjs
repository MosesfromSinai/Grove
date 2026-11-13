// A separate test server; this fixture is never a Next.js route or auth bypass.
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
const repo = fileURLToPath(new URL("../../", import.meta.url));
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: `${repo}/public`,
  resolve: { alias: { "@": repo } },
  define: { "process.env.NEXT_PUBLIC_MAPBOX_TOKEN": JSON.stringify("local-test-no-provider-access") },
  esbuild: { jsx: "automatic" },
  server: { host: "127.0.0.1", port: 3186, strictPort: true, fs: { allow: [repo] } },
});
await server.listen();
