const canvas = document.getElementById('drawingCanvas');
const info = document.getElementById('info');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = './img/ggb.jpeg';

let isDrawing = false;
let startX = 0, startY = 0, currentX = 0, currentY = 0;
let drawnRect = null;

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
  drawnRect = null;
  info.style.display = 'none';
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    currentX = e.offsetX;
    currentY = e.offsetY;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rectX = Math.min(startX, currentX);
    const rectY = Math.min(startY, currentY);
    const rectWidth = Math.abs(currentX - startX);
    const rectHeight = Math.abs(currentY - startY);

    ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

    drawnRect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
  }
});

canvas.addEventListener('mouseup', () => {
  if (!isDrawing || !drawnRect) return;

  isDrawing = false;

  const { x: rectX, y: rectY, width: drawnWidth, height: drawnHeight } = drawnRect;

  const maxSide = 1440;
  const minRatio = 9 / 21;
  const maxRatio = 21 / 9;

  const getAspectRatioAsFraction = (width, height) => {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  let adjustedWidth = drawnWidth;
  let adjustedHeight = drawnHeight;
  let mode = "PRO";
  let aspectRatio = drawnWidth / drawnHeight;
  let aspectRatioFraction = getAspectRatioAsFraction(drawnWidth, drawnHeight);

  if (drawnWidth > maxSide || drawnHeight > maxSide) {
    if (aspectRatio >= minRatio && aspectRatio <= maxRatio) {
      // Ultra-Modus: Seitenverhältnis innerhalb des erlaubten Bereichs
      mode = "Ultra";
    } else {
      // Herunterskalieren auf Pro-Version
      if (drawnWidth > drawnHeight) {
        adjustedWidth = maxSide;
        adjustedHeight = Math.ceil((adjustedWidth / aspectRatio) / 32) * 32;
      } else {
        adjustedHeight = maxSide;
        adjustedWidth = Math.ceil((adjustedHeight * aspectRatio) / 32) * 32;
      }
      aspectRatioFraction = getAspectRatioAsFraction(adjustedWidth, adjustedHeight);
    }
  } else {
    // Pro-Modus für kleinere Rechtecke
    adjustedWidth = Math.ceil(drawnWidth / 32) * 32;
    adjustedHeight = Math.ceil(drawnHeight / 32) * 32;
  }

  // Berechne Zentrierung
  const adjustedX = rectX + (drawnWidth - adjustedWidth) / 2;
  const adjustedY = rectY + (drawnHeight - adjustedHeight) / 2;

  let message = `${mode} - ${drawnWidth}x${drawnHeight}`;
  if (mode === "PRO") {
    message += ` - ${adjustedWidth}x${adjustedHeight}`;
  } else {
    message += ` - ${aspectRatioFraction}`;
  }

  // Hilfsfunktion: Bild zeichnen
  const drawClippedImage = (image, clipX, clipY, clipWidth, clipHeight, containerX, containerY, containerWidth, containerHeight) => {
    const imgAspectRatio = image.width / image.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspectRatio > containerAspectRatio) {
      drawHeight = containerHeight;
      drawWidth = containerHeight * imgAspectRatio;
    } else {
      drawWidth = containerWidth;
      drawHeight = containerWidth / imgAspectRatio;
    }

    offsetX = containerX - (drawWidth - containerWidth) / 2;
    offsetY = containerY - (drawHeight - containerHeight) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, clipWidth, clipHeight);
    ctx.clip();
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  };

  // Bild für das "angepasste" Rechteck zeichnen
  drawClippedImage(backgroundImage, adjustedX, adjustedY, adjustedWidth, adjustedHeight, adjustedX, adjustedY, adjustedWidth, adjustedHeight);

  // Bild für das "originale" Rechteck zeichnen
  drawClippedImage(backgroundImage, rectX, rectY, drawnWidth, drawnHeight, adjustedX, adjustedY, adjustedWidth, adjustedHeight);

  // Rahmen zeichnen
  ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rectX, rectY, drawnWidth, drawnHeight);

  ctx.strokeStyle = 'rgba(255, 255, 255, .75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(adjustedX, adjustedY, adjustedWidth, adjustedHeight);

  // Info-Box anzeigen
  info.style.display = 'block';
  info.innerText = message;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});
