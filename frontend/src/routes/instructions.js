import React, { useCallback, useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Link, useParams } from "react-router-dom";
import instructions from "../data/instructions.json";
import compareImages from "../utils/compareImages";
import MainMenuLink from "../components/MainMenuLink";

function Instructions() {
	const acceptanceThreshhold = 0.1;
	const [score, setScore] = useState(999.999);
	const [WebcamImgBase64, setWebcamImgBase64] = useState(null);
	const [accepted, setAccepted] = useState(false);
	const [acceptanceCounter, setAcceptanceCounter] = useState(0);

	const [referenceImageDimensions, setReferenceImageDimensions] = useState({
		height: 0,
		width: 0,
	});
	const webcamRef = useRef(null);

	const takeScreenshot = useCallback(() => {
		const imageBase64 = webcamRef.current.getScreenshot({
			width: referenceImageDimensions.width / 10,
			height: referenceImageDimensions.height / 10,
			screenshotFormat: "image/png",
			screenshotQuality: 0.2,
		});
		setWebcamImgBase64(imageBase64);
	}, []);

	const { instructionUUID, currentStep } = useParams();
	const [referenceImgBase64, setReferenceImgBase64] = useState();
	// Find instruction with specific id
	const selectedInstruction = instructions.find(
		(instruction) => instruction.uuid === instructionUUID
	);

	// every webcam frame
	useEffect(() => {
		const intervalId = setInterval(() => {
			takeScreenshot();
		}, 50);

		return () => {
			clearInterval(intervalId);
		};
	}, [takeScreenshot]);

	// update acceptance counter / accepted
	useEffect(() => {
		if (score && score <= acceptanceThreshhold) {
			setAcceptanceCounter((prevCounter) => prevCounter + 1);
			// 1 second
			if (acceptanceCounter >= 20) {
				setAccepted(true);
			}
		} else {
			setAcceptanceCounter(0);
			setAccepted(false);
		}
	}, [score]);

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
			{accepted && (
				<h1 className="text-4xl font-bold text-green-400">Accepted!</h1>
			)}
			{acceptanceCounter >= 1 && !accepted && (
				<h1 className="text-4xl font-bold text-yellow-400">
					Verifying...
				</h1>
			)}
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
					className="w-full h-full object-cover"
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
						<b>{"Threshold: " + acceptanceThreshhold}</b>
						<b>
							{"Acceptance Counter: " +
								acceptanceCounter +
								" seconds"}
						</b>
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
