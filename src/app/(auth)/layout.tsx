import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      <div className="bg-background min-h-[calc(100vh-10rem)]">
        <div className="min-h-[calc(100vh-10rem)]">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
