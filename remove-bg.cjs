const Jimp = require('jimp');

async function run() {
  try {
    const image = await Jimp.read('./public/bot_original.png');
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const data = image.bitmap.data;

    // Helper to get pixel index
    const idx = (x, y) => (y * width + x) * 4;

    // Check if a pixel is "background" white/near-white
    const isWhitish = (x, y) => {
      const i = idx(x, y);
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 10) return true; // already transparent
      const brightness = (r + g + b) / 3;
      return brightness > 220 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
    };

    // BFS flood fill from corners to mark background pixels
    const visited = new Uint8Array(width * height);
    const queue = [];

    const enqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const pos = y * width + x;
      if (visited[pos]) return;
      if (!isWhitish(x, y)) return;
      visited[pos] = 1;
      queue.push([x, y]);
    };

    // Start flood fill from all 4 edges
    for (let x = 0; x < width; x++) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      enqueue(cx + 1, cy);
      enqueue(cx - 1, cy);
      enqueue(cx, cy + 1);
      enqueue(cx, cy - 1);
    }

    // Remove background pixels with soft edge feathering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = y * width + x;
        if (!visited[pos]) continue;

        const i = idx(x, y);
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r + g + b) / 3;

        // Soft feather: near the boundary keep partial alpha for anti-aliasing
        // Check if any neighbor is NOT background -> this is an edge pixel
        let isEdge = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (!visited[ny * width + nx]) { isEdge = true; break; }
          }
          if (isEdge) break;
        }

        if (isEdge) {
          // Feathered edge: partially transparent based on brightness
          const alpha = Math.max(0, Math.min(255, Math.round((255 - brightness) * 1.5)));
          data[i + 3] = alpha;
        } else {
          // Fully transparent
          data[i + 3] = 0;
        }
      }
    }

    await image.writeAsync('./public/bot.png');
    console.log('Done! Smooth background removed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
