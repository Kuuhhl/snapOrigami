import React, { useState } from "react";
import ListItem from "../components/ListItem";
import instructions from "../data/instructions.json";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Root() {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredInstructions = instructions.filter((item) =>
		item.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="p-4 bg-gradient-to-b from-blue-600 to-blue-900">
			<div className="flex flex-col gap-4 items-center">
				<Header />
				<input
					type="text"
					placeholder="Search by name"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none md:w-1/2"
				/>
				{filteredInstructions.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{filteredInstructions.map((item, index) => (
							<ListItem
								key={item.uuid}
								uuid={item.uuid}
								image={
									item.steps[item.steps.length - 1].image_link
								}
								title={item.name}
								difficulty={item.difficulty}
							/>
						))}
					</div>
				) : (
					<p>No results for {searchTerm}.</p>
				)}
				<Footer />
			</div>
		</div>
	);
}

export default Root;
