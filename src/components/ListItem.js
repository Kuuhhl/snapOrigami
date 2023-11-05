import React from "react";
import { Link } from "react-router-dom";

function ListItem(props) {
	return (
		<Link to={"/instructions/" + props.uuid + "/1"}>
			<div className="flex flex-col items-center p-4 bg-slate-300 rounded-lg hover:bg-slate-400 transition ">
				<img
					src={props.image}
					alt=""
					className="w-16 h-16 rounded-lg"
				/>
				<h1 className="mr-4 font-bold ">{props.title}</h1>
				<p className="font-thinner ">{props.difficulty}</p>
			</div>
		</Link>
	);
}

export default ListItem;
