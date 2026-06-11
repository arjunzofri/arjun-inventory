import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arjun Inventory Reconciler",
  description: "Cuadre de inventario físico de Arjun en bodegas de Vida Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
