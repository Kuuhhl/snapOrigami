import io from "socket.io-client";

function compareImages(image1Base64, image2Base64) {
	return new Promise((resolve, reject) => {
		if (!image1Base64 || !image2Base64) {
			reject("Missing image(s)");
		}

		const apiUrl = "http://localhost:5000";

		const socket = io(apiUrl);

		const images = {
			image1: image1Base64,
			image2: image2Base64,
		};

		socket.emit("compareImages", images);

		socket.on("compareResult", function (data) {
			resolve(data);
		});

		socket.on("connect_error", function (err) {
			console.error("Error:", err);
			reject(err);
		});
	});
}

export default compareImages;
