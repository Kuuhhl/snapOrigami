function Footer() {
	return (
		<div
			className="flex items-center gap-5 text-white transition
		"
		>
			<a className="hover:text-blue-300" href="https://origami.guide/">
				origami.guide
			</a>
			|
			<a
				className="flex flex-col gap-1 items-center hover:text-blue-300"
				href="https://github.com/Kuuhhl/snapOrigami/"
			>
				GitHub Repository
			</a>
		</div>
	);
}
export default Footer;
