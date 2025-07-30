export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#grad1)"/>
      <circle cx="600" cy="315" r="150" stroke="white" stroke-width="8" fill="none" opacity="0.3"/>
      <text x="600" y="480" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">Circle Master</text>
      <text x="600" y="530" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#f0f0f0">Draw Perfect Circles</text>
    </svg>
  `);
}
