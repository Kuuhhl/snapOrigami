function compareImages(image1Base64, image2Base64) {
	return new Promise((resolve, reject) => {
		if (!image1Base64 || !image2Base64) {
			reject("Missing image(s)");
			return;
		}

		const apiUrl = `${
			process.env.SNAP_ORIGAMI_BACKEND_BASE_URL || "localhost:5000"
		}/compareImages`;

		const images = {
			image1: image1Base64,
			image2: image2Base64,
		};

		fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(images),
		})
			.then((response) => response.json())
			.then((data) => resolve(data))
			.catch((err) => {
				console.error("Error:", err);
				reject(err);
			});
	});
}

export default compareImages;
