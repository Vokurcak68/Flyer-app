# Kometa Unicase Font

This directory is for the Kometa Unicase-Hv font files.

## Required Files

Place the following font files in this directory:
- `KometaUnicase-Hv.woff2` (recommended, best compression)
- `KometaUnicase-Hv.woff` (fallback)
- `KometaUnicase-Hv.ttf` (fallback)

## How to Add the Font

1. Obtain the Kometa Unicase-Hv font files (Heavy weight variant)
2. Copy the font files to this directory: `public/fonts/`
3. The font is already configured in `src/index.css`
4. Restart the development server if it's running
5. The price displays will automatically use the Kometa font

## Current Fallback

Until the font files are added, the prices will display using:
- Arial Black (bold, condensed alternative)
- Impact (if Arial Black is not available)
- Arial (standard fallback)
