# Personal website

## Prerequisites

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)

## Setup

```bash
uv sync
make seed
```

## Development

```bash
make dev
```

Starts Flask on `localhost:5000` with live reload for templates and assets.

## Production

```bash
make build-assets
make serve
```
