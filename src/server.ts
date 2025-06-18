import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocket } from './lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
	const server = createServer((req, res) => {
		const parsedUrl = parse(req.url!, true);
		handle(req, res, parsedUrl);
	});

	// Inicializar Socket.IO
	initSocket({ socket: { server } } as any);
	const PORT = parseInt(process.env.PORT || '3000', 10);

	server.listen(PORT, '0.0.0.0', () => {
		console.log(`Ready on http://0.0.0.0:${PORT}`);
	});
});
