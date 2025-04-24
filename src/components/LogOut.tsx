import Link from "next/link";

export default function LogOut({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href="/api/auth/logout">
      {children}
    </a>
  );
}
