import PoincareDisk from "./PoincareDisk";
import { HyperbolicPoint, Mode } from "./types";

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    const infoElement = document.getElementById('info');
    const modeInstructions = document.getElementById('mode-instructions');

    // Set canvas dimensions to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // black background
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const modeInstructionsMap: Record<Mode, string> = {
        "Select": `Select Mode:
• Click points to select them
• Press <span class="keyboard-shortcut">T</span> to switch to Translate mode
• Press <span class="keyboard-shortcut">A</span> to switch to Add mode
• Press <span class="keyboard-shortcut">Delete</span> to remove selected points`,
        "Translate": `Translate Mode:
• Click and drag selected points to move them
• Press <span class="keyboard-shortcut">S</span> to switch to Select mode
• Press <span class="keyboard-shortcut">A</span> to switch to Add mode
• Press <span class="keyboard-shortcut">Esc</span> to cancel translation`,
        "Add": `Add Mode:
• Click anywhere to add new points
• Click two points to create a line between them
• Press <span class="keyboard-shortcut">S</span> to switch to Select mode
• Press <span class="keyboard-shortcut">T</span> to switch to Translate mode
• Press <span class="keyboard-shortcut">Esc</span> to cancel line creation`
    };

    // Create update info callback
    const updateInfo = (info: string) => {
        if (infoElement) {
            const mode = info.split(": ")[1] as Mode;
            const titleElement = infoElement.querySelector('.mode-title');
            if (titleElement) {
                titleElement.textContent = `Mode: ${mode}`;
            }
            if (modeInstructions && mode in modeInstructionsMap) {
                modeInstructions.innerHTML = modeInstructionsMap[mode];
            }
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
