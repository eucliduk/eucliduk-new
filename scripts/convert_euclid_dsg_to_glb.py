#!/usr/bin/env python3
"""Convert the supplied Euclid DSG model to a self-contained glTF 2.0 GLB.

The DSG container is zlib-compressed Lua 5.3 bytecode.  This converter is
deliberately model-specific: it verifies the exact DSG and texture hashes
before loading the bytecode, then evaluates it with an environment containing
only ``table.concat``.  A small Lua helper serializes the resulting, validated
data tables into a simple binary interchange file for Python.

Geometry is preserved, apart from translating its raw bounding-box centre to
the origin.  The DSG's source-engine node rotation is intentionally not
applied: the raw model's long spacecraft axis is +Y, matching the website's
existing Three.js convention.  Separate position/normal/UV indices are unified
for glTF, the DSG's bottom-left UV origin is converted to glTF's upper-left
origin, and the original two material groups remain separate primitives.

The eight 4K source textures are resized for the web.  Base-colour textures are
encoded as high-quality JPEG, normal maps remain lossless PNG, and the
metalness/roughness greyscale maps are losslessly packed into glTF's standard
B/G channels.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import math
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tempfile
from typing import BinaryIO, Iterable, Sequence
import zlib

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover - dependency error is user-facing
    raise SystemExit(
        "Pillow is required. Install it in the Python environment running this script."
    ) from exc


DSG_NAME = "Euclid.dsg"
DSG_SHA256 = "43c1e87108e254ee1a6108a80591262ee5e1fc32c65ebcde1d8674f4f187e37e"
LUA_BYTECODE_SHA256 = (
    "b50b279d3723b90c9d83d33f168bb6c95f9d7908d5e4bd8b465205dc21af511f"
)

TEXTURE_SHA256 = {
    "Euclid_M_01_BaseColor.png": (
        "48a0c30ca456213118b12a8af3c2d753b73545aa280e020ec32d4b86ac0fe9b1"
    ),
    "Euclid_M_01_Metal.png": (
        "e88448d0a643aa8a2747ec157b6f2bca90cc9ac0c1aba3f35c7e97fb8c6e8462"
    ),
    "Euclid_M_01_Normal.png": (
        "2279b5a0b794d16b5de82e1335000681ef734d772284ac36c6bff90555a8802f"
    ),
    "Euclid_M_01_Roughness.png": (
        "9e569c8e56672e2d6b3b594f99d51557c8c49daacca7ac17cf7714fa6edcbe24"
    ),
    "Euclid_M_02_BaseColor.png": (
        "94aa00c95d908c3b04c716e8c5818567c0e3685d8ef48a073b316969703bcf15"
    ),
    "Euclid_M_02_Metal.png": (
        "c23855a7c65cac1a3df6dbb85983edd7b4d18f4a03314759066543839b0e4562"
    ),
    "Euclid_M_02_Normal.png": (
        "df8a4781c88bc8c13000a4495658eb7424cd64966bb62cb827eaab8e8726468d"
    ),
    "Euclid_M_02_Roughness.png": (
        "d135414ee81bdcf20c1018b00577fa5e37f72af541d9267244b41593a8308141"
    ),
}

EXPECTED_POSITION_COUNT = 12_604
EXPECTED_NORMAL_COUNT = 64_656
EXPECTED_UV_COUNT = 17_149
EXPECTED_TRIANGLE_COUNT = 21_552
EXTRACT_MAGIC = b"DSGEX01\0"

GLTF_ARRAY_BUFFER = 34_962
GLTF_ELEMENT_ARRAY_BUFFER = 34_963
GLTF_FLOAT = 5_126
GLTF_UNSIGNED_SHORT = 5_123
GLTF_UNSIGNED_INT = 5_125


# This code runs in the host Lua process, but the loaded model chunk receives
# only the explicitly constructed `model_env`.  The exact bytecode hash is
# checked in Python before this helper is invoked.
LUA_EXTRACTOR = r'''
local input_path = assert(arg[1], "missing bytecode path")
local output_path = assert(arg[2], "missing extraction path")

local input = assert(io.open(input_path, "rb"))
local bytecode = assert(input:read("*a"))
assert(input:close())

local model_env = {table = {concat = table.concat}}
local chunk, load_error = load(bytecode, "@Euclid.dsg", "b", model_env)
assert(chunk, load_error)

local hook_calls = 0
debug.sethook(function()
  hook_calls = hook_calls + 1
  if hook_calls > 5000 then
    error("DSG instruction limit exceeded")
  end
end, "", 10000)
local ok, run_error = pcall(chunk)
debug.sethook()
assert(ok, run_error)

local allowed_globals = {
  table = true,
  version = true,
  areColorsLinear = true,
  nodes = true,
  geometries = true,
  materials = true,
  textures = true,
}
for key, _ in pairs(model_env) do
  assert(allowed_globals[key], "unexpected DSG global: " .. tostring(key))
end

assert(model_env.version == 1, "unexpected DSG version")
assert(model_env.areColorsLinear == false, "unexpected DSG colour flag")
assert(type(model_env.nodes) == "table" and #model_env.nodes == 1)
assert(type(model_env.geometries) == "table" and #model_env.geometries == 1)
assert(type(model_env.materials) == "table" and #model_env.materials == 2)
assert(type(model_env.textures) == "table" and #model_env.textures == 4)

local geometry = model_env.geometries[1]
local node = model_env.nodes[1]
assert(type(node) == "table")
assert(type(node.transform) == "string" and #node.transform == 64)
assert(type(node.geometries) == "table" and #node.geometries == 1)
assert(node.geometries[1] == 0)

local function validate_attribute(attribute, expected_count, components)
  assert(type(attribute) == "table")
  assert(attribute.count == expected_count)
  assert(type(attribute.data) == "string")
  assert(#attribute.data == expected_count * components * 4)
end

validate_attribute(geometry.positions, 12604, 3)
validate_attribute(geometry.normals, 64656, 3)
validate_attribute(geometry.uvs, 17149, 2)
assert(type(geometry.triangles) == "table" and #geometry.triangles == 21552)

local function validate_keys(value, allowed, label)
  for key, _ in pairs(value) do
    assert(allowed[key], "unexpected " .. label .. " field: " .. tostring(key))
  end
end

validate_keys(
  geometry,
  {positions=true, normals=true, uvs=true, triangles=true},
  "geometry"
)

local material_counts = {[0] = 0, [1] = 0}
for index, triangle in ipairs(geometry.triangles) do
  assert(type(triangle) == "table")
  validate_keys(
    triangle,
    {positions=true, normals=true, uvs=true, material=true},
    "triangle"
  )
  assert(triangle.material == 0 or triangle.material == 1)
  material_counts[triangle.material] = material_counts[triangle.material] + 1
  for _, field in ipairs({"positions", "normals", "uvs"}) do
    assert(type(triangle[field]) == "string" and #triangle[field] == 12)
  end
  local p1, p2, p3 = string.unpack("<I4I4I4", triangle.positions)
  local n1, n2, n3 = string.unpack("<I4I4I4", triangle.normals)
  local u1, u2, u3 = string.unpack("<I4I4I4", triangle.uvs)
  assert(p1 < 12604 and p2 < 12604 and p3 < 12604)
  assert(n1 < 64656 and n2 < 64656 and n3 < 64656)
  assert(u1 < 17149 and u2 < 17149 and u3 < 17149)
end
assert(material_counts[0] == 11182 and material_counts[1] == 10370)

for index, material in ipairs(model_env.materials) do
  assert(type(material) == "table")
  validate_keys(
    material,
    {
      base_color=true,
      opacity=true,
      specular_exponent_blinnPhong=true,
      baseColor_texture=true,
      normal_texture=true,
    },
    "material"
  )
  assert(type(material.base_color) == "string" and #material.base_color == 12)
  assert(type(material.opacity) == "string" and #material.opacity == 4)
  assert(
    type(material.specular_exponent_blinnPhong) == "string"
    and #material.specular_exponent_blinnPhong == 4
  )
  assert(type(material.baseColor_texture) == "table")
  assert(type(material.normal_texture) == "table")
  validate_keys(material.baseColor_texture, {path=true}, "base-colour texture")
  validate_keys(material.normal_texture, {path=true}, "normal texture")
  assert(material.baseColor_texture.path == (index - 1) * 2)
  assert(material.normal_texture.path == (index - 1) * 2 + 1)
end

for _, texture_path in ipairs(model_env.textures) do
  assert(type(texture_path) == "string")
  assert(#texture_path > 0 and #texture_path < 1024)
end

local output = assert(io.open(output_path, "wb"))
local function write_u32(value)
  assert(output:write(string.pack("<I4", value)))
end
local function write_attribute(attribute)
  write_u32(attribute.count)
  write_u32(#attribute.data)
  assert(output:write(attribute.data))
end

assert(output:write("DSGEX01\0"))
write_attribute(geometry.positions)
write_attribute(geometry.normals)
write_attribute(geometry.uvs)
write_u32(#geometry.triangles)
for _, triangle in ipairs(geometry.triangles) do
  write_u32(triangle.material)
  assert(output:write(triangle.positions))
  assert(output:write(triangle.normals))
  assert(output:write(triangle.uvs))
end

write_u32(#model_env.materials)
for _, material in ipairs(model_env.materials) do
  assert(output:write(material.base_color))
  assert(output:write(material.opacity))
  assert(output:write(material.specular_exponent_blinnPhong))
  write_u32(material.baseColor_texture.path)
  write_u32(material.normal_texture.path)
end

write_u32(#model_env.textures)
for _, texture_path in ipairs(model_env.textures) do
  write_u32(#texture_path)
  assert(output:write(texture_path))
end

assert(output:write(node.transform))
assert(output:close())
'''


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_sources(source_dir: Path) -> bytes:
    dsg_path = source_dir / DSG_NAME
    if not dsg_path.is_file():
        raise ValueError(f"Missing DSG file: {dsg_path}")
    dsg_data = dsg_path.read_bytes()
    dsg_hash = sha256_bytes(dsg_data)
    if dsg_hash != DSG_SHA256:
        raise ValueError(
            f"{DSG_NAME} does not match the reviewed source "
            f"(expected {DSG_SHA256}, got {dsg_hash})"
        )

    for filename, expected_hash in TEXTURE_SHA256.items():
        path = source_dir / filename
        if not path.is_file():
            raise ValueError(f"Missing source texture: {path}")
        actual_hash = sha256_file(path)
        if actual_hash != expected_hash:
            raise ValueError(
                f"{filename} does not match the reviewed source "
                f"(expected {expected_hash}, got {actual_hash})"
            )

    try:
        bytecode = zlib.decompress(dsg_data)
    except zlib.error as exc:
        raise ValueError(f"Could not decompress {dsg_path}: {exc}") from exc
    if sha256_bytes(bytecode) != LUA_BYTECODE_SHA256:
        raise ValueError("Decompressed Lua bytecode hash is not the reviewed value")
    if not bytecode.startswith(b"\x1bLua\x53\x00"):
        raise ValueError("DSG payload is not Lua 5.3 binary bytecode")
    return bytecode


def find_lua53(explicit_path: str | None) -> Path:
    candidates: list[str] = []
    if explicit_path:
        candidates.append(explicit_path)
    if os.environ.get("LUA53"):
        candidates.append(os.environ["LUA53"])
    for command in ("lua5.3", "lua53", "lua"):
        found = shutil.which(command)
        if found:
            candidates.append(found)
    # Convenient local build used while developing this converter.
    candidates.append("/private/tmp/lua-5.3.6/src/lua")

    checked: set[Path] = set()
    for candidate in candidates:
        path = Path(candidate).expanduser().resolve()
        if path in checked or not path.is_file():
            continue
        checked.add(path)
        result = subprocess.run(
            [str(path), "-v"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
            text=True,
        )
        if result.returncode == 0 and result.stdout.startswith("Lua 5.3"):
            return path
    raise ValueError(
        "A Lua 5.3 interpreter is required. Pass its path with --lua or LUA53."
    )


def extract_dsg(bytecode: bytes, lua_path: Path, destination: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix=".luac") as bytecode_file:
        bytecode_file.write(bytecode)
        bytecode_file.flush()
        result = subprocess.run(
            [
                str(lua_path),
                "-",
                bytecode_file.name,
                str(destination),
            ],
            input=LUA_EXTRACTOR.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise ValueError(f"Sandboxed DSG extraction failed: {stderr}")


def read_exact(handle: BinaryIO, count: int) -> bytes:
    value = handle.read(count)
    if len(value) != count:
        raise ValueError("Truncated DSG extraction")
    return value


def read_u32(handle: BinaryIO) -> int:
    return struct.unpack("<I", read_exact(handle, 4))[0]


def read_attribute(
    handle: BinaryIO, expected_count: int, components: int, name: str
) -> tuple[tuple[float, ...], ...]:
    count = read_u32(handle)
    byte_length = read_u32(handle)
    if count != expected_count or byte_length != count * components * 4:
        raise ValueError(f"Unexpected extracted {name} dimensions")
    data = read_exact(handle, byte_length)
    values = tuple(struct.iter_unpack("<" + "f" * components, data))
    if len(values) != count:
        raise ValueError(f"Could not decode all {name}")
    if any(not math.isfinite(component) for value in values for component in value):
        raise ValueError(f"{name} contains a non-finite value")
    return values


def parse_extraction(path: Path) -> dict:
    with path.open("rb") as handle:
        if read_exact(handle, len(EXTRACT_MAGIC)) != EXTRACT_MAGIC:
            raise ValueError("Unexpected DSG extraction signature")
        positions = read_attribute(
            handle, EXPECTED_POSITION_COUNT, 3, "positions"
        )
        normals = read_attribute(handle, EXPECTED_NORMAL_COUNT, 3, "normals")
        uvs = read_attribute(handle, EXPECTED_UV_COUNT, 2, "UVs")

        triangle_count = read_u32(handle)
        if triangle_count != EXPECTED_TRIANGLE_COUNT:
            raise ValueError("Unexpected extracted triangle count")
        triangles = []
        material_counts = [0, 0]
        for _ in range(triangle_count):
            material = read_u32(handle)
            if material not in (0, 1):
                raise ValueError(f"Unexpected triangle material {material}")
            position_indices = struct.unpack("<III", read_exact(handle, 12))
            normal_indices = struct.unpack("<III", read_exact(handle, 12))
            uv_indices = struct.unpack("<III", read_exact(handle, 12))
            if max(position_indices) >= len(positions):
                raise ValueError("Position index is out of range")
            if max(normal_indices) >= len(normals):
                raise ValueError("Normal index is out of range")
            if max(uv_indices) >= len(uvs):
                raise ValueError("UV index is out of range")
            material_counts[material] += 1
            triangles.append(
                (material, position_indices, normal_indices, uv_indices)
            )
        if material_counts != [11_182, 10_370]:
            raise ValueError(f"Unexpected material triangle counts: {material_counts}")

        material_count = read_u32(handle)
        if material_count != 2:
            raise ValueError("Unexpected material count")
        materials = []
        for expected_material in range(material_count):
            base_color = struct.unpack("<fff", read_exact(handle, 12))
            opacity = struct.unpack("<f", read_exact(handle, 4))[0]
            specular_exponent = struct.unpack("<f", read_exact(handle, 4))[0]
            base_texture = read_u32(handle)
            normal_texture = read_u32(handle)
            if (base_texture, normal_texture) != (
                expected_material * 2,
                expected_material * 2 + 1,
            ):
                raise ValueError("Unexpected material texture mapping")
            if any(not math.isfinite(value) for value in (*base_color, opacity)):
                raise ValueError("Material contains a non-finite value")
            materials.append(
                {
                    "base_color": base_color,
                    "opacity": opacity,
                    "specular_exponent": specular_exponent,
                }
            )

        texture_count = read_u32(handle)
        if texture_count != 4:
            raise ValueError("Unexpected DSG texture count")
        texture_paths = []
        for _ in range(texture_count):
            length = read_u32(handle)
            if not 0 < length < 1024:
                raise ValueError("Unexpected DSG texture path length")
            raw_path = read_exact(handle, length)
            texture_paths.append(raw_path.decode("utf-8"))

        node_transform = struct.unpack("<" + "f" * 16, read_exact(handle, 64))
        if handle.read(1):
            raise ValueError("Unexpected trailing data in DSG extraction")

    expected_basenames = [
        "Euclid_M_01_BaseColor.png",
        "Euclid_M_01_Normal.png",
        "Euclid_M_02_BaseColor.png",
        "Euclid_M_02_Normal.png",
    ]
    actual_basenames = [
        path.replace("\\", "/").rsplit("/", 1)[-1] for path in texture_paths
    ]
    if actual_basenames != expected_basenames:
        raise ValueError(f"Unexpected DSG texture references: {actual_basenames}")

    return {
        "positions": positions,
        "normals": normals,
        "uvs": uvs,
        "triangles": triangles,
        "materials": materials,
        "node_transform": node_transform,
    }


def component_min_max(
    values: Sequence[Sequence[float]],
) -> tuple[list[float], list[float]]:
    component_count = len(values[0])
    minimum = [math.inf] * component_count
    maximum = [-math.inf] * component_count
    for value in values:
        for component in range(component_count):
            minimum[component] = min(minimum[component], value[component])
            maximum[component] = max(maximum[component], value[component])
    return minimum, maximum


def unify_geometry(extracted: dict) -> dict:
    raw_positions = extracted["positions"]
    raw_minimum, raw_maximum = component_min_max(raw_positions)
    centre = [
        (raw_minimum[axis] + raw_maximum[axis]) * 0.5 for axis in range(3)
    ]
    centred_positions = tuple(
        tuple(position[axis] - centre[axis] for axis in range(3))
        for position in raw_positions
    )

    vertex_lookup: dict[tuple[int, int, int], int] = {}
    positions: list[tuple[float, ...]] = []
    normals: list[tuple[float, ...]] = []
    uvs: list[tuple[float, ...]] = []
    indices: list[list[int]] = [[], []]

    for material, position_indices, normal_indices, uv_indices in extracted[
        "triangles"
    ]:
        for corner in range(3):
            key = (
                position_indices[corner],
                normal_indices[corner],
                uv_indices[corner],
            )
            unified_index = vertex_lookup.get(key)
            if unified_index is None:
                unified_index = len(positions)
                vertex_lookup[key] = unified_index
                positions.append(centred_positions[key[0]])
                normals.append(extracted["normals"][key[1]])
                source_uv = extracted["uvs"][key[2]]
                # DSG stores UVs in the conventional modelling/OpenGL
                # bottom-left image space. glTF 2.0 defines (0, 0) at the
                # upper-left, so leaving V unchanged maps every atlas island
                # to the vertically opposite part of the spacecraft.
                uvs.append((source_uv[0], 1.0 - source_uv[1]))
            indices[material].append(unified_index)

    minimum, maximum = component_min_max(positions)
    return {
        "positions": positions,
        "normals": normals,
        "uvs": uvs,
        "indices": indices,
        "minimum": minimum,
        "maximum": maximum,
        "raw_minimum": raw_minimum,
        "raw_maximum": raw_maximum,
        "centre": centre,
    }


def resize_image(image: Image.Image, maximum_size: int) -> Image.Image:
    if max(image.size) <= maximum_size:
        return image.copy()
    resized = image.copy()
    resized.thumbnail(
        (maximum_size, maximum_size),
        resample=Image.Resampling.LANCZOS,
        reducing_gap=3.0,
    )
    return resized


def encode_base_color(
    source_path: Path, maximum_size: int, quality: int
) -> tuple[bytes, str, tuple[int, int]]:
    with Image.open(source_path) as image:
        converted = resize_image(image.convert("RGB"), maximum_size)
    output = io.BytesIO()
    converted.save(
        output,
        format="JPEG",
        quality=quality,
        subsampling=0,
        optimize=True,
        progressive=True,
    )
    return output.getvalue(), "image/jpeg", converted.size


def encode_normal(
    source_path: Path, maximum_size: int
) -> tuple[bytes, str, tuple[int, int]]:
    with Image.open(source_path) as image:
        converted = resize_image(image.convert("RGB"), maximum_size)
    output = io.BytesIO()
    converted.save(output, format="PNG", optimize=True, compress_level=9)
    return output.getvalue(), "image/png", converted.size


def encode_metallic_roughness(
    metal_path: Path, roughness_path: Path, maximum_size: int
) -> tuple[bytes, str, tuple[int, int]]:
    with Image.open(metal_path) as metal_image:
        metal = resize_image(metal_image.convert("L"), maximum_size)
    with Image.open(roughness_path) as roughness_image:
        roughness = resize_image(roughness_image.convert("L"), maximum_size)
    if metal.size != roughness.size:
        raise ValueError("Metalness and roughness texture dimensions do not match")
    unused = Image.new("L", metal.size, 255)
    packed = Image.merge("RGB", (unused, roughness, metal))
    output = io.BytesIO()
    packed.save(output, format="PNG", optimize=True, compress_level=9)
    return output.getvalue(), "image/png", packed.size


def build_web_textures(
    source_dir: Path, maximum_size: int, base_color_quality: int
) -> list[dict]:
    result: list[dict] = []
    for material_number in (1, 2):
        prefix = f"Euclid_M_{material_number:02d}"
        encoders = [
            (
                "BaseColor",
                encode_base_color(
                    source_dir / f"{prefix}_BaseColor.png",
                    maximum_size,
                    base_color_quality,
                ),
            ),
            (
                "Normal",
                encode_normal(
                    source_dir / f"{prefix}_Normal.png", maximum_size
                ),
            ),
            (
                "MetallicRoughness",
                encode_metallic_roughness(
                    source_dir / f"{prefix}_Metal.png",
                    source_dir / f"{prefix}_Roughness.png",
                    maximum_size,
                ),
            ),
        ]
        for suffix, (data, mime_type, dimensions) in encoders:
            result.append(
                {
                    "name": f"{prefix}_{suffix}",
                    "data": data,
                    "mime_type": mime_type,
                    "dimensions": dimensions,
                }
            )
    return result


class BufferBuilder:
    def __init__(self) -> None:
        self.data = bytearray()

    def align(self, multiple: int = 4) -> None:
        self.data.extend(b"\0" * ((-len(self.data)) % multiple))

    def add(self, value: bytes, alignment: int = 4) -> tuple[int, int]:
        self.align(alignment)
        offset = len(self.data)
        self.data.extend(value)
        return offset, len(value)

    def finish(self) -> bytes:
        self.align(4)
        return bytes(self.data)


def pack_float_vectors(values: Iterable[Sequence[float]]) -> bytes:
    output = bytearray()
    for value in values:
        output.extend(struct.pack("<" + "f" * len(value), *value))
    return bytes(output)


def build_glb(
    geometry: dict,
    extracted: dict,
    web_textures: list[dict],
    output_path: Path,
) -> dict:
    buffer = BufferBuilder()
    buffer_views: list[dict] = []
    accessors: list[dict] = []

    def add_buffer_view(
        data: bytes, target: int | None = None, name: str | None = None
    ) -> int:
        offset, length = buffer.add(data)
        view: dict = {"buffer": 0, "byteOffset": offset, "byteLength": length}
        if target is not None:
            view["target"] = target
        if name:
            view["name"] = name
        buffer_views.append(view)
        return len(buffer_views) - 1

    position_view = add_buffer_view(
        pack_float_vectors(geometry["positions"]),
        GLTF_ARRAY_BUFFER,
        "Euclid positions",
    )
    normal_view = add_buffer_view(
        pack_float_vectors(geometry["normals"]),
        GLTF_ARRAY_BUFFER,
        "Euclid normals",
    )
    uv_view = add_buffer_view(
        pack_float_vectors(geometry["uvs"]),
        GLTF_ARRAY_BUFFER,
        "Euclid UVs",
    )

    accessors.append(
        {
            "name": "Euclid positions",
            "bufferView": position_view,
            "byteOffset": 0,
            "componentType": GLTF_FLOAT,
            "count": len(geometry["positions"]),
            "type": "VEC3",
            "min": geometry["minimum"],
            "max": geometry["maximum"],
        }
    )
    position_accessor = len(accessors) - 1
    accessors.append(
        {
            "name": "Euclid normals",
            "bufferView": normal_view,
            "byteOffset": 0,
            "componentType": GLTF_FLOAT,
            "count": len(geometry["normals"]),
            "type": "VEC3",
        }
    )
    normal_accessor = len(accessors) - 1
    accessors.append(
        {
            "name": "Euclid UVs",
            "bufferView": uv_view,
            "byteOffset": 0,
            "componentType": GLTF_FLOAT,
            "count": len(geometry["uvs"]),
            "type": "VEC2",
        }
    )
    uv_accessor = len(accessors) - 1

    index_accessors: list[int] = []
    index_component_type = (
        GLTF_UNSIGNED_SHORT
        if len(geometry["positions"]) <= 65_536
        else GLTF_UNSIGNED_INT
    )
    index_format = "H" if index_component_type == GLTF_UNSIGNED_SHORT else "I"
    for material_index, material_indices in enumerate(geometry["indices"]):
        index_bytes = struct.pack(
            "<" + index_format * len(material_indices), *material_indices
        )
        index_view = add_buffer_view(
            index_bytes,
            GLTF_ELEMENT_ARRAY_BUFFER,
            f"Euclid material {material_index + 1} indices",
        )
        accessors.append(
            {
                "name": f"Euclid material {material_index + 1} indices",
                "bufferView": index_view,
                "byteOffset": 0,
                "componentType": index_component_type,
                "count": len(material_indices),
                "type": "SCALAR",
                "min": [min(material_indices)],
                "max": [max(material_indices)],
            }
        )
        index_accessors.append(len(accessors) - 1)

    images = []
    textures = []
    for texture in web_textures:
        image_view = add_buffer_view(texture["data"], name=texture["name"])
        images.append(
            {
                "name": texture["name"],
                "bufferView": image_view,
                "mimeType": texture["mime_type"],
            }
        )
        textures.append(
            {
                "name": texture["name"],
                "sampler": 0,
                "source": len(images) - 1,
            }
        )

    materials = []
    for material_index, source_material in enumerate(extracted["materials"]):
        texture_base = material_index * 3
        base_color_factor = [
            *source_material["base_color"],
            source_material["opacity"],
        ]
        material: dict = {
            "name": f"Euclid material {material_index + 1}",
            "pbrMetallicRoughness": {
                "baseColorFactor": base_color_factor,
                "baseColorTexture": {"index": texture_base},
                "metallicFactor": 1.0,
                "roughnessFactor": 1.0,
                "metallicRoughnessTexture": {"index": texture_base + 2},
            },
            "normalTexture": {"index": texture_base + 1, "scale": 1.0},
        }
        if source_material["opacity"] < 1.0:
            material["alphaMode"] = "BLEND"
        materials.append(material)

    primitives = []
    for material_index, index_accessor in enumerate(index_accessors):
        primitives.append(
            {
                "attributes": {
                    "POSITION": position_accessor,
                    "NORMAL": normal_accessor,
                    "TEXCOORD_0": uv_accessor,
                },
                "indices": index_accessor,
                "material": material_index,
                "mode": 4,
            }
        )

    binary_chunk = buffer.finish()
    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "eucliduk.github.io DSG converter",
            "extras": {
                "source": DSG_NAME,
                "sourceSha256": DSG_SHA256,
                "geometryOrientation": (
                    "Raw DSG axes retained; long spacecraft axis is +Y"
                ),
                "geometryTranslation": (
                    "Raw bounding-box centre translated to the origin"
                ),
                "textureCoordinates": (
                    "DSG V coordinate flipped to glTF upper-left image origin"
                ),
            },
        },
        "scene": 0,
        "scenes": [{"name": "Euclid scene", "nodes": [0]}],
        "nodes": [{"name": "Euclid", "mesh": 0}],
        "meshes": [{"name": "Euclid spacecraft", "primitives": primitives}],
        "materials": materials,
        "samplers": [
            {
                "magFilter": 9729,
                "minFilter": 9987,
                "wrapS": 10497,
                "wrapT": 10497,
            }
        ],
        "textures": textures,
        "images": images,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(binary_chunk)}],
    }

    json_chunk = json.dumps(
        gltf, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    json_chunk += b" " * ((-len(json_chunk)) % 4)
    total_length = 12 + 8 + len(json_chunk) + 8 + len(binary_chunk)
    glb = bytearray(struct.pack("<4sII", b"glTF", 2, total_length))
    glb.extend(struct.pack("<I4s", len(json_chunk), b"JSON"))
    glb.extend(json_chunk)
    glb.extend(struct.pack("<I4s", len(binary_chunk), b"BIN\0"))
    glb.extend(binary_chunk)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_name(output_path.name + ".tmp")
    temporary_path.write_bytes(glb)
    temporary_path.replace(output_path)
    return gltf


def accessor_element_size(accessor_type: str, component_type: int) -> int:
    components = {
        "SCALAR": 1,
        "VEC2": 2,
        "VEC3": 3,
        "VEC4": 4,
        "MAT2": 4,
        "MAT3": 9,
        "MAT4": 16,
    }[accessor_type]
    component_bytes = {
        5_120: 1,
        5_121: 1,
        5_122: 2,
        5_123: 2,
        5_125: 4,
        5_126: 4,
    }[component_type]
    return components * component_bytes


def validate_glb(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 28:
        raise ValueError("GLB is too short")
    magic, version, declared_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or declared_length != len(data):
        raise ValueError("Invalid GLB header")

    json_length, json_type = struct.unpack_from("<I4s", data, 12)
    if json_type != b"JSON" or json_length % 4:
        raise ValueError("Invalid GLB JSON chunk")
    json_start = 20
    json_end = json_start + json_length
    gltf = json.loads(data[json_start:json_end].decode("utf-8"))

    binary_length, binary_type = struct.unpack_from("<I4s", data, json_end)
    binary_start = json_end + 8
    binary_end = binary_start + binary_length
    if binary_type != b"BIN\0" or binary_end != len(data):
        raise ValueError("Invalid GLB binary chunk")
    if gltf["buffers"][0]["byteLength"] != binary_length:
        raise ValueError("glTF buffer length does not match the BIN chunk")

    for index, view in enumerate(gltf["bufferViews"]):
        offset = view.get("byteOffset", 0)
        length = view["byteLength"]
        if offset % 4 or offset < 0 or length < 0 or offset + length > binary_length:
            raise ValueError(f"Invalid bufferView {index}")

    for index, accessor in enumerate(gltf["accessors"]):
        view = gltf["bufferViews"][accessor["bufferView"]]
        byte_offset = accessor.get("byteOffset", 0)
        required_length = (
            byte_offset
            + accessor["count"]
            * accessor_element_size(accessor["type"], accessor["componentType"])
        )
        if byte_offset < 0 or required_length > view["byteLength"]:
            raise ValueError(f"Accessor {index} exceeds its bufferView")
        if accessor["type"] == "SCALAR" and accessor["max"][0] >= gltf[
            "accessors"
        ][0]["count"]:
            raise ValueError(f"Index accessor {index} exceeds vertex count")

    mesh = gltf["meshes"][0]
    if len(mesh["primitives"]) != 2 or len(gltf["materials"]) != 2:
        raise ValueError("Expected exactly two primitives and two materials")
    if len(gltf["images"]) != 6 or len(gltf["textures"]) != 6:
        raise ValueError("Expected six embedded web PBR images/textures")
    if sum(
        gltf["accessors"][primitive["indices"]]["count"] // 3
        for primitive in mesh["primitives"]
    ) != EXPECTED_TRIANGLE_COUNT:
        raise ValueError("GLB triangle count does not match the DSG source")
    return gltf


def write_base64_fallback(glb_path: Path, output_path: Path) -> None:
    encoded = base64.b64encode(glb_path.read_bytes())
    payload = (
        b'window.EUCLID_SPACECRAFT_GLB_BASE64="'
        + encoded
        + b'";\n'
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_name(output_path.name + ".tmp")
    temporary_path.write_bytes(payload)
    temporary_path.replace(output_path)


def parse_arguments(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "source_dir",
        type=Path,
        help=f"Directory containing {DSG_NAME} and its eight texture PNGs",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("/private/tmp/euclid-new.glb"),
        help="Candidate GLB destination (default: /private/tmp/euclid-new.glb)",
    )
    parser.add_argument(
        "--lua",
        help="Path to a Lua 5.3 interpreter (or set the LUA53 environment variable)",
    )
    parser.add_argument(
        "--texture-size",
        type=int,
        default=1024,
        help="Maximum output texture dimension (default: 1024)",
    )
    parser.add_argument(
        "--basecolor-quality",
        type=int,
        default=90,
        help="Base-colour JPEG quality, 1-95 (default: 90)",
    )
    parser.add_argument(
        "--base64-output",
        type=Path,
        help=(
            "Optionally write an atomic file:// fallback assigning the GLB to "
            "window.EUCLID_SPACECRAFT_GLB_BASE64"
        ),
    )
    args = parser.parse_args(argv)
    if args.texture_size < 256 or args.texture_size > 4096:
        parser.error("--texture-size must be between 256 and 4096")
    if args.basecolor_quality < 1 or args.basecolor_quality > 95:
        parser.error("--basecolor-quality must be between 1 and 95")
    return args


def format_vector(values: Sequence[float]) -> str:
    return "[" + ", ".join(f"{value:.6f}" for value in values) + "]"


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_arguments(sys.argv[1:] if argv is None else argv)
    source_dir = args.source_dir.expanduser().resolve()
    output_path = args.output.expanduser().resolve()

    try:
        bytecode = verify_sources(source_dir)
        lua_path = find_lua53(args.lua)
        with tempfile.NamedTemporaryFile(suffix=".dsgextract") as extraction_file:
            extraction_path = Path(extraction_file.name)
            extract_dsg(bytecode, lua_path, extraction_path)
            extracted = parse_extraction(extraction_path)
        geometry = unify_geometry(extracted)
        web_textures = build_web_textures(
            source_dir, args.texture_size, args.basecolor_quality
        )
        build_glb(geometry, extracted, web_textures, output_path)
        validated = validate_glb(output_path)
        base64_output = (
            args.base64_output.expanduser().resolve()
            if args.base64_output is not None
            else None
        )
        if base64_output is not None:
            write_base64_fallback(output_path, base64_output)
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    index_counts = [
        validated["accessors"][primitive["indices"]]["count"]
        for primitive in validated["meshes"][0]["primitives"]
    ]
    print(f"Wrote: {output_path}")
    print(f"Lua: {lua_path}")
    print(
        "Geometry: "
        f"{len(geometry['positions']):,} unified vertices, "
        f"{EXPECTED_TRIANGLE_COUNT:,} triangles "
        f"({index_counts[0] // 3:,} + {index_counts[1] // 3:,})"
    )
    print(
        "Raw bounds: "
        f"{format_vector(geometry['raw_minimum'])} to "
        f"{format_vector(geometry['raw_maximum'])}"
    )
    print(
        "Centred bounds: "
        f"{format_vector(geometry['minimum'])} to "
        f"{format_vector(geometry['maximum'])}"
    )
    print(
        "Orientation: raw axes retained (+Y is the spacecraft's long axis); "
        "source-engine node rotation ignored"
    )
    print(
        "Textures: "
        + ", ".join(
            f"{texture['name']} {texture['dimensions'][0]}×"
            f"{texture['dimensions'][1]} {texture['mime_type']}"
            for texture in web_textures
        )
    )
    print(f"GLB size: {output_path.stat().st_size / (1024 * 1024):.2f} MiB")
    if base64_output is not None:
        print(
            f"Base64 fallback: {base64_output} "
            f"({base64_output.stat().st_size / (1024 * 1024):.2f} MiB)"
        )
    print(
        "Validation: glTF 2.0 header/chunks, JSON, bufferViews, accessors, "
        "indices, primitive/material counts, and embedded images passed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
