import React from 'react';
import Releases from './Releases';

const page = () => {
	return (
		<section>
			<ul className="flex mb-8 gap-x-8 font-semibold text-brand-lightblack ">
				<li className="relative cursor-pointer after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:bg-brand-boldblack after:transition-all after:duration-300 after:origin-center hover:after:w-full hover:after:translate-x-[-50%]">
					PRODUCTOS
				</li>

				<li className="relative cursor-pointer after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:bg-brand-boldblack after:transition-all after:duration-300 after:origin-center hover:after:w-full hover:after:translate-x-[-50%]">
					ASSETS
				</li>
				<li className="relative cursor-pointer after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:bg-brand-boldblack after:transition-all after:duration-300 after:origin-center hover:after:w-full hover:after:translate-x-[-50%]">
					SELLOS
				</li>
				<li className="relative cursor-pointer after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:bg-brand-boldblack after:transition-all after:duration-300 after:origin-center hover:after:w-full hover:after:translate-x-[-50%]">
					PERSONAS
				</li>
			</ul>
			<Releases />
		</section>
	);
};

export default page;
