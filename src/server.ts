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

	server.listen(PORT, () => {
		console.log(`> Ready on http://localhost:${PORT}`);
	});
});
