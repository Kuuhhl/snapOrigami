import Resemble from "resemblejs";

export default async function compareImages(image1, image2) {
	const diff = await new Promise((resolve) => {
		Resemble(image1)
			.compareTo(image2)
			.scaleToSameSize()
			.ignoreAntialiasing()
			.ignoreColors()
			.onComplete((data) => {
				resolve(data);
			});
	});
	return diff;
}
