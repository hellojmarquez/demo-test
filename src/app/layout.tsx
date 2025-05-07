import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const rubik = Rubik({
	weight: ['300', '400', '500', '700'],
	style: ['normal'],
	subsets: ['latin'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'Isla Sounds',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<head>
				<script src="https://unpkg.com/@phosphor-icons/web"></script>
				<link
					rel="icon"
					type="image/png"
					href="/favicon-96x96.png"
					sizes="96x96"
				/>
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<link rel="shortcut icon" href="/favicon.ico" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<meta name="apple-mobile-web-app-title" content="CMMG" />
			</head>
			<body className={rubik.className}>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
