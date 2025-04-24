import ListButtonSettings from "@/components/ListButtonSettings";
import { getSession } from "@/utils/cookies";
import Image from "next/image";
import Link from "next/link";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = getSession();
  const user = session?.user;

  const pages = [
    {
      title: "Inicio",
      path: "/",
      icon: "house",
    },
    {
      title: "Mi Perfil",
      path: "/settings",
      icon: "user",
    },
  ];

  const ifLabels = [
    {
      title: "Artistas",
      path: "/settings/artistas",
      icon: "music-notes",
    },
    {
      title: "Gestionar Usuarios",
      path: "/settings/users",
      icon: "users",
    },
  ];

  if (!user) {
    return <div>Unauthorized</div>;
  }

  if (user.role === "label") {
    pages.push(...ifLabels);
  }

  pages.push({
    title: "Emails & Notificaciones",
    path: "/settings/emails",
    icon: "envelope",
  });

  return (
    <main className="bg-background min-h-[calc(100vh)] flex flex-row text-gray-800">
      <aside className="text-white bg-[#061d2a] absolute left-0 top-0 z-9999 flex h-screen w-[18rem] flex-col overflow-y-hidden border-r border-stroke dark:border-stroke-dark dark:bg-gray-dark lg:static lg:translate-x-0 -translate-x-full ">
        <div className="flex flex-col h-full">
          <h1 className="text-2xl font-bold text-center p-8 border-b border-[#0d2f4d]">
            Settings
          </h1>
          {pages.map((page, index) => (
            <Link
              key={index}
              href={page.path}
              className="flex items-center p-4 hover:bg-[#0d2f4d] hover:text-white"
            >
              <span className="mr-4">
                <i className={`ph ph-${page.icon}`}></i>
              </span>
              <span>{page.title}</span>
            </Link>
          ))}
          <a
            href="/api/auth/logout"
            className="flex items-center p-4 hover:bg-[#0d2f4d] hover:text-white"
          >
            <span className="mr-4">
              <i className={`ph ph-sign-out`}></i>
            </span>
            <span>Cerrar Sesión</span>
          </a>
        </div>
        <ul className="flex flex-col items-center justify-center border-t border-[#0d2f4d]">
          {/* <li className="h-16 bg-[#051421] w-full flex items-center justify-center text-lg">
            Ayuda
          </li> */}
          <li className="h-16 flex items-center justify-between w-full p-4 bg-[#000f17] px-10">
            <div className="flex items-center gap-4">
              <Image
                src={user?.picture}
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full aspect-square object-cover"
              />
              <span>{user?.name}</span>
            </div>
          </li>
        </ul>
      </aside>
      <header className="flex md:hidden fixed top-0 left-0 right-0 h-16 z-9999 bg-[#061d2a] text-white border-b border-stroke justify-between items-center p-4">
        <h1 className="text-xl font-bold">Settings</h1>
        <ListButtonSettings user={user} pages={pages} />
      </header>
      <div className="flex flex-1 flex-col w-full h-full mt-16 md:mt-0">
        {children}
      </div>
    </main>
  );
}
