import "@/styles/globals.css";
import { CompanyProvider } from "../context/CompanyContext";
import { AuthProvider } from "../auth/AuthContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Component {...pageProps} />
      </CompanyProvider>
    </AuthProvider>
  );
}