import base64
from recognize import ImageComparer
import json
import os
from datetime import datetime
import uuid
from flask import Flask, request
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)


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
        print("Image 1 or 2 not given.")
        return {"error": "Image 1 or 2 not given."}, 400

    # Decode the base64 encoded image
    image_data = base64.b64decode(data["image1"].split(",")[1])
    image_data2 = base64.b64decode(data["image2"].split(",")[1])

    print("Decoding...")

    # Encode the binary data to base64
    image_data_base64 = base64.b64encode(image_data).decode("utf-8")
    image_data2_base64 = base64.b64encode(image_data2).decode("utf-8")

    print("Comparing...")
    # Compare images and get the score
    comparer = ImageComparer(
        img1_base64=image_data_base64, img2_base64=image_data2_base64
    )
    comparer.compare_images()
    score = comparer.score

    print("Sending back score...\n")
    # Send back the score
    return {"score": score}, 200


if __name__ == "__main__":
    app.run(port=5000)
