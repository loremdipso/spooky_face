import * as faceapi from "face-api.js";
import { DEBUG, drawPoint, drawRect, Point, Rect } from "./utils";

export class Game {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	spookyImage: HTMLImageElement;
	nose: Point;

	// =============== API ===============
	constructor(private siblingEl: Element) {
		this.canvas = document.createElement("canvas");
		this.context = this.canvas.getContext("2d");
		this.siblingEl.parentElement.appendChild(this.canvas);

		// catches most vertical resizes (video play, for ex.)
		this.siblingEl.addEventListener("resize", () => { this.resizeCanvas(); });

		// catches rest of resize events
		window.addEventListener("resize", () => { this.resizeCanvas(); });

		this.resizeCanvas();
		this.loadImage();

		if (DEBUG) {
			this.canvas.style.backgroundColor = "rgba(0,255,0,0.2)";
		} else {
			this.canvas.style.backgroundColor = "transparent";
		}
	};

	private loadImage() {
		let image = document.createElement("img");
		image.src = `images/spooky.svg`
		image.onload = () => {
			this.spookyImage = image;
		};

		return { image: image, is_loaded: false };
	}

	public start() {
		// TODO: use the good animation frame stuff
		let lastUpdate = Date.now();

		// TODO: cap the framerate on this
		const cb = () => {
			let delta = Date.now() - lastUpdate;
			lastUpdate = Date.now();
			this.draw();
			window.requestAnimationFrame(cb);
		};
		window.requestAnimationFrame(cb);
	}

	public handleFace(
		bounds: Rect,
		landmarks: faceapi.FaceLandmarks68,
		expressions: faceapi.FaceExpressions
	) {
		this.nose = this.getCenter(landmarks.getNose());
	}

	private draw() {
		this.clear();

		if (this.spookyImage) {
			let canvasWidth = this.canvas.width;
			let canvasHeight = this.canvas.height;

			this.context.drawImage(this.spookyImage, 0, 0, canvasWidth, canvasHeight);

			let pupilRadius = 30;
			let eyeRadius = 80;

			// left eye
			this.drawEye({ xOffset: -165, yOffset: -135, eyeRadius, pupilRadius });

			// right eye
			this.drawEye({ xOffset: 140, yOffset: -100, eyeRadius, pupilRadius });
		}
	}

	private drawEye({ xOffset, yOffset, eyeRadius, pupilRadius }: { xOffset: number, yOffset: number, eyeRadius: number, pupilRadius: number }) {
		let canvasWidth = this.canvas.width;
		let canvasHeight = this.canvas.height;
		let imageWidth = this.spookyImage.width;
		let imageHeight = this.spookyImage.height;

		let scale = canvasHeight / imageHeight;
		pupilRadius *= scale;
		eyeRadius *= scale;

		let imageCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };

		let eyeCenter = {
			x: imageCenter.x + (xOffset * scale),
			y: imageCenter.y + (yOffset * scale)
		};

		let pupilCenter = { x: eyeCenter.x, y: eyeCenter.y };

		if (this.nose) {
			console.log(pupilRadius);
			let eyeSize = 2 * (eyeRadius - pupilRadius);

			// get delta from nose position to center of image, then scale it from
			// the image's dimensions into that of the usable eye space (eyeSize - pupilSize)
			let nosePosition = {
				x: ((this.nose.x - imageWidth / 2) / canvasWidth) * eyeSize,
				y: ((this.nose.y - imageHeight / 2) / canvasHeight) * eyeSize,
			};

			pupilCenter.x += nosePosition.x;
			pupilCenter.y += nosePosition.y;
		}


		// pupil
		if (DEBUG) {
			drawPoint(this.context, { x: eyeCenter.x, y: eyeCenter.y }, "rgba(255,0,0,0.8)", eyeRadius);
		}

		// eye
		drawPoint(this.context, { x: pupilCenter.x, y: pupilCenter.y }, "black", pupilRadius);

	}

	// =============== utils ===============
	private resizeCanvas() {
		this.canvas.width = this.siblingEl.clientWidth;
		this.canvas.height = this.siblingEl.clientHeight;
	}

	// =============== geometry ===============
	private getCenter(points: Point[]): Point {
		let center = { x: 0, y: 0 };
		for (let point of points) {
			center.x += point.x;
			center.y += point.y;
		}
		center.x /= points.length;
		center.y /= points.length;
		return center;
	}


	// =============== drawing ===============
	private clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
