import base64
from recognize import ImageComparer, UnclearContourException
from flask import Flask, request
from flask_cors import CORS
import logging

app = Flask(__name__)

# Allow CORS
CORS(app)


# stop console getting spammed with logs
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)


# ping for online check endpoint
@app.route("/ping", methods=["GET"])
def pong():
    return {"message": "pong"}, 200


# endpoint for comparing image contour shapes
@app.route("/compareImages", methods=["POST"])
def handle_image():
    data = request.get_json()

    # check if data has keys image1 and image2
    if (
        "image1" not in data
        or "image2" not in data
        or data["image1"] is None
        or data["image2"] is None
    ):
        return {"error": "Image 1 or 2 not given."}, 400

    # Decode the base64 encoded image
    image_data = base64.b64decode(data["image1"].split(",")[1])
    image_data2 = base64.b64decode(data["image2"].split(",")[1])

    # Encode the binary data to base64
    image_data_base64 = base64.b64encode(image_data).decode("utf-8")
    image_data2_base64 = base64.b64encode(image_data2).decode("utf-8")

    # Compare images and get the score
    comparer = ImageComparer(
        img1_base64=image_data_base64, img2_base64=image_data2_base64
    )

    # try to compare the images
    try:
        comparer.compare_images()
    except UnclearContourException:
        return {"error": "One of the images did not have a clear contour."}, 400

    # Get the score
    score = comparer.score

    # Send back the score
    return {"score": score}, 200


if __name__ == "__main__":
    port = 5000
    print(f"Running on port {port}")
    app.run(port=port)
