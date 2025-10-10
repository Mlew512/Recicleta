import { LanguageProvider } from "@/context/LanguageContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <ProtectedRoute>
        <Component {...pageProps} />
      </ProtectedRoute>
    </LanguageProvider>
  );
}
