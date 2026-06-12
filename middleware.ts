export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/(dashboard)/:path*",
    "/api/reconciliacion/:path*",
    "/api/conteo-fisico/:path*",
    "/api/conteo-fisico-ingreso/:path*",
    "/api/usuarios/:path*",
  ],
};
