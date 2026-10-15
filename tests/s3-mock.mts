/**
 * Minimal in-memory S3-compatible server used to verify the Cloudflare R2
 * integration without real credentials. Supports exactly what the app needs:
 * PUT, GET (with content-length) and DELETE on path-style object URLs.
 */

import { createServer } from "node:http";

export interface S3Mock {
  url: string;
  objects: Map<string, { body: Buffer; contentType: string; metadata: Record<string, string> }>;
  close: () => Promise<void>;
  requests: string[];
}

export async function startS3Mock(port = 0): Promise<S3Mock> {
  const objects = new Map<string, { body: Buffer; contentType: string; metadata: Record<string, string> }>();
  const requests: string[] = [];

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
    requests.push(`${request.method} ${url.pathname}`);

    if (request.method === "PUT") {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        const metadata: Record<string, string> = {};
        for (const [name, value] of Object.entries(request.headers)) {
          if (name.startsWith("x-amz-meta-") && typeof value === "string") {
            metadata[name.replace("x-amz-meta-", "")] = value;
          }
        }
        objects.set(key, {
          body: Buffer.concat(chunks),
          contentType: (request.headers["content-type"] as string) ?? "application/octet-stream",
          metadata,
        });
        response.writeHead(200, { ETag: '"mock-etag"' });
        response.end();
      });
      return;
    }

    if (request.method === "HEAD" || request.method === "GET") {
      const object = objects.get(key);
      if (!object) {
        response.writeHead(404, { "Content-Type": "application/xml" });
        response.end("<Error><Code>NoSuchKey</Code></Error>");
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": object.contentType,
        "Content-Length": String(object.body.byteLength),
        ETag: '"mock-etag"',
      };
      for (const [name, value] of Object.entries(object.metadata)) {
        headers[`x-amz-meta-${name}`] = value;
      }
      response.writeHead(200, headers);
      response.end(request.method === "HEAD" ? undefined : object.body);
      return;
    }

    if (request.method === "DELETE") {
      objects.delete(key);
      response.writeHead(204);
      response.end();
      return;
    }

    response.writeHead(405);
    response.end();
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;

  return {
    url: `http://127.0.0.1:${actualPort}`,
    objects,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}
