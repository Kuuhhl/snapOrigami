import { Link } from "react-router-dom";
function MainMenuLink() {
	return (
		<Link className="underline p-2 hover:translate-y-1 transition" to={"/"}>
			Back to Main Menu
		</Link>
	);
}
export default MainMenuLink;
