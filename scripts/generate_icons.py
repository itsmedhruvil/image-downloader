#!/usr/bin/env python3
"""Generate the monochrome PWA icons for Website Image Extractor.

Pure standard library: the mark is drawn with signed-distance fields and encoded
as PNG with zlib, so no image libraries are required.

    python3 scripts/generate_icons.py
"""

from __future__ import annotations

import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

# Geometry is authored on a 32x32 grid (origin top-left, y down) and scaled to
# the requested size. Distances are evaluated in grid space centred on (16, 16).
UNIT = 32.0
BG_RADIUS = 5.0
BORDER_HALF = 14.25
BORDER_RADIUS = 4.0
STROKE = 1.3
SUN_CENTER = (11.0, 11.0)
SUN_RADIUS = 3.2
MOUNTAIN = [(4.5, 25.0), (13.0, 15.5), (18.5, 22.0), (22.0, 18.5), (27.5, 25.0)]
MASKABLE_SCALE = 0.78


def clamp(value, low=0.0, high=1.0):
    return low if value < low else high if value > high else value


def coverage(distance):
    """Turn a signed distance (negative inside) into anti-aliased coverage."""
    return clamp(0.5 - distance)


def sd_rounded_box(px, py, half, radius):
    qx = abs(px) - half + radius
    qy = abs(py) - half + radius
    outside = math.hypot(max(qx, 0.0), max(qy, 0.0))
    return outside + min(max(qx, qy), 0.0) - radius


def sd_circle(px, py, cx, cy, radius):
    return math.hypot(px - cx, py - cy) - radius


def sd_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return math.hypot(px - ax, py - ay)
    t = clamp(((px - ax) * dx + (py - ay) * dy) / length_sq)
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def blend(base, colour, alpha):
    if alpha <= 0:
        return base
    br, bg, bb, ba = base
    cr, cg, cb = colour
    out_a = alpha + ba * (1 - alpha)
    if out_a <= 0:
        return (0.0, 0.0, 0.0, 0.0)
    return (
        (cr * alpha + br * ba * (1 - alpha)) / out_a,
        (cg * alpha + bg * ba * (1 - alpha)) / out_a,
        (cb * alpha + bb * ba * (1 - alpha)) / out_a,
        out_a,
    )


def render(size, maskable):
    """Return raw RGBA rows for a square icon."""
    scale = size / UNIT
    rows = []

    for y in range(size):
        row = bytearray()
        for x in range(size):
            # Convert the pixel centre into centred grid space (y still points down).
            gx = (x + 0.5) / scale - UNIT / 2.0
            gy = (y + 0.5) / scale - UNIT / 2.0

            if maskable:
                # Full-bleed black background with the artwork inside the safe zone.
                pixel = (0.0, 0.0, 0.0, 1.0)
                sx, sy = gx / MASKABLE_SCALE, gy / MASKABLE_SCALE
            else:
                bg_alpha = coverage(sd_rounded_box(gx, gy, UNIT / 2.0, BG_RADIUS))
                pixel = blend((0.0, 0.0, 0.0, 0.0), BLACK, bg_alpha)
                sx, sy = gx, gy

            if pixel[3] <= 0.001:
                row += bytes((0, 0, 0, 0))
                continue

            # White rounded border ring.
            ring = abs(sd_rounded_box(sx, sy, BORDER_HALF, BORDER_RADIUS)) - STROKE
            pixel = blend(pixel, WHITE, coverage(ring))

            # Sun.
            sun = sd_circle(sx, sy, SUN_CENTER[0] - 16.0, SUN_CENTER[1] - 16.0, SUN_RADIUS)
            pixel = blend(pixel, WHITE, coverage(sun))

            # Mountain polyline, drawn as capsule segments.
            best = float("inf")
            for index in range(len(MOUNTAIN) - 1):
                ax, ay = MOUNTAIN[index]
                bx, by = MOUNTAIN[index + 1]
                best = min(best, sd_segment(sx, sy, ax - 16.0, ay - 16.0, bx - 16.0, by - 16.0))
            pixel = blend(pixel, WHITE, coverage(best - STROKE))

            row += bytes(
                (
                    int(clamp(pixel[0] / 255.0) * 255 + 0.5),
                    int(clamp(pixel[1] / 255.0) * 255 + 0.5),
                    int(clamp(pixel[2] / 255.0) * 255 + 0.5),
                    int(clamp(pixel[3]) * 255 + 0.5),
                )
            )
        rows.append(bytes(row))

    return b"".join(rows)


def encode_png(size, maskable=False):
    raw = render(size, maskable)
    stride = size * 4

    # Each scanline is prefixed with a filter byte (0 = none).
    filtered = bytearray()
    for y in range(size):
        filtered.append(0)
        filtered += raw[y * stride : (y + 1) * stride]

    def chunk(tag, payload):
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(bytes(filtered), 9))
        + chunk(b"IEND", b"")
    )


def write(path, data):
    with open(path, "wb") as handle:
        handle.write(data)
    print(f"wrote {path} ({len(data)} bytes)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    write(os.path.join(OUT_DIR, "icon-192.png"), encode_png(192))
    write(os.path.join(OUT_DIR, "icon-512.png"), encode_png(512))
    write(os.path.join(OUT_DIR, "icon-maskable-512.png"), encode_png(512, maskable=True))
    write(os.path.join(OUT_DIR, "apple-touch-icon.png"), encode_png(180, maskable=True))
    write(os.path.join(OUT_DIR, "favicon.png"), encode_png(64))

    # ICO container wrapping a 32px PNG (supported by every modern browser).
    png = encode_png(32)
    ico = (
        struct.pack("<HHH", 0, 1, 1)
        + struct.pack("<BBBBHHII", 32, 32, 0, 0, 1, 32, len(png), 6 + 16)
        + png
    )
    write(os.path.join(OUT_DIR, "favicon.ico"), ico)


if __name__ == "__main__":
    main()

