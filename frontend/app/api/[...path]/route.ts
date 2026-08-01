import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function PUT(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

async function handleProxy(req: Request, pathSegments: string[]) {
  const session = await getServerSession(authOptions);
  const path = pathSegments.join("/");
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

  // Construct target URL
  const parsedUrl = new URL(req.url);
  const backendTargetUrl = `${backendUrl}/api/${path}${parsedUrl.search}`;

  const headers = new Headers();
  // Copy relevant headers from the client request
  req.headers.forEach((value, key) => {
    // Exclude host and content-type if we are forwarding multipart form-data
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-type") {
      headers.set(key, value);
    }
  });

  // Keep JSON content-type if it is JSON
  const reqContentType = req.headers.get("content-type") || "";
  if (reqContentType.includes("application/json")) {
    headers.set("content-type", "application/json");
  }

  // Inject session info if user is logged in
  if (session?.user?.id) {
    headers.set("x-user-id", session.user.id);
    headers.set("x-user-role", session.user.role || "");
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
    };

    if (req.method === "POST" || req.method === "PUT") {
      if (reqContentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        fetchOptions.body = formData;
        // Do not set content-type header; the browser/fetch client will auto-set the boundary
      } else {
        const bodyText = await req.text();
        fetchOptions.body = bodyText;
      }
    }

    const res = await fetch(backendTargetUrl, fetchOptions);
    const data = await res.arrayBuffer();

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      // Filter out transfer encodings or content lengths to prevent proxy mismatch errors
      if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "content-length") {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(data, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`Proxy error for ${path}:`, err);
    return NextResponse.json({ message: "Proxy error", error: err.message }, { status: 502 });
  }
}
