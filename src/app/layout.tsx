// ARQUIVO: src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Mudamos para Inter
import 'react-calendar/dist/Calendar.css';
import "./globals.css";

// Configuração da fonte Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkCondo",
  description: "Gestão de Condomínios Inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}