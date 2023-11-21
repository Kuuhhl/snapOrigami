import React, { useCallback, useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Link, useParams } from "react-router-dom";
import instructions from "../data/instructions.json";
import compareImages from "../utils/compareImages";
import MainMenuLink from "../components/MainMenuLink";
import classNames from "classnames";
import { PuffLoader } from "react-spinners";

function Instructions() {
	const [webcamLoaded, setWebcamLoaded] = useState(false);
	const [backendIsOnline, setBackendIsOnline] = useState(false);
	const [acceptanceThreshhold, setAcceptanceThreshold] = useState(0.05);
	const [score, setScore] = useState(999.999);
	const [WebcamImgBase64, setWebcamImgBase64] = useState(null);
	const [accepted, setAccepted] = useState(false);
	const [acceptanceCounter, setAcceptanceCounter] = useState(0);

	const [referenceImageDimensions, setReferenceImageDimensions] = useState({
		height: 0,
		width: 0,
	});
	const webcamRef = useRef(null);
	const checkBackend = useCallback(() => {
		fetch(
			`${
				process.env.SNAP_ORIGAMI_BACKEND_BASE_URL || "localhost:5000"
			}/ping`
		)
			.then((response) => {
				if (!response.ok) {
					setBackendIsOnline(false);
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				setBackendIsOnline(true);
			})
			.catch((error) => {
				setBackendIsOnline(false);
			});
	}, []);

	useEffect(() => {
		checkBackend();
	}, [checkBackend]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "+") {
				setAcceptanceThreshold((prevThreshold) =>
					parseFloat((prevThreshold + 0.01).toFixed(2))
				);
			} else if (event.key === "-") {
				setAcceptanceThreshold((prevThreshold) => {
					if (prevThreshold > 0.01) {
						return parseFloat((prevThreshold - 0.01).toFixed(2));
					}
					return prevThreshold;
				});
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
	useEffect(() => {
		if (webcamRef.current && webcamRef.current.video) {
			const video = webcamRef.current.video;
			const handleLoadedData = () => {
				setWebcamLoaded(true);
			};
			video.addEventListener("loadeddata", handleLoadedData);
			return () => {
				video.removeEventListener("loadeddata", handleLoadedData);
			};
		}
	}, [webcamRef]);

	const takeScreenshot = useCallback(() => {
		const imageBase64 = webcamRef.current.getScreenshot({
			width: referenceImageDimensions.width / 10,
			height: referenceImageDimensions.height / 10,
			screenshotFormat: "image/png",
			screenshotQuality: 0.2,
		});
		setWebcamImgBase64(imageBase64);
	}, [referenceImageDimensions.height, referenceImageDimensions.width]);

	const { instructionUUID, currentStep } = useParams();
	const [referenceImgBase64, setReferenceImgBase64] = useState();
	// Find instruction with specific id
	const selectedInstruction = instructions.find(
		(instruction) => instruction.uuid === instructionUUID
	);

	// every webcam frame
	useEffect(() => {
		if (!backendIsOnline) {
			return;
		}
		const intervalId = setInterval(() => {
			takeScreenshot();
		}, 50);

		return () => {
			clearInterval(intervalId);
		};
	}, [takeScreenshot, backendIsOnline]);

	// update acceptance counter / accepted
	useEffect(() => {
		if (!backendIsOnline) {
			return;
		}
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
	}, [score, acceptanceCounter, backendIsOnline, acceptanceThreshhold]);

	// every webcam frame
	useEffect(() => {
		if (!webcamLoaded || !WebcamImgBase64 || !referenceImgBase64) {
			return;
		}
		compareImages(WebcamImgBase64, referenceImgBase64)
			.then((data) => {
				setScore(data.score);
			})
			.catch((error) => {
				// ignore missing images error
				if (error === "Missing image(s)") {
					return;
				}

				// show other errors
				console.error(error);
			});
	}, [WebcamImgBase64, referenceImgBase64, webcamLoaded]);

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
		<>
			{!webcamLoaded && (
				<div className="flex flex-col h-screen gap-3 items-center p-4 bg-gradient-to-b from-blue-600 to-blue-900 text-white">
					<div
						style={{
							width: referenceImageDimensions.width,
							height: referenceImageDimensions.height,
						}}
						className="w-full h-full bg-gray-300 animate-pulse rounded-md text-center justify-center flex items-center flex-col gap-3"
					>
						<PuffLoader color="white" />
						<p className="text-2xl">Waiting for webcam...</p>
					</div>
				</div>
			)}
			<div
				className={classNames(
					"flex flex-col h-screen gap-3 items-center p-4 bg-gradient-to-b from-blue-600 to-blue-900 text-white",
					{ hidden: !webcamLoaded }
				)}
			>
				<MainMenuLink />
				{accepted && (
					<h1 className="text-4xl font-bold text-green-400">
						Accepted!
					</h1>
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
						className="w-full h-full object-cover rounded-md"
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
							{backendIsOnline ? (
								<>
									<b>
										Recognizing Completion of Step{" "}
										{currentStep}
										...
									</b>
									<b>{"Score: " + score}</b>
									<b>
										{"Threshold: " + acceptanceThreshhold}
									</b>
									{acceptanceCounter > 0 && (
										<b>
											{"Acceptance Counter: " +
												acceptanceCounter +
												" frames"}
										</b>
									)}
								</>
							) : (
								<span className="font-bold">Offline Mode</span>
							)}
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
							className="w-24 rounded-xl"
						/>
						<div className="flex flex-col gap-2">
							<h1 className="text-xl font-bold">
								Step {currentStep}
							</h1>
							<div>
								{
									selectedInstruction.steps[currentStep - 1]
										.desc
								}
							</div>
						</div>
					</div>
				</div>
				{selectedInstruction.steps.length > currentStep ? (
					<Link
						to={`/instructions/${instructionUUID}/${
							Number.parseInt(currentStep) + 1
						}`}
						className="bg-white/20 backdrop-filter backdrop-blur-sm p-4 rounded-xl hover:bg-white/30 transition-all"
					>
						{backendIsOnline ? "Continue manually" : "Continue"}
					</Link>
				) : (
					<MainMenuLink />
				)}
			</div>
		</>
	);
}

export default Instructions;
