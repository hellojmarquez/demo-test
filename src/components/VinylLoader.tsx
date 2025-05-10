import React from 'react';

interface VinylLoaderProps {
	size?: number;
	className?: string;
}

const VinylLoader: React.FC<VinylLoaderProps> = ({
	size = 64,
	className = '',
}) => {
	return (
		<div className={`flex flex-col items-center gap-2 ${className}`}>
			<div className="relative" style={{ width: size, height: size }}>
				{/* Main vinyl disc */}
				<div
					className="absolute inset-0 rounded-full bg-gray-800"
					style={{ animation: 'spin 2s linear infinite' }}
				/>

				{/* Spinning line */}
				<div
					className="absolute inset-0 rounded-full"
					style={{
						animation: 'spin 2s linear infinite',
						background:
							'linear-gradient(90deg, transparent 0%, transparent 49%, white 50%, transparent 51%, transparent 100%)',
					}}
				/>

				{/* Center label */}
				<div className="absolute inset-[30%] rounded-full bg-red-600" />

				{/* Center hole */}
				<div className="absolute inset-[45%] rounded-full bg-gray-900" />
			</div>

			<span
				className="italic text-gray-400 text-sm"
				style={{ animation: 'blink 1s infinite' }}
			>
				Grabando...
			</span>

			<style jsx>{`
				@keyframes spin {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}

				@keyframes blink {
					0%,
					100% {
						opacity: 1;
					}
					50% {
						opacity: 0.3;
					}
				}
			`}</style>
		</div>
	);
};

export default VinylLoader;
