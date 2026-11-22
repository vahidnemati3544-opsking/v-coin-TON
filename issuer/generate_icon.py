import math
import struct
import zlib
from pathlib import Path

SIZE = 180
BLACK = (8, 8, 8)
GOLD = (216, 179, 91)
CENTER = (SIZE - 1) / 2

def inside_polygon(x, y, points):
    inside = False
    j = len(points) - 1
    for i in range(len(points)):
        xi, yi = points[i]
        xj, yj = points[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi):
            inside = not inside
        j = i
    return inside

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

points = [(48, 42), (69, 42), (90, 100), (111, 42), (132, 42), (101, 139), (79, 139)]
rows = []
for y in range(SIZE):
    row = bytearray([0])
    for x in range(SIZE):
        radius = math.hypot(x - CENTER, y - CENTER)
        border = 5 <= (82 - radius) <= 8
        gold = border or inside_polygon(x, y, points)
        row.extend(GOLD if gold else BLACK)
    rows.append(bytes(row))

raw = b"".join(rows)
png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">2I5B", SIZE, SIZE, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(raw, 9))
png += chunk(b"IEND", b"")
Path(__file__).with_name("icon-180.png").write_bytes(png)
print("Generated issuer-only 180x180 PNG icon.")
