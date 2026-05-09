import "../styles/globals.css";
import LayoutClient from "@/components/LayoutClient";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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