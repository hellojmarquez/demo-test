module.exports = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**',
			},
		],
		experimental: {
			excludeDefaultMomentLocales: true,
		},
	},
};
