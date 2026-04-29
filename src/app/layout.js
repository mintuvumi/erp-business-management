import "../styles/globals.css";
import LayoutClient from "@/components/LayoutClient";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}