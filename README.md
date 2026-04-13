# Personal website

## Prerequisites

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)
- Node.js 18+
- npm

## Setup

```bash
uv sync
npm install
make seed
```

## Development

```bash
make dev
```

Starts Flask and Vite on `0.0.0.0`, prints the detected LAN URLs, and enables live reload for templates, TypeScript, and SCSS from other devices on the same network.

## Production

```bash
make build-assets
make serve
```

`make serve` also prints the LAN URL to visit from another device.

## Bookshelf Covers

```bash
npm run build:book-covers
```

Drop original cover art into `assets/images/books/source/`, run `npm run build:book-covers`, and commit both the source image and generated `-128.webp` / `-256.webp` variants.
