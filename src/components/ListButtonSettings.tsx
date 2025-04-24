"use client";
import React from "react";
import Link from "next/link";
import { List } from "@phosphor-icons/react";
import { ITokenUser } from "@/types";

const ListButtonSettings = ({
  user,
  pages,
}: {
  user: ITokenUser;
  pages: { title: string; path: string; icon: string }[];
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleClick = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <div
        className={`w-screen h-[calc(100vh-4rem)] top-[4rem] bg-black/50 fixed left-0 z-[1500]`}
        style={{ display: menuOpen ? "block" : "none" }}
        onClick={handleClick}
      ></div>

      <div
        className={`bg-header fixed top-[4rem] left-0 z-[2000] h-full w-[60%] transition-transform duration-300 ease-in-out`}
        style={{ transform: menuOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <nav className={`flex flex-col space-y-4 h-full w-full`}>
          {user._id && (
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
                <span className="text-sm text-gray-400">
                  {`ID: ${user._id.slice(0, 15)}...`}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col space-y-4 p-6 border-b border-foreground/20 gap-2">
            {pages.map((page, index) => (
              <Link
                key={index}
                href={page.path}
                passHref
                onClick={() => setMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <i className={`ph ph-${page.icon} text-foreground`} ></i>
                  <span>{page.title}</span>
                </div>
              </Link>
            ))}
            <a
                href={"/api/auth/logout"}
                onClick={() => setMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <i className={`ph ph-sign-out text-foreground`} ></i>
                  <span>Cerrar Sesión</span>
                </div>
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

export default ListButtonSettings;
