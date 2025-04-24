import { ITokenUser, ISession } from "@/types";
import jwt from "jsonwebtoken";
import { jwtVerify, JWTPayload } from "jose";
import { removeToken } from "./cookies";

const JWT_SECRET = process.env.JWT_SECRET || "risketo-secret";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "30d";

export const generateToken = ({ user }: { user: ITokenUser }): string => {
  return jwt.sign({ user }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
};

export const verifyToken = (token: string): ISession | null => {
  const decoded = jwt.verify(token, JWT_SECRET) as ISession;

  if (!decoded) {
    removeToken();
  }

  return decoded;
};

export const verifyTokenJose = async (
  token: string
): Promise<ISession | null> => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as ISession;
    return session;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};
