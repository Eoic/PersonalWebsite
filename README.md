# Personal website

## Setup

```bash
cp config.example.toml config.toml
uv sync
npm install
```

## Development

```bash
make dev
```

## Production

```bash
make build-assets
make serve
```

## Compile bookshelf covers

```bash
npm run build:book-covers
```
