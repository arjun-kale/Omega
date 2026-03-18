import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

type IngestBody = {
  temp: unknown;
  status: unknown;
  imageBase64?: unknown;
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

http.route({
  path: "/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-device-secret");
    const expectedSecret = process.env.DEVICE_SECRET;

    if (!expectedSecret || !secret || secret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: IngestBody;
    try {
      body = (await request.json()) as IngestBody;
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    if (typeof body.temp !== "number" || Number.isNaN(body.temp)) {
      return new Response("'temp' must be a valid number", { status: 422 });
    }

    if (body.status !== "OK" && body.status !== "NOK") {
      return new Response("'status' must be 'OK' or 'NOK'", { status: 422 });
    }

    const serverTimestamp = Date.now();

    await ctx.runMutation(api.telemetry.insertReading, {
      temp: body.temp,
      status: body.status,
      timestamp: serverTimestamp,
    });

    if (
      body.status === "NOK" &&
      typeof body.imageBase64 === "string" &&
      body.imageBase64.length > 0
    ) {
      try {
        const imageBuffer = base64ToArrayBuffer(body.imageBase64);
        const blob = new Blob([imageBuffer], { type: "image/jpeg" });
        const storageId = await ctx.storage.store(blob);

        await ctx.runMutation(api.defects.logDefect, {
          storageId,
          heatSignature: body.temp,
          timeDetected: new Date(serverTimestamp).toISOString(),
        });
      } catch (error) {
        console.error("Image storage failed:", error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
