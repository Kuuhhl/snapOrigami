import React, { useCallback, useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Link, useParams } from "react-router-dom";
import instructions from "../data/instructions.json";
import compareImages from "../utils/compareImages";
import MainMenuLink from "../components/MainMenuLink";

function Instructions() {
	const [misMatchPercentage, setMismatchPercentage] = useState(100.0);
	const [img, setImg] = useState(null);
	const [referenceImageDimensions, setReferenceImageDimensions] = useState(
		{}
	);
	const webcamRef = useRef(null);

	const takeScreenshot = useCallback(() => {
		const imageBase64 = webcamRef.current.getScreenshot();
		setImg(imageBase64);
	}, []);

	const { instructionUUID, currentStep } = useParams();

	// Find instruction with specific id
	const selectedInstruction = instructions.find(
		(instruction) => instruction.uuid === instructionUUID
	);

	useEffect(() => {
		const intervalId = setInterval(() => {
			takeScreenshot();
		}, 200);

		return () => {
			clearInterval(intervalId);
		};
	}, [takeScreenshot]);

	useEffect(() => {
		// skip if no image
		if (!img) {
			return;
		}

		compareImages(
			img,
			process.env.PUBLIC_URL +
				"/images/" +
				instructionUUID +
				"/" +
				currentStep
		).then((diff) => {
			setMismatchPercentage(diff.misMatchPercentage);
		});
	}, [img, currentStep, instructionUUID]);

	useEffect(() => {
		const mismatchThreshold = 75.0;
		if (misMatchPercentage <= mismatchThreshold) {
			// go to next step
			window.location.href = `/instructions/${instructionUUID}/${
				Number.parseInt(currentStep) + 1
			}`;
		}
	});
	useEffect(() => {
		const setImageSize = (setReferenceImageDimensions) => {
			const img = new Image();
			img.src =
				process.env.PUBLIC_URL +
				"/images/" +
				instructionUUID +
				"/" +
				currentStep;
			img.onload = () => {
				setReferenceImageDimensions({
					height: img.height,
					width: img.width,
				});
			};
		};
		setImageSize(setReferenceImageDimensions);
	}, [currentStep, instructionUUID]);

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
						<b>{"Mismatch percentage: " + misMatchPercentage}</b>
						<b>{"Threshold: 75.0"}</b>
					</div>
				</div>

				{/* Image Overlay */}
				<img
					src={
						process.env.PUBLIC_URL +
						"/images/" +
						instructionUUID +
						"/" +
						currentStep
					}
					alt={"Image Overlay of step" + currentStep}
					className="absolute inset-0 object-cover w-full h-full mix-blend-multiply opacity-50"
				></img>

				<div className="absolute inset-x-0 bottom-0 flex w-full gap-5 rounded-xl items-center p-4 bg-white/40 backdrop-filter backdrop-blur-sm">
					<img
						src={
							process.env.PUBLIC_URL +
							"/images/" +
							instructionUUID +
							"/" +
							currentStep
						}
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
