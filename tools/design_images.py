"""Read offline image evidence. PNG samples use native, 1x image coordinates."""

import re
import struct
import zlib
from pathlib import Path


# Bound both the input and the inflated scanlines before retaining image data.
FILE_LIMIT = 64 * 1024 * 1024
SCANLINE_LIMIT = 96 * 1024 * 1024
PNG = b"\x89PNG\r\n\x1a\n"
CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
JPEG_FRAMES = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
               0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
JPEG_SCAN_END = re.compile(b"\xff(?=[^\x00\xd0-\xd7\xff])")


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


class Dimensions:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def rgb(self, x, y):
        raise ValueError("pixel sampling requires a PNG opened with pixels=True")


def paeth(left, above, upper_left):
    estimate = left + above - upper_left
    a, b, c = abs(estimate - left), abs(estimate - above), abs(estimate - upper_left)
    if a <= b and a <= c:
        return left
    return above if b <= c else upper_left


class PngPixels(Dimensions):
    def __init__(self, width, height, color, data, palette, transparency):
        super().__init__(width, height)
        self.color = color
        self.data = data
        self.palette = palette
        self.transparency = transparency
        self.decoded_rows = 0

    def _decode_through(self, y):
        # Unfilter in place. Reading more samples never decodes the same row twice.
        bpp = CHANNELS[self.color]
        stride = 1 + self.width * bpp
        data = self.data
        for row in range(self.decoded_rows, y + 1):
            first = row * stride + 1
            kind = data[first - 1]
            end = first + stride - 1
            if kind == 1:  # Sub
                for i in range(first + bpp, end):
                    data[i] = (data[i] + data[i - bpp]) & 255
            elif kind == 2 and row:  # Up
                for i in range(first, end):
                    data[i] = (data[i] + data[i - stride]) & 255
            elif kind in (3, 4):  # Average, Paeth
                for i in range(first, end):
                    left = data[i - bpp] if i >= first + bpp else 0
                    above = data[i - stride] if row else 0
                    if kind == 3:
                        predictor = (left + above) // 2
                    else:
                        upper_left = data[i - stride - bpp] if row and i >= first + bpp else 0
                        predictor = paeth(left, above, upper_left)
                    data[i] = (data[i] + predictor) & 255
        self.decoded_rows = max(self.decoded_rows, y + 1)

    def rgb(self, x, y):
        require(type(x) is int and type(y) is int and 0 <= x < self.width and 0 <= y < self.height,
                f"pixel ({x}, {y}) falls outside {self.width}x{self.height}")
        self._decode_through(y)
        bpp = CHANNELS[self.color]
        i = y * (1 + self.width * bpp) + 1 + x * bpp
        rgba = self._visible_rgba(i)
        require(rgba[3] == 255, f"pixel ({x}, {y}) is translucent; sample the composited export")
        return rgba[:3]

    def _visible_rgba(self, i):
        bpp = CHANNELS[self.color]
        pixel = tuple(self.data[i:i + bpp])
        alpha = 255
        if self.color == 3:
            index = pixel[0]
            require(3 * index + 3 <= len(self.palette), "PNG pixel references a missing palette entry")
            rgb = tuple(self.palette[3 * index:3 * index + 3])
            if index < len(self.transparency):
                alpha = self.transparency[index]
        else:
            rgb = pixel[:3] if self.color in (2, 6) else (pixel[0],) * 3
            if self.color in (4, 6):
                alpha = pixel[-1]
            elif self.transparency:
                key = struct.unpack(">H" if self.color == 0 else ">3H", self.transparency)
                if pixel == key:
                    alpha = 0
        return (*rgb, alpha) if alpha else (0, 0, 0, 0)


def region_differs(left, right, box, right_origin=None):
    """Compare a [x, y, width, height] region with a same-sized region in another PNG."""
    require(isinstance(left, PngPixels) and isinstance(right, PngPixels),
            "region comparison requires two PNGs opened with pixels=True")
    require(isinstance(box, (tuple, list)) and len(box) == 4 and all(type(v) is int for v in box),
            "use integer [x, y, width, height] coordinates for the comparison region")
    x, y, w, h = box
    require(0 <= x < x + w <= left.width and 0 <= y < y + h <= left.height,
            "comparison region falls outside the first export")
    if right_origin is None:
        require((left.width, left.height) == (right.width, right.height),
                "same-position comparison requires identical export dimensions")
        rx, ry = x, y
    else:
        require(isinstance(right_origin, (tuple, list)) and len(right_origin) == 2
                and all(type(v) is int for v in right_origin), "use integer [x, y] for the second origin")
        rx, ry = right_origin
        require(0 <= rx < rx + w <= right.width and 0 <= ry < ry + h <= right.height,
                "comparison region falls outside the second export")
    same_encoding = ((left.color, left.palette, left.transparency) ==
                     (right.color, right.palette, right.transparency))
    lb, rb = CHANNELS[left.color], CHANNELS[right.color]
    for dy in range(h):
        left._decode_through(y + dy)
        right._decode_through(ry + dy)
        li = (y + dy) * (1 + left.width * lb) + 1 + x * lb
        ri = (ry + dy) * (1 + right.width * rb) + 1 + rx * rb
        if same_encoding and left.data[li:li + w * lb] == right.data[ri:ri + w * rb]:
            continue
        for col in range(w):
            if left._visible_rgba(li + col * lb) != right._visible_rgba(ri + col * rb):
                return True
    return False


def read_png(blob, pixels):
    decoder = zlib.decompressobj()
    data = bytearray()
    chunks = set()
    palette = transparency = b""
    previous = None
    pos = len(PNG)
    while pos < len(blob):
        require(pos + 12 <= len(blob), "truncated PNG chunk")
        length, kind = struct.unpack_from(">I4s", blob, pos)
        end = pos + 8 + length
        require(end + 4 <= len(blob), f"truncated PNG {kind!r}")
        expected_crc, = struct.unpack_from(">I", blob, end)
        require(zlib.crc32(blob[pos + 4:end]) == expected_crc, f"invalid PNG {kind!r} checksum")
        payload = blob[pos + 8:end]
        pos = end + 4
        require(previous or kind == b"IHDR", "missing initial PNG IHDR")
        if kind == b"IHDR":
            require(previous is None and length == 13, "invalid or repeated PNG IHDR")
            width, height, depth, color, compression, filters, interlace = struct.unpack(">IIBBBBB", payload)
            require(width and height and compression == filters == interlace == 0,
                    "export a non-interlaced PNG with nonzero dimensions")
            depths = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
            require(depth in depths.get(color, ()), "invalid PNG color type or bit depth")
            require(not pixels or depth == 8, "export an 8-bit PNG for pixel sampling")
            stride = 1 + (width * CHANNELS[color] * depth + 7) // 8
            total = height * stride
            require(total <= SCANLINE_LIMIT, f"PNG exceeds {SCANLINE_LIMIT >> 20} MiB of decoded scanlines")
        elif kind == b"PLTE":
            require(kind not in chunks and b"IDAT" not in chunks and color not in (0, 4)
                    and 0 < length <= 768 and length % 3 == 0, "invalid PNG palette")
            require(color != 3 or length // 3 <= 2**depth, "palette exceeds indexed bit depth")
            palette = bytes(payload)
        elif kind == b"tRNS":
            require(kind not in chunks and b"IDAT" not in chunks, "invalid PNG transparency order")
            valid = ((color == 0 and length == 2) or (color == 2 and length == 6)
                     or (color == 3 and 0 < length <= len(palette) // 3))
            require(valid, "invalid PNG transparency data")
            transparency = bytes(payload)
        elif kind == b"IDAT":
            require(kind not in chunks or previous == kind, "non-contiguous PNG IDAT chunks")
            require(color != 3 or palette, "indexed PNG is missing its palette")
            try:
                data.extend(decoder.decompress(payload, total - len(data) + 1))
            except zlib.error as exc:
                raise ValueError(f"invalid PNG compressed data: {exc}") from exc
            require(len(data) <= total and not decoder.unused_data, "excess PNG compressed image data")
        elif kind == b"IEND":
            require(not length and pos == len(blob) and b"IDAT" in chunks, "invalid PNG IEND")
        elif not kind[0] & 0x20:
            raise ValueError(f"unknown critical PNG chunk {kind!r}")

        if pixels:
            require(kind not in (b"iCCP", b"cICP"), "convert this profiled export to an sRGB PNG for sampling")
            if kind == b"gAMA":
                require(length == 4 and abs(int.from_bytes(payload, "big") - 45455) <= 5,
                        "convert PNG gamma to sRGB for sampling")
            if kind == b"cHRM":
                require(length == 32 and struct.unpack(">8I", payload) ==
                        (31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000),
                        "convert PNG primaries to sRGB for sampling")
        chunks.add(kind)
        previous = kind

    require(previous == b"IEND" and decoder.eof and len(data) == total, "incomplete PNG image or scanlines")
    require(max(data[::stride]) <= 4, "invalid PNG scanline filter")
    if pixels:
        return PngPixels(width, height, color, data, palette, transparency)
    return Dimensions(width, height)


def read_jpeg(blob):
    # Parse marker lengths and every entropy-coded scan up to the final EOI.
    pos = 2
    frame = None
    scanned = False
    while pos < len(blob):
        require(blob[pos] == 0xff, "missing JPEG marker")
        while pos < len(blob) and blob[pos] == 0xff:
            pos += 1
        require(pos < len(blob), "truncated JPEG marker")
        marker = blob[pos]
        pos += 1
        if marker == 0xd9:
            require(frame and scanned and pos == len(blob), "incomplete JPEG frame or trailing data")
            return frame
        require(marker not in (0x00, 0xd8) and not 0xd0 <= marker <= 0xd7, "unexpected JPEG marker")
        if marker == 0x01:
            continue
        require(pos + 2 <= len(blob), "truncated JPEG segment length")
        length, = struct.unpack_from(">H", blob, pos)
        require(length >= 2 and pos + length <= len(blob), "invalid JPEG segment length")
        if marker in JPEG_FRAMES:
            require(length >= 8 and frame is None, "invalid or repeated JPEG frame")
            height, width, channels = struct.unpack_from(">HHB", blob, pos + 3)
            require(width and height and channels and length == 8 + 3 * channels, "invalid JPEG frame dimensions")
            frame = Dimensions(width, height)
        elif marker == 0xda:
            require(frame and length >= 8 and length == 6 + 2 * blob[pos + 2], "invalid JPEG scan header")
            start = pos + length
            stop = JPEG_SCAN_END.search(blob, start)
            require(stop and stop.start() > start, "empty or truncated JPEG scan")
            pos = stop.start()
            scanned = True
            continue
        pos += length
    raise ValueError("missing final JPEG EOI")


def load_image(path: Path, *, pixels: bool = False):
    """Validate a PNG or JPEG. Untagged 8-bit PNG samples are interpreted as sRGB."""
    with Path(path).open("rb") as stream:
        require(stream.seek(0, 2) <= FILE_LIMIT, f"image exceeds {FILE_LIMIT >> 20} MiB")
        stream.seek(0)
        blob = stream.read(FILE_LIMIT + 1)
    require(len(blob) <= FILE_LIMIT, "image grew beyond the input limit")
    if blob.startswith(PNG):
        return read_png(memoryview(blob), pixels)
    if blob.startswith(b"\xff\xd8"):
        require(not pixels, "export a PNG for pixel sampling")
        return read_jpeg(blob)
    raise ValueError("expected a PNG or JPEG image")
