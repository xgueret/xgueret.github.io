// Generate the default 1200×630 OG card mirroring the homepage Hero.
// Run: node scripts/generate-og.mjs
import sharp from 'sharp';

const W = 1200;
const H = 630;

// Dawn Palette (approximated from OKLCH tokens in src/styles/global.css)
const COLORS = {
  bg: '#fbf4ed',       // sand (oklch 97% 0.012 65)
  ink: '#1f2730',      // ink (oklch 22% 0.025 220)
  inkMuted: '#5a6772', // ink-muted (oklch 45% 0.030 220)
  ocean: '#155069',    // ocean (oklch 38% 0.10 220)
  coral: '#e97a5c',    // coral (oklch 66% 0.17 35)
};

const AVATAR_SRC = 'public/images/moi.png';

// Photo card mirrors the Hero: aspect-[3/4], rounded-lg, offset ocean block behind.
const PHOTO_W = 300;
const PHOTO_H = 400;
const OFFSET = 24;
const PHOTO_X = W - PHOTO_W - 100 - OFFSET;
const PHOTO_Y = Math.round((H - PHOTO_H) / 2) - 10;

const OUT = 'public/images/og-default.png';

// Round corners on the avatar.
const avatarMask = Buffer.from(
  `<svg width="${PHOTO_W}" height="${PHOTO_H}" xmlns="http://www.w3.org/2000/svg"><rect width="${PHOTO_W}" height="${PHOTO_H}" rx="12" ry="12" fill="#fff"/></svg>`,
);

const avatarCard = await sharp(AVATAR_SRC)
  .resize(PHOTO_W, PHOTO_H, { fit: 'cover', position: 'top' })
  .composite([{ input: avatarMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const card = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${COLORS.bg}"/>

  <!-- Ocean offset block behind the photo -->
  <rect x="${PHOTO_X + OFFSET}" y="${PHOTO_Y + OFFSET}" width="${PHOTO_W}" height="${PHOTO_H}" rx="12" ry="12" fill="${COLORS.ocean}"/>

  <!-- Eyebrow: rule + small-caps label -->
  <rect x="100" y="100" width="48" height="2" fill="${COLORS.ocean}"/>
  <text x="164" y="108" font-family="'DejaVu Sans Mono', monospace" font-size="16" fill="${COLORS.ocean}" letter-spacing="3">INGÉNIEUR DEVOPS · GUADELOUPE</text>

  <!-- 3-line serif headline -->
  <g font-family="'DejaVu Serif', serif" font-size="108" font-weight="700" fill="${COLORS.ink}">
    <text x="100" y="260">Construire,</text>
    <text x="100" y="370">déployer,</text>
    <text x="100" y="480" font-style="italic" fill="${COLORS.coral}">automatiser.</text>
  </g>

  <!-- URL bottom-left -->
  <text x="100" y="560" font-family="'DejaVu Sans Mono', monospace" font-size="18" fill="${COLORS.ocean}" letter-spacing="1">xgueret.tipunchlabs.fr</text>
</svg>`;

await sharp(Buffer.from(card))
  .composite([{ input: avatarCard, top: PHOTO_Y, left: PHOTO_X }])
  .png({ quality: 92, compressionLevel: 9 })
  .toFile(OUT);

console.log(`Wrote ${OUT} (${W}×${H})`);
