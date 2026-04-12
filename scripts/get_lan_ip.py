"""Print the primary LAN IPv4 address for this machine."""

from __future__ import annotations

import ipaddress
import socket


def _default_route_ip() -> str | None:
    """Return the IPv4 address selected for the default route."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("1.1.1.1", 80))
            ip_address = sock.getsockname()[0]

            if ip_address and not ip_address.startswith("127."):
                return ip_address
    except OSError:
        return None

    return None


def _fallback_private_ip() -> str | None:
    """Return any private non-loopback IPv4 address on the host."""
    for family, *_rest, sockaddr in socket.getaddrinfo(socket.gethostname(), None):
        if family != socket.AF_INET:
            continue

        ip_address = sockaddr[0]

        try:
            parsed = ipaddress.ip_address(ip_address)
        except ValueError:
            continue

        if parsed.is_private and not parsed.is_loopback:
            return ip_address

    return None


def get_lan_ip() -> str:
    """Return the best available IPv4 LAN address."""
    return _default_route_ip() or _fallback_private_ip() or "127.0.0.1"


if __name__ == "__main__":
    print(get_lan_ip())
