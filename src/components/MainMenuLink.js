import { Link } from "react-router-dom";
function MainMenuLink() {
	return (
		<Link className="bg-slate-300 rounded-xl p-2" to={"/"}>
			Back to Main Menu
		</Link>
	);
}
export default MainMenuLink;
