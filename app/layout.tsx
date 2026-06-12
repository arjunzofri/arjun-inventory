import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arjun Inventory Reconciler",
  description: "Cuadre de inventario físico de Arjun en bodegas de Vida Digital",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#e8ecef",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
