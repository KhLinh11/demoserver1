import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vitara Data Platform - Enterprise Attribution & P&L Intelligence",
  description: "Hệ thống đối soát bán lẻ đa kênh, khử trùng lặp và tính toán P&L 12 dòng chuẩn kế toán quản trị.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%238F60BF'/%3E%3Cpath d='M18 20 L32 46 L46 20' stroke='%23FFFFFF' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
