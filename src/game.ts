import * as faceapi from "face-api.js";
import { DEBUG, drawPoint, drawRect, Point, Rect, RED_EYES_DURATION } from "./utils";


interface IEyeLocation extends Point {
	radius: number;
}

interface IEyeConfig {
	xOffset: number,
	yOffset: number,
	includeOffset: boolean
}

export class Game {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	spookyImage: HTMLImageElement;

	leftEyePosition: IEyeLocation;
	rightEyePosition: IEyeLocation;

	rightEyeTarget: IEyeLocation;
	leftEyeTarget: IEyeLocation;

	nose: Point;
	timeOfLastKnownNose: number = 0;

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

		this.canvas.classList.add("spooky");
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
			this.setupEyes();
		};
	}

	public start() {
		let lastUpdate = Date.now();

		// TODO: cap the framerate on this
		const cb = () => {
			let delta = Date.now() - lastUpdate;
			lastUpdate = Date.now();
			this.update(delta);
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
		this.timeOfLastKnownNose = Date.now();
	}

	private update(delta: number) {
		this.moveEyeTowardsPoint(delta, this.leftEyePosition, this.leftEyeTarget);
		this.moveEyeTowardsPoint(delta, this.rightEyePosition, this.rightEyeTarget);
	}

	private moveEyeTowardsPoint(delta: number, eyePosition: IEyeLocation, target: IEyeLocation) {
		let velocity = 1;
		let dx = target.x - eyePosition.x;
		let dy = target.y - eyePosition.y;

		// NOTE: this way of calculating x/y velocity is a little problematic
		// when we're already there. It ends up shaking the eyes. Which normally I'd remove,
		// but it actually looks quite spooky, so I'm keeping it in.

		let angle = Math.atan2(dy, dx);
		let xVelocity = velocity * Math.cos(angle);
		let yVelocity = velocity * Math.sin(angle);


		eyePosition.x += xVelocity;
		eyePosition.y += yVelocity;
	}

	private draw() {
		this.clear();

		if (this.spookyImage) {
			let canvasWidth = this.canvas.width;
			let canvasHeight = this.canvas.height;

			this.context.drawImage(this.spookyImage, 0, 0, canvasWidth, canvasHeight);

			this.drawEye(this.leftEyePosition);
			this.drawEye(this.rightEyePosition);

			this.leftEyeTarget = this.findEyeTarget(this.getLeftEyeConfig(true));
			this.rightEyeTarget = this.findEyeTarget(this.getRightEyeConfig(true));
		}
	}

	private getLeftEyeConfig(includeOffset: boolean): IEyeConfig {
		return { xOffset: -165, yOffset: -135, includeOffset };
	}

	private getRightEyeConfig(includeOffset: boolean): IEyeConfig {
		return { xOffset: 140, yOffset: -100, includeOffset };
	}

	private drawEye(position: IEyeLocation) {
		let color = "black";
		if (Date.now() - this.timeOfLastKnownNose < RED_EYES_DURATION) {
			color = "red";
		}
		drawPoint(this.context, position, color, position.radius);
	}

	private findEyeTarget({
		xOffset,
		yOffset,
		includeOffset
	}: IEyeConfig): IEyeLocation {
		let pupilRadius = 30;
		let eyeRadius = 80;
		let canvasWidth = this.canvas.width;
		let canvasHeight = this.canvas.height;
		let imageWidth = this.spookyImage.width;
		let imageHeight = this.spookyImage.height;

		let scale = 0;
		let imageRatio = imageHeight / imageWidth;
		let canvasRatio = canvasHeight / canvasWidth;

		if (imageRatio > canvasRatio) {
			scale = canvasHeight / imageHeight;
		} else {
			scale = canvasWidth / imageWidth;
		}

		pupilRadius *= scale;
		eyeRadius *= scale;

		let imageCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };

		let eyeCenter = {
			x: imageCenter.x + (xOffset * scale),
			y: imageCenter.y + (yOffset * scale)
		};

		let pupilCenter = { x: eyeCenter.x, y: eyeCenter.y };

		if (this.nose && includeOffset) {
			let eyeSize = 2 * (eyeRadius - pupilRadius);

			// get delta from nose position to center of image, then scale it from
			// the image's dimensions into that of the usable eye space (eyeSize - pupilSize)
			let nosePosition = {
				x: ((this.nose.x - canvasWidth / 2) / canvasWidth) * eyeSize,
				y: ((this.nose.y - canvasHeight / 2) / canvasHeight) * eyeSize,
			};

			pupilCenter.y += nosePosition.y;

			// subtracting here to invert, because of how cameras work
			pupilCenter.x -= nosePosition.x;
		}

		// pupil
		if (DEBUG) {
			drawPoint(this.context, { x: eyeCenter.x, y: eyeCenter.y }, "rgba(255,0,0,0.8)", eyeRadius);
		}

		// eye
		return {
			x: pupilCenter.x,
			y: pupilCenter.y,
			radius: pupilRadius
		};
	}

	// =============== utils ===============
	private resizeCanvas() {
		this.canvas.width = this.siblingEl.clientWidth;
		this.canvas.height = this.siblingEl.clientHeight;

		this.setupEyes();
	}

	private setupEyes() {
		if (this.spookyImage) {
			this.leftEyePosition = this.findEyeTarget(this.getLeftEyeConfig(false));
			this.rightEyePosition = this.findEyeTarget(this.getRightEyeConfig(false));

			this.leftEyeTarget = this.findEyeTarget(this.getLeftEyeConfig(false));
			this.rightEyeTarget = this.findEyeTarget(this.getRightEyeConfig(false));
		}
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
