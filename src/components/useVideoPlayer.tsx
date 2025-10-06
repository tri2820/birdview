import { createSignal, createEffect, Show } from "solid-js";
import { createElementSize } from "@solid-primitives/resize-observer";
import { BsCloudSlashFill } from "solid-icons/bs";

export default function useVideoPlayer(props?: { fit: "contain" | "cover" }) {
  const fit = () => props?.fit || "contain";

  const [empty, setEmpty] = createSignal(true);
  const [imageBuffer, setImageBuffer] = createSignal<ArrayBuffer>();
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const [codecpar, setCodecpar] = createSignal<{
    width: number;
    height: number;
  }>({
    width: 640,
    height: 480,
  });

  // Reactively get the size of the container element
  const containerSize = createElementSize(containerRef);

  // Effect to resize the canvas's drawing surface to match its container
  createEffect(() => {
    const canvas = canvasRef();
    if (!canvas || !containerSize.width || !containerSize.height) return;

    // This sets the actual number of pixels the canvas has
    canvas.width = containerSize.width;
    canvas.height = containerSize.height;
  });

  // Effect to draw the image buffer onto the canvas
  createEffect(async () => {
    const buffer = imageBuffer();
    const canvas = canvasRef();
    const { width: sourceWidth, height: sourceHeight } = codecpar();

    // Exit if we don't have everything we need
    if (!buffer || !canvas || !canvas.width || !sourceWidth) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: canvasWidth, height: canvasHeight } = canvas;

    // --- Start of Scaling Logic ---

    const sourceAspectRatio = sourceWidth / sourceHeight;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let destWidth = 0;
    let destHeight = 0;
    let destX = 0;
    let destY = 0;

    if (fit() === "cover") {
      if (canvasAspectRatio > sourceAspectRatio) {
        // Canvas is wider than the source, so we match the width and clip vertically
        destWidth = canvasWidth;
        destHeight = destWidth / sourceAspectRatio;
        destY = (canvasHeight - destHeight) / 2; // This will be negative
      } else {
        // Canvas is taller than or same as the source, so we match the height and clip horizontally
        destHeight = canvasHeight;
        destWidth = destHeight * sourceAspectRatio;
        destX = (canvasWidth - destWidth) / 2; // This will be negative
      }
    } else {
      // Default "contain" logic
      if (canvasAspectRatio > sourceAspectRatio) {
        // Canvas is wider than the image (letterbox top/bottom)
        destHeight = canvasHeight;
        destWidth = destHeight * sourceAspectRatio;
      } else {
        // Canvas is taller than or same ratio as the image (pillarbox left/right)
        destWidth = canvasWidth;
        destHeight = destWidth / sourceAspectRatio;
      }
      // Calculate the centered position for "contain"
      destX = (canvasWidth - destWidth) / 2;
      destY = (canvasHeight - destHeight) / 2;
    }

    // --- End of Scaling Logic ---

    // Create the image from the buffer
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const bitmap = await createImageBitmap(blob);

    // 1. Clear the canvas and fill with black for the "bars" (only visible in "contain" mode)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw the image with the calculated dimensions and position
    ctx.drawImage(bitmap, destX, destY, destWidth, destHeight);

    // 3. Free up memory
    bitmap.close();
  });

  return {
    setEmpty,
    setCodecpar,
    setImageBuffer,
    component: () => {
      return (
        // This container defines the bounds for the canvas.
        <div class="flex-1 w-full  h-full relative" ref={setContainerRef}>

          <canvas
            data-empty={empty()}
            // The canvas is stretched to fill the container by absolute positioning
            class="absolute top-0 left-0 data-[empty=true]:opacity-0"
            ref={setCanvasRef}
          />

          <Show when={empty()}>
            <div class="absolute top-0 left-0 bottom-0 right-0 bg-neutral-800">
              <div class="flex items-center justify-center h-full w-full">
                <BsCloudSlashFill class="w-16 h-16 text-neutral-600" />
              </div>
            </div>
          </Show>
        </div>
      );
    },
  };
}
