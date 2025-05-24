import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Only apply middleware logic for login/signup redirects when user is authenticated
  // Don't interfere with signout flow or navigation to root page
  
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Only check session for specific redirects, don't block other navigation
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Only redirect if logged in and trying to access login/signup pages
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup")) {
    const createUrl = new URL("/create", req.url);
    return NextResponse.redirect(createUrl);
  }

  // Allow all other requests to proceed normally
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}; 