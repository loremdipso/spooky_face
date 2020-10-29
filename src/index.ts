import * as faceapi from "face-api.js";
import { Game } from "./game";


export async function init() {
	let messageEl = document.getElementById("message");
	insertLoadingText(messageEl);

	await Promise.all([
		faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
		faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
		faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
		faceapi.nets.faceExpressionNet.loadFromUri("./models"),
	]);

	let stream = null;
	try {
		stream = await navigator.mediaDevices.getUserMedia({
			video: true
		});
	} catch (e) {
		insertErrorText(messageEl, "Can't fetch your webcam :(");
		return;
	}
	messageEl.style.display = "none";

	const videoEl = document.getElementById('video') as HTMLVideoElement;
	videoEl.srcObject = stream;
	let videoCanvas: HTMLCanvasElement = null;
	let videoGroup = document.getElementsByClassName("videoGroup")[0];

	let game = new Game(videoEl);

	videoEl.addEventListener('play', () => {
		// ### Creating a Canvas Element from an Image or Video Element
		videoCanvas = faceapi.createCanvasFromMedia(videoEl);
		videoGroup.append(videoCanvas);
		game.start();

		let rect = videoEl.getBoundingClientRect();
		let displayValues = {
			width: 0,
			height: 0
		};

		const resize = () => {
			// ### Init configs
			rect = videoEl.getBoundingClientRect();
			displayValues = {
				width: rect.width,
				height: rect.height
			};

			// ### Resize media elements
			faceapi.matchDimensions(videoCanvas, displayValues)
		};

		resize();

		videoEl.addEventListener("resize", resize);
		window.addEventListener("resize", resize);


		setInterval(async () => {
			let detections =
				await faceapi.detectAllFaces(
					videoEl as any,
					new faceapi.TinyFaceDetectorOptions()
				)
					.withFaceLandmarks() // detect landmark
					.withFaceExpressions() // detect landmark
					.withFaceDescriptors(); // detect descriptor around face

			detections = faceapi.resizeResults(
				detections,
				displayValues
			);

			// ### Clear before picture
			videoCanvas
				.getContext('2d')
				.clearRect(0, 0, videoCanvas.width, videoCanvas.height)

			for (let i = 0; i < detections.length; i++) {
				game.handleFace(
					detections[i].detection.box,
					detections[i].landmarks,
					detections[i].expressions,
				);
			}

			// ### Drawing  in to VideoCanvas
			faceapi.draw.drawDetections(videoCanvas, detections);
		}, 100);
	})

}

function insertLoadingText(container: HTMLElement) {
	let text = "loading...";
	removeChildren(container);
	container.classList.add("loading");
	for (let letter of text) {
		let element = document.createElement("span");
		element.textContent = letter;
		element.classList.add("loading__letter");
		container.appendChild(element);
	}
}

function insertErrorText(container: HTMLElement, message: string) {
	removeChildren(container);
	container.classList.remove("loading");
	container.classList.add("error");
	removeChildren(container);
	container.textContent = message;
}

function removeChildren(container: HTMLElement) {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}


// TODO: remove
if (!(window as any).did_load) {
	(window as any).did_load = true;
	// TODO: can we make this a singleton?
	init();
}