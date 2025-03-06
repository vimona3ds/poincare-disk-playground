import PoincareDisk from "./PoincareDisk";
import { HyperbolicPoint } from "./types";

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    const infoElement = document.getElementById('info');

    // Set canvas dimensions to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // black background
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Create update info callback
    const updateInfo = (info: string) => {
        if (infoElement) {
            infoElement.innerHTML = info;
        }
    };

    const poincareDisk = new PoincareDisk(canvas, context, updateInfo);
    // 30 fps request animation frame
    const animate = () => {
        poincareDisk.draw();
        requestAnimationFrame(animate);
    }

    animate();
});
