import React from 'react';

type InputGroupProps = {
	label: string;
	name: string;
	value: string | number;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	type?: string;
	placeholder?: string;
};

const InputGroup: React.FC<InputGroupProps> = ({
	label,
	name,
	value,
	onChange,
	type = 'text',
	placeholder = '',
}) => (
	<div>
		<label className="label">{label}</label>
		<input
			name={name}
			value={value}
			onChange={onChange}
			type={type}
			placeholder={placeholder}
			className="input"
		/>
	</div>
);

export default InputGroup;
