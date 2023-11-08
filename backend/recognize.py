import cv2
import numpy
import base64
import time


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
        self.align_images_and_contours()
        self.draw_contours()
        self.overlay_images()
        self.compute_contour_difference_score()

    def load_images(self):
        if self.img1_path is not None and self.img2_path is not None:
            self.img1 = cv2.resize(cv2.imread(self.img1_path), (500, 500))
            self.img2 = cv2.resize(cv2.imread(self.img2_path), (500, 500))
        elif self.img1_base64 is not None and self.img2_base64 is not None:
            self.img1 = cv2.resize(
                cv2.imdecode(
                    numpy.frombuffer(base64.b64decode(self.img1_base64), numpy.uint8),
                    cv2.IMREAD_COLOR,
                ),
                (500, 500),
            )
            self.img2 = cv2.resize(
                cv2.imdecode(
                    numpy.frombuffer(base64.b64decode(self.img2_base64), numpy.uint8),
                    cv2.IMREAD_COLOR,
                ),
                (500, 500),
            )

    def get_contours(self):
        self.img1, self.contour1 = self.get_contour(self.img1)
        self.img2, self.contour2 = self.get_contour(self.img2)

    def align_images_and_contours(self):
        if self.contour1 is not None and self.contour2 is not None:
            (
                self.img1,
                self.img2,
                self.contour1,
                self.contour2,
            ) = self.align_images_and_contours_helper(
                self.img1, self.img2, self.contour1, self.contour2
            )

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
        self.overlay = cv2.addWeighted(self.img1, 0.5, self.img2, 0.5, 0)

    def compute_contour_difference_score(self):
        if self.contour1 is not None and self.contour2 is not None:
            self.score = self.contour_difference(self.contour1, self.contour2)
            print("Contour difference score:", self.score)
        else:
            print("No suitable contours found.")

    @staticmethod
    def align_images_and_contours_helper(img1, img2, contour1, contour2):
        # Compute the moments of the two contours
        M1 = cv2.moments(contour1)
        M2 = cv2.moments(contour2)

        # Calculate the centroid of each contour
        cx1 = int(M1["m10"] / M1["m00"])
        cy1 = int(M1["m01"] / M1["m00"])
        cx2 = int(M2["m10"] / M2["m00"])
        cy2 = int(M2["m01"] / M2["m00"])

        # Calculate the angle between the two centroids
        dY = cy2 - cy1
        dX = cx2 - cx1
        angle = numpy.arctan2(dY, dX) * 180 / numpy.pi

        # Rotate img2 to align the images
        M = cv2.getRotationMatrix2D((cx2, cy2), -angle, 1)
        img2 = cv2.warpAffine(img2, M, (img2.shape[1], img2.shape[0]))

        # Rotate contour2 to align the contours
        contour2 = cv2.transform(contour2, M)

        # Scale and move img2 and contour2 to match img1 and contour1
        scale = cv2.contourArea(contour1) / cv2.contourArea(contour2)
        M = numpy.float32(
            [[scale, 0, cx1 - cx2 * scale], [0, scale, cy1 - cy2 * scale]]
        )
        img2 = cv2.warpAffine(img2, M, (img2.shape[1], img2.shape[0]))
        contour2 = cv2.transform(contour2, M)

        return img1, img2, contour1, contour2

    @staticmethod
    def get_contour(img):
        # Convert the image to grayscale
        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply blur
        img_blur = cv2.blur(img_gray, (100, 100))

        # Apply adaptive thresholding
        _, thresh = cv2.threshold(img_blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # sort contours by area in descending order
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        # iterate over the contours
        for contour in contours:
            # get the bounding rectangle of the contour
            x, y, w, h = cv2.boundingRect(contour)

            # check if the contour is the border of the image
            if x == 0 and y == 0 and w == img.shape[1] and h == img.shape[0]:
                continue  # this contour is the border of the image, so skip it

            # approximate the contour
            epsilon = 0.005 * cv2.arcLength(contour, True)
            approx_contour = cv2.approxPolyDP(contour, epsilon, True)

            return img, approx_contour

        return img, None  # no suitable contour found

    @staticmethod
    def contour_difference(contour1, contour2):
        # compute the Hu Moments similarity score
        score = cv2.matchShapes(contour1, contour2, cv2.CONTOURS_MATCH_I1, 0.0)
        return score


# testing code with phone webcam
if __name__ == "__main__":
    while True:
        # Open the webcam
        cap = cv2.VideoCapture(0)

        # Check if the webcam is opened correctly
        if not cap.isOpened():
            raise IOError("Cannot open webcam")
        else:
            print("Webcam opened successfully")
        # Capture a frame from the webcam
        ret, frame = cap.read()

        # Create an ImageComparer object
        comparer = ImageComparer()

        # Get the contour of the captured frame
        _, contour = comparer.get_contour(frame)

        # Draw the contour on the frame
        if contour is not None:
            cv2.drawContours(frame, [contour], -1, (0, 255, 0), 3)

        # Save the frame with the drawn contour
        cv2.imwrite("output.png", frame)

        # Close the webcam
        cap.release()

        time.sleep(5)
