import cv2
import imutils
import numpy
import base64
import time


class UnclearContourException(Exception):
    def __init__(self, message="One of the images did not have a clear contour."):
        self.message = message
        super().__init__(self.message)


class ImageComparer:
    def __init__(
        self, img1_path=None, img2_path=None, img1_base64=None, img2_base64=None
    ):
        self.img1_path = img1_path
        self.img2_path = img2_path
        self.img1_base64 = img1_base64
        self.img2_base64 = img2_base64
        self.img1 = None
        self.img2 = None
        self.contour1 = None
        self.contour2 = None
        self.overlay = None
        self.score = None

    def compare_images(self):
        self.load_images()
        self.get_contours()
        self.draw_contours()
        self.compute_contour_difference_score()

    def load_images(self):
        # load from file
        if self.img1_path is not None and self.img2_path is not None:
            self.img1 = cv2.imread(self.img1_path)
            self.img2 = cv2.imread(self.img2_path)
        # load from base64
        elif self.img1_base64 is not None and self.img2_base64 is not None:
            self.img1 = cv2.imdecode(
                numpy.frombuffer(base64.b64decode(self.img1_base64), numpy.uint8),
                cv2.IMREAD_COLOR,
            )
            self.img2 = cv2.imdecode(
                numpy.frombuffer(base64.b64decode(self.img2_base64), numpy.uint8),
                cv2.IMREAD_COLOR,
            )

        # resize images to 500 pixel width
        self.img1 = imutils.resize(self.img1, width=1000)
        self.img2 = imutils.resize(self.img2, width=1000)

    def get_contours(self):
        self.contour1 = self.get_contour(self.img1)
        self.contour2 = self.get_contour(self.img2)

    def draw_contours(self):
        if self.contour1 is not None:
            cv2.drawContours(
                self.img1, [self.contour1], -1, (0, 255, 0), 3
            )  # Draw contour1 in green
        if self.contour2 is not None:
            cv2.drawContours(
                self.img2, [self.contour2], -1, (0, 0, 255), 3
            )  # Draw contour2 in red

    def overlay_images(self):
        # Resize image1 to image2 width while maintaining aspect ratio
        self.img1 = imutils.resize(self.img1, width=self.img2.shape[1])

        # Crop image1 height so that it has the same dimensions as image2
        if self.img1.shape[0] > self.img2.shape[0]:
            self.img1 = self.img1[: self.img2.shape[0], :]
        self.overlay = cv2.addWeighted(self.img1, 0.5, self.img2, 0.5, 0)

        # overlay score on the image
        if self.score is not None:
            cv2.putText(
                self.overlay,
                "Score: " + str(self.score),
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 0),
                2,
                cv2.LINE_AA,
            )

    def compute_contour_difference_score(self):
        if self.contour1 is not None and self.contour2 is not None:
            self.score = self.contour_difference(self.contour1, self.contour2)
            return
        raise UnclearContourException()

    @staticmethod
    def get_contour(img):
        # Convert the image to grayscale
        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply blur
        img_blur = cv2.blur(img_gray, (10, 10))

        # Apply adaptive thresholding
        _, thresh = cv2.threshold(img_blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # sort contours by area in descending order
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        # get the largest contour
        for contour in contours:
            # get the bounding rectangle of the contour
            x, y, w, h = cv2.boundingRect(contour)

            # check if the contour is the border of the image
            if x == 0 and y == 0 and w == img.shape[1] and h == img.shape[0]:
                continue  # this contour is the border of the image, so skip it

            # approximate the contour
            peri = cv2.arcLength(contour, True)
            approx_contour = cv2.approxPolyDP(contour, 0.01 * peri, True)

            return approx_contour

        return None

    @staticmethod
    def contour_difference(contour1, contour2):
        # compute the Hu Moments similarity score
        return cv2.matchShapes(contour1, contour2, cv2.CONTOURS_MATCH_I1, 0.0)


# testing contour code with webcam
if __name__ == "__main__":
    while True:
        # Open the webcam
        cap = cv2.VideoCapture(0)

        # Check if the webcam is opened correctly
        if not cap.isOpened():
            raise IOError("Cannot open webcam")

        print("Webcam opened successfully")

        # Capture a frame from the webcam
        ret, frame = cap.read()

        # Create an ImageComparer object
        comparer = ImageComparer()

        # Get the contour of the captured frame
        contour = comparer.get_contour(frame)

        # Draw the contour on the frame
        if contour is not None:
            cv2.drawContours(frame, [contour], -1, (0, 255, 0), 3)

        # Save the frame with the drawn contour
        cv2.imwrite("output.png", frame)

        # Close the webcam
        cap.release()

        time.sleep(1)
