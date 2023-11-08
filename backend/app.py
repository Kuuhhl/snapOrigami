import base64
import sys
from recognize import ImageComparer
import json
import os
from datetime import datetime
import logging
import uuid
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)


@socketio.on("compareImages")
def handle_image(data):
    # check if data has keys image1 and image2
    if "image1" not in data or "image2" not in data:
        return

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
    comparer.compare_images()
    score = comparer.score

    # Send back the score
    emit("compareResult", {"score": score})


if __name__ == "__main__":
    socketio.run(app, allow_unsafe_werkzeug=True, port=5000)
