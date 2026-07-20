import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_SUPABASE");

  // Without Supabase configured, skip auth checks so the dashboard can be
  // previewed with demo data before setup.
  if (!supabaseConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Race the real auth check against a timeout so middleware can never
  // hang until Vercel's hard limit and 504. If Supabase is slow, we
  // fall back to treating the request as unauthenticated.
  const getUserWithTimeout = async (ms = 5000) => {
    const timeout = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), ms)
    );
    try {
      return await Promise.race([supabase.auth.getUser(), timeout]);
    } catch {
      return { data: { user: null } };
    }
  };

  const { data: { user } } = await getUserWithTimeout();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".");

  if (!user && !isAuthRoute && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}