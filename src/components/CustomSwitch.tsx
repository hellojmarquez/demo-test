import React from 'react';

interface CustomSwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	className?: string;
	onText?: string;
	offText?: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
	checked,
	onChange,
	className = '',
	onText,
	offText,
}) => (
	<div className="flex items-center">
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			tabIndex={0}
			onClick={() => onChange(!checked)}
			className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex items-center ${
				checked ? 'bg-brand-light' : 'bg-gray-700'
			} ${className}`}
		>
			{checked && (
				<span className="absolute left-1.5 w-px h-1.5 bg-white rounded-sm z-10"></span>
			)}
			{!checked && (
				<span className="absolute right-1 top-1.1 w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-transparent z-10"></span>
			)}
			<span
				className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 z-20 ${
					checked ? 'translate-x-4' : ''
				} ${checked ? '' : 'border-2 border-gray-300'}`}
			></span>
		</button>
		{(onText || offText) && (
			<span
				className={`text-sm ml-2 ${
					checked ? 'text-brand-light' : 'text-gray-700'
				}`}
			>
				{checked ? onText : offText}
			</span>
		)}
	</div>
);

export default CustomSwitch;
