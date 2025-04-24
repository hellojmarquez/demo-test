"use client";
import React from "react";
import {
  Book,
  Graph,
  Money,
  User,
  Key,
  SignOut,
  X,
  List,
  InstagramLogo,
  TwitterLogo,
  WhatsappLogo,
  Gear,
} from "@phosphor-icons/react";
import Link from "next/link";
import { ITokenUser } from "@/types";
import { pages } from "@/constants/nav";

const userElements = [
  { name: "Mi Cuenta", href: "/settings" },
  // { name: "Cambiar Contraseña", href: "/cambiar-contraseña" },
];

const Logo = ({ href, size = 16 }: { href: string; size: number }) => {
  switch (href) {
    case "/catalogo/productos":
      return <Book size={size} />;
    case "/productos":
      return <Book size={size} />;
    case "/settings/users":
      return <Gear size={size} />;
    case "/analiticas":
      return <Graph size={size} />;
    case "/contabilidad":
      return <Money size={size} />;
    case "/settings":
      return <User size={size} />;
    case "/cambiar-contraseña":
      return <Key size={size} />;
    case "/logout":
      return <SignOut size={size} />;
    default:
      return <X size={size} />;
  }
};

const ListButton = ({ user, id }: { user: ITokenUser; id: string }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleClick = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <div
        className={`w-screen h-[calc(100vh-4rem)] top-[4rem] bg-black/50 fixed left-0 z-40`}
        style={{ display: menuOpen ? "block" : "none" }}
        onClick={handleClick}
      ></div>

      <div
        className={`bg-header fixed top-[4rem] left-0 z-50 h-full w-[60%] transition-transform duration-300 ease-in-out`}
        style={{ transform: menuOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <nav className={`flex flex-col space-y-4 h-full w-full`}>
          {id && (
            <div className="flex items-center gap-2 px-2 py-4 border-b border-foreground/20">
              <img
                src={user.picture}
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
              />
              <div className="flex flex-col">
                <span className="font-medium text-sm truncate w-[17ch]">
                  {user.email}
                </span>
                <span className="text-sm text-gray-400">ID: {id}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col space-y-4 p-6 border-b border-foreground/20 gap-2">
            {pages.map(([name, href]) => (
              <Link
                key={href}
                href={href}
                passHref
                className="flex items-center gap-4"
                onClick={handleClick}
              >
                <Logo href={href} size={22} />
                <p className="text-md">{name}</p>
              </Link>
            ))}
          </div>

          <div className="flex flex-col space-y-4 p-6 border-b border-foreground/20 gap-2">
            {userElements.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                passHref
                className="flex items-center gap-4"
                onClick={handleClick}
              >
                <Logo href={href} size={22} />
                <p className="text-md">{name}</p>
              </Link>
            ))}

            <a className="flex items-center gap-4" href={"/api/auth/logout"}>
              <Logo href={"/logout"} size={22} />
              <p className="text-md">Cerrar Sesión</p>
            </a>
          </div>

          <div className="flex flex-row w-full justify-center items-center gap-4 p-6 border-b border-foreground/20">
            <a href="https://www.whatsapp.com">
              <WhatsappLogo size={25} />
            </a>
            <a href="https://www.instagram.com">
              <InstagramLogo size={25} />
            </a>
            <a href="https://www.twitter.com">
              <TwitterLogo size={25} />
            </a>
          </div>
        </nav>
      </div>

      <div className="flex items-center space-x-2">
        <button onClick={handleClick}>
          <List size={32} />
        </button>
      </div>
    </>
  );
};

export default ListButton;
