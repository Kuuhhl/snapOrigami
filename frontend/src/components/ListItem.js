import React from "react";
import { Link } from "react-router-dom";

function ListItem(props) {
	return (
		<Link to={"/instructions/" + props.uuid + "/1"}>
			<div className="flex flex-col gap-2 rounded-xl items-center p-4 bg-white/40 backdrop-filter backdrop-blur-sm hover:bg-white/50 transition duration-200">
				<img
					src={props.image}
					alt=""
					className="w-full h-full rounded-lg"
				/>
				<h1 className="font-bold text-xl">{props.title}</h1>
				<p className="font-thin text-sm">{props.difficulty}</p>
			</div>
		</Link>
	);
}

export default ListItem;
