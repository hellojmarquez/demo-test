import Footer from "@/components/Footer";
import CatalogoNavigator from "@/components/CatalogoNavigator";
import Header from "@/components/Header";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      <CatalogoNavigator />

      <div className="bg-background min-h-[calc(100vh-10rem)]">
        <div className="min-h-[calc(100vh-10rem)] px-2 py-4">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
