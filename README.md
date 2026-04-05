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

## Deployment

Deploys sync the repository to `/opt/website` and rebuild the project-local `.venv`
on the server with `uv sync --locked`, then build minified assets before
restarting the service.

The deploy target must be bootstrapped separately with:

- Python 3.14+
- `uv`
- A `website` user and group
- Ownership of `/opt/website` assigned to `website:website`

The systemd unit runs Gunicorn from `/opt/website/.venv/bin/gunicorn`, so
application dependencies stay isolated from the host Python environment.
