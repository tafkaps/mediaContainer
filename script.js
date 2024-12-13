const canvas = document.getElementById('drawingCanvas');
const info = document.getElementById('info');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = './img/ggb.jpeg'; // Path to the image

let isDrawing = false; // Tracks whether the user is currently drawing
let startX = 0, startY = 0, currentX = 0, currentY = 0; // Mouse coordinates
let drawnRect = null; // Stores the details of the drawn rectangle

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true; // Start drawing
  startX = e.offsetX; // Starting X position
  startY = e.offsetY; // Starting Y position
  drawnRect = null; // Reset any previous rectangle data

  // Hide the info box at the start of drawing
  info.style.display = 'none';
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    currentX = e.offsetX; // Current mouse X position
    currentY = e.offsetY; // Current mouse Y position

    // Clear the canvas to redraw the rectangle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the rectangle's position and size
    const rectX = Math.min(startX, currentX);
    const rectY = Math.min(startY, currentY);
    const rectWidth = Math.abs(currentX - startX);
    const rectHeight = Math.abs(currentY - startY);

    // Draw the original rectangle with a dashed line
    ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

    // Save the rectangle's data for later use
    drawnRect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
  }
});

canvas.addEventListener('mouseup', () => {
  if (!isDrawing || !drawnRect) return;

  isDrawing = false; // Stop drawing

  const { x: rectX, y: rectY, width: drawnWidth, height: drawnHeight } = drawnRect;

  let message = ""; // Message to display info about the rectangle
  const maxSide = 1440; // Maximum dimension for resizing
  const minRatio = 9 / 21; // Minimum aspect ratio
  const maxRatio = 21 / 9; // Maximum aspect ratio

  // Helper function to get aspect ratio as a fraction
  const getAspectRatioAsFraction = (width, height) => {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  let adjustedWidth = drawnWidth;
  let adjustedHeight = drawnHeight;

  if (drawnWidth > maxSide || drawnHeight > maxSide) {
    // Ultra mode: Adjust the rectangle if it exceeds the max dimensions
    const originalAspectRatioFraction = getAspectRatioAsFraction(drawnWidth, drawnHeight);
    let adjustedAspectRatioFraction = originalAspectRatioFraction;

    if ((drawnWidth / drawnHeight) < minRatio) {
      // Adjust to 9:21 aspect ratio
      adjustedWidth = Math.round(drawnHeight * minRatio);
      adjustedAspectRatioFraction = "9:21";
    } else if ((drawnWidth / drawnHeight) > maxRatio) {
      // Adjust to 21:9 aspect ratio
      adjustedHeight = Math.round(drawnWidth / maxRatio);
      adjustedAspectRatioFraction = "21:9";
    }

    message = `Ultra - ${drawnWidth}x${drawnHeight} - ${originalAspectRatioFraction}`;
    if (adjustedAspectRatioFraction !== originalAspectRatioFraction) {
      message += ` - ${adjustedAspectRatioFraction}`;
    }
  } else {
    // Pro mode: Round both dimensions to the nearest multiple of 32
    adjustedWidth = Math.ceil(drawnWidth / 32) * 32;
    adjustedHeight = Math.ceil(drawnHeight / 32) * 32;

    message = `PRO - ${drawnWidth}x${drawnHeight} - ${adjustedWidth}x${adjustedHeight}`;
  }

  // Calculate the position to center the adjusted rectangle
  const adjustedX = rectX + (drawnWidth - adjustedWidth) / 2;
  const adjustedY = rectY + (drawnHeight - adjustedHeight) / 2;

  // Helper function to draw a scaled and centered image within a clipping area
  const drawClippedImage = (image, clipX, clipY, clipWidth, clipHeight, containerX, containerY, containerWidth, containerHeight) => {
    const imgAspectRatio = image.width / image.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspectRatio > containerAspectRatio) {
      // Image is wider: Scale based on height
      drawHeight = containerHeight;
      drawWidth = containerHeight * imgAspectRatio;
    } else {
      // Image is taller: Scale based on width
      drawWidth = containerWidth;
      drawHeight = containerWidth / imgAspectRatio;
    }

    offsetX = containerX - (drawWidth - containerWidth) / 2;
    offsetY = containerY - (drawHeight - containerHeight) / 2;

    // Clip the drawing area and draw the image
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, clipWidth, clipHeight);
    ctx.clip();
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  };

  // Draw the "adjusted" rectangle with the image
  drawClippedImage(backgroundImage, adjustedX, adjustedY, adjustedWidth, adjustedHeight, adjustedX, adjustedY, adjustedWidth, adjustedHeight);

  // Add a darkening effect to the "adjusted" rectangle
  ctx.save();
  ctx.beginPath();
  ctx.rect(adjustedX, adjustedY, adjustedWidth, adjustedHeight);
  ctx.clip();
  ctx.fillStyle = 'rgba(82, 171, 152, .5)'; // Semi-transparent dark overlay
  ctx.fillRect(adjustedX, adjustedY, adjustedWidth, adjustedHeight);
  ctx.restore();

  // Draw the "original" rectangle with the image
  drawClippedImage(backgroundImage, rectX, rectY, drawnWidth, drawnHeight, adjustedX, adjustedY, adjustedWidth, adjustedHeight);

  // Draw the outline of the original rectangle last to ensure visibility
  ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rectX, rectY, drawnWidth, drawnHeight);

  // Display the information about the rectangle
  info.style.display = 'block';
  info.innerText = message;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false; // Stop drawing if the mouse leaves the canvas
});
