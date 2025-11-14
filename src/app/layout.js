import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import AuthProviderWrapper from "../components/providers/AuthProviderWrapper";

export const metadata = {
  title: "Dynamis Blog",
  description: "Blog tech avec Next.js, Tailwind CSS et Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="flex flex-col min-h-screen">
        <AuthProviderWrapper>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
