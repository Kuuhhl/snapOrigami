import React from "react";
import icon from "../assets/icon.png";

function Header() {
	return (
		<div className="flex flex-col w-full gap-2 rounded-xl items-center p-4 bg-white/40 backdrop-filter backdrop-blur-sm">
			<img
				className="w-24 h-24 rounded-xl"
				src={icon}
				alt="Snap Origami Logo"
			/>
			<h1 className="font-bold text-3xl">Snap Origami</h1>
			<h3 className="font-thin text-sm">Making Origami easy.</h3>
		</div>
	);
}

export default Header;
