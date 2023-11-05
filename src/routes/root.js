import React from "react";
import ListItem from "../components/ListItem";
import instructions from "../data/instructions.json";

function Root() {
	return (
		<div className="flex flex-col gap-4 m-2">
			{instructions.map((item, index) => (
				<ListItem
					key={item.uuid}
					uuid={item.uuid}
					image={item.steps[item.steps.length - 1].image_link}
					title={item.name}
					difficulty={item.difficulty}
				/>
			))}
		</div>
	);
}

export default Root;
