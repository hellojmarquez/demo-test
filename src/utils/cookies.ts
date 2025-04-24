import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

const setToken = (token: string) => {
  const cookieStore = cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60,
  });
};

const getToken = () => {
  const cookieStore = cookies();
  return cookieStore.get("token")?.value || "";
};

const getSession = () => {
  const cookieStore = cookies();
  const cookie = cookieStore.get("token");
  if (!cookie) return null;
  return verifyToken(cookie?.value);
};

const removeToken = () => {
  const cookieStore = cookies();
  cookieStore.delete("token");
};

export { setToken, getSession, removeToken, getToken };
