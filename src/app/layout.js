import "../styles/globals.css";
import LayoutClient from "@/components/LayoutClient";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";

export const metadata = {
  title: {
    default: "SeeERP",
    template: "%s | SeeERP",
  },
  description: "SeeERP Business Management Software",
  applicationName: "SeeERP",
  icons: {
    icon: [
      { url: "/logo/icon-1.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/logo/icon-1.png",
    apple: "/logo/icon-1.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo/icon-1.png" type="image/png" />
        <link rel="shortcut icon" href="/logo/icon-1.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/icon-1.png" />
      </head>

      <body className="bg-gray-50 min-h-screen">
        <Providers>
          <LayoutClient>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </LayoutClient>
        </Providers>
      </body>
    </html>
  );
}