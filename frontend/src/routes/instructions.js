import React, { useCallback, useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Link, useParams } from "react-router-dom";
import instructions from "../data/instructions.json";
import compareImages from "../utils/compareImages";
import MainMenuLink from "../components/MainMenuLink";

function Instructions() {
	const [score, setScore] = useState(0.0);
	const [WebcamImgBase64, setWebcamImgBase64] = useState(null);

	const [referenceImageDimensions, setReferenceImageDimensions] = useState({
		height: 0,
		width: 0,
	});
	const webcamRef = useRef(null);

	const takeScreenshot = useCallback(() => {
		const imageBase64 = webcamRef.current.getScreenshot();
		setWebcamImgBase64(imageBase64);
	}, []);

	const { instructionUUID, currentStep } = useParams();
	const [referenceImgBase64, setReferenceImgBase64] = useState();
	// Find instruction with specific id
	const selectedInstruction = instructions.find(
		(instruction) => instruction.uuid === instructionUUID
	);

	// every second
	useEffect(() => {
		const intervalId = setInterval(() => {
			takeScreenshot();
		}, 5000);

		return () => {
			clearInterval(intervalId);
		};
	}, [takeScreenshot]);

	// every webcam frame
	useEffect(() => {
		compareImages(WebcamImgBase64, referenceImgBase64)
			.then((data) => {
				setScore(data.score);
			})
			.catch((error) => {
				console.error(error);
			});
	}, [WebcamImgBase64, referenceImgBase64]);

	// every time mismatch percentage changes
	useEffect(() => {
		const scoreThreshold = 99999;
		if (score >= scoreThreshold) {
			// go to next step
			window.location.href = `/instructions/${instructionUUID}/${
				Number.parseInt(currentStep) + 1
			}`;
		}
	}, [score]);

	// get reference image base64
	useEffect(() => {
		fetch(
			process.env.PUBLIC_URL +
				"/images/" +
				instructionUUID +
				"/" +
				currentStep
		)
			.then((response) => response.blob())
			.then((blob) => {
				const reader = new FileReader();
				reader.readAsDataURL(blob);
				reader.onload = () => {
					setReferenceImgBase64(reader.result);
				};
			})
			.catch((error) => console.error(error));
	}, [currentStep, instructionUUID]);

	// update images dimensions
	useEffect(() => {
		const img = new Image();
		img.src = referenceImgBase64;
		img.onload = () => {
			setReferenceImageDimensions({
				height: img.height,
				width: img.width,
			});
		};
	}, [referenceImgBase64]);

	return (
		<div className="flex flex-col h-screen gap-3 items-center p-4 bg-gradient-to-b from-blue-600 to-blue-900 text-white">
			<MainMenuLink />
			<div className="relative">
				<Webcam
					imageSmoothing={true}
					audio={false}
					disablePictureInPicture={true}
					videoConstraints={{
						facingMode: "environment",
					}}
					ref={webcamRef}
					screenshotFormat="img/png"
					height={referenceImageDimensions.height}
					width={referenceImageDimensions.width}
				/>

				{/* Overlay Header */}
				<div className="p-2 absolute inset-x-0 top-0 w-100 flex flex-col md:flex-row gap-3 md:justify-between">
					{/*Title*/}
					<h1 className="font-bold text-4xl">
						{selectedInstruction
							? selectedInstruction.name
							: "Instruction not found"}
					</h1>

					{/* Stats Overlay  */}
					<div className="flex flex-col gap-1 md:text-right font-thin text-xs">
						<b>Recognizing Completion of Step {currentStep}...</b>
						<b>{"Score: " + score}</b>
						<b>{"Threshold: 100.0"}</b>
					</div>
				</div>

				{/* Image Overlay */}
				<img
					src={referenceImgBase64}
					alt={"Image Overlay of step" + currentStep}
					className="absolute inset-0 object-cover w-full h-full mix-blend-multiply opacity-50"
				></img>

				<div className="absolute inset-x-0 bottom-0 flex w-full gap-5 rounded-xl items-center p-4 bg-white/40 backdrop-filter backdrop-blur-sm">
					<img
						src={referenceImgBase64}
						alt={"Image of step " + currentStep}
						className="w-24  rounded-xl"
					/>
					<div className="flex flex-col gap-2">
						<h1 className="text-xl font-bold">
							Step {currentStep}
						</h1>
						<div>
							{selectedInstruction.steps[currentStep - 1].desc}
						</div>
					</div>
				</div>
			</div>

			{selectedInstruction.steps.length > currentStep ? (
				<Link
					to={`/instructions/${instructionUUID}/${
						Number.parseInt(currentStep) + 1
					}`}
				>
					Continue manually
				</Link>
			) : (
				<MainMenuLink />
			)}
		</div>
	);
}

export default Instructions;
