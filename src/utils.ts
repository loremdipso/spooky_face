export const DEBUG = false;

export interface Point {
	x: number,
	y: number,
}

export interface Rect {
	x: number,
	y: number,
	height: number,
	width: number,
}

export function getDistance(p1: Point, p2: Point): number {
	return Math.sqrt(((p2.x - p1.x) ** 2) + ((p2.y - p1.y) ** 2));
}

export function drawPoint(context: CanvasRenderingContext2D, center: Point, color: string, radius: number) {
	context.save();
	context.beginPath();
	context.fillStyle = color;
	context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
	context.closePath();
	context.fill();
	context.restore();
}

export function drawRect(context: CanvasRenderingContext2D, rect: Rect, color: string, opacity: number = 1.0) {
	context.save();
	context.beginPath();
	context.globalAlpha = opacity;
	context.fillStyle = color;
	context.fillRect(rect.x, rect.y, rect.width, rect.height);
	context.closePath();
	context.fill();
	context.restore();
}
