const hands = new Image();
hands.src = '/hands.png';
let swayX = 0, swayY = 0, tilt = 0;

export function drawWeapon(ctx, W, H, recoil, dodge, time, aim, dt, moving = true) {
  if (!hands.complete || !hands.naturalWidth) return;
  const ratio = hands.naturalWidth / hands.naturalHeight;
  const width = Math.min(W * .9, H * .72 * ratio, 760) * .75;
  const height = width / ratio;
  const aimX = Math.max(-1, Math.min(1, (aim.x / W - .5) * 2));
  const aimY = Math.max(-1, Math.min(1, (aim.y / H - .5) * 2));
  const follow = moving ? 1 - Math.exp(-dt * 9) : 0;
  // Soft breathing, pointer following and leaning into the dodge.
  const targetX = aimX * Math.min(12, W * .025) - dodge * W * .08;
  swayX += (targetX - swayX) * follow;
  swayY += (aimY * 7 - swayY) * follow;
  tilt += (aimX * .018 - dodge * .045 - tilt) * follow;
  const breathX = moving ? Math.sin(time * 1.6) * 2 : 0;
  const breathY = moving ? Math.sin(time * 2.2) * 3 : 0;
  ctx.save();
  ctx.translate(W - width * .44 + swayX + breathX + recoil * 7,
    H - height * .44 + swayY + breathY + recoil * 18);
  ctx.rotate(tilt - recoil * .035);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(hands, -width / 2, -height / 2, width, height);
  if (recoil > .65) {
    const x = -width / 2 + width * .285;
    const y = -height / 2 + height * .105;
    const size = Math.max(10, width * .032);
    ctx.translate(x, y);ctx.fillStyle = '#ffe5a1';ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6, radius = i % 2 ? size * .4 : size;
      const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();ctx.fill();ctx.fillStyle = '#fff9df';
    ctx.fillRect(-size * .25, -size * .25, size * .5, size * .5);
  }
  ctx.restore();
}
