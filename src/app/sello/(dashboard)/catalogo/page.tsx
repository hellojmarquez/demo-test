'use client';

import { useState } from 'react';
import Productos from './Productos';
import Assets from './Assets';
import Sellos from './Sellos';
import Personas from './Personas';

const MenuSection = () => {
	const [selected, setSelected] = useState('PRODUCTOS');

	const renderComponent = () => {
		switch (selected) {
			case 'PRODUCTOS':
				return <Productos />;
			case 'ASSETS':
				return <Assets />;
			case 'SELLOS':
				return <Sellos />;
			case 'PERSONAS':
				return <Personas />;
			default:
				return null;
		}
	};

	const menuItems = ['PRODUCTOS', 'ASSETS', 'SELLOS', 'PERSONAS'];

	return (
		<section>
			<ul className="flex mb-8 gap-x-8 font-semibold text-brand-lightblack">
				{menuItems.map(item => (
					<li
						key={item}
						onClick={() => setSelected(item)}
						className={`relative cursor-pointer after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-brand-boldblack after:transition-all after:duration-300 after:origin-center hover:after:w-full hover:after:translate-x-[-50%]
              ${
								selected === item
									? 'after:w-full after:translate-x-[-50%]'
									: 'after:w-0'
							}
            `}
					>
						{item}
					</li>
				))}
			</ul>

			<main>{renderComponent()}</main>
		</section>
	);
};

export default MenuSection;
