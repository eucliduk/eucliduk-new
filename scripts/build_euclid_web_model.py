#!/usr/bin/env python3
"""Build the browser-ready Euclid model from the official SCALAE STL parts.

Usage:
    python build_euclid_web_model.py /path/to/Euclid_Parts_by_Colour \
        assets/models/euclid/euclid-spacecraft.glb

The input STL archive is distributed by the Euclid Consortium. It is not
committed to this repository; see assets/models/euclid/ATTRIBUTION.md.
"""

from __future__ import annotations

import argparse
import base64
from pathlib import Path

import numpy as np
import trimesh


COLOURS = {
    "white": trimesh.visual.material.PBRMaterial(
        name="White thermal panels",
        baseColorFactor=[0.82, 0.84, 0.83, 1.0],
        metallicFactor=0.08,
        roughnessFactor=0.58,
    ),
    "black": trimesh.visual.material.PBRMaterial(
        name="Black optical surfaces",
        baseColorFactor=[0.018, 0.022, 0.025, 1.0],
        metallicFactor=0.12,
        roughnessFactor=0.38,
    ),
    "gold": trimesh.visual.material.PBRMaterial(
        name="Gold multilayer insulation",
        baseColorFactor=[0.76, 0.48, 0.10, 1.0],
        metallicFactor=0.72,
        roughnessFactor=0.31,
    ),
    "gold_dark": trimesh.visual.material.PBRMaterial(
        name="Dark gold structure",
        baseColorFactor=[0.38, 0.22, 0.055, 1.0],
        metallicFactor=0.62,
        roughnessFactor=0.42,
    ),
    "silver": trimesh.visual.material.PBRMaterial(
        name="Silver structure",
        baseColorFactor=[0.64, 0.67, 0.68, 1.0],
        metallicFactor=0.88,
        roughnessFactor=0.24,
    ),
    "mirror": trimesh.visual.material.PBRMaterial(
        name="Primary mirror",
        baseColorFactor=[0.08, 0.12, 0.15, 1.0],
        metallicFactor=0.94,
        roughnessFactor=0.08,
    ),
    "solar": trimesh.visual.material.PBRMaterial(
        name="Solar cells",
        baseColorFactor=[0.018, 0.085, 0.19, 1.0],
        metallicFactor=0.48,
        roughnessFactor=0.28,
    ),
}


PARTS = [
    # name, colour folder, material, position xyz, rotation xyz, face target
    ("Telescope_Tube", "White_parts", "white", (0, 0, 77), (0, 0, 0), 22000),
    ("Payload_Module_Cover", "Black_parts", "black", (0, 0, 77), (0, 0, 0), 16000),
    ("Telescope_Cover", "White_parts", "white", (0, 0, 144), (0, 0, 0), 15000),
    ("Interior_Telescope_Cover", "Black_parts", "black", (0, 0, 143), (0, 0, 0), 12000),
    ("Upper_Spider", "Black_parts", "black", (0, 0, 137), (0, 0, 0), 18000),
    ("Mirror", "Silver_parts", "mirror", (0, 0, 14), (0, 0, 0), 14000),
    ("Lower_Telescope_Ring", "Gold_parts", "gold_dark", (0, 0, 8), (0, 0, 0), 15000),
    ("Payload_Module", "Gold_parts", "gold", (0, 0, -20), (0, 0, 0), 7000),
    ("Service_Module", "Gold_parts", "gold_dark", (0, 25, -62), (0, 0, 0), 6500),
    ("Lower_Cover", "Gold_parts", "gold", (0, 18, -88), (0, 0, 0), 14000),
    # The printable panel parts lie flat; rotate them into the spacecraft's rear plane.
    ("Golden_Back_Plate", "Gold_parts", "gold", (0, 76, 34), (np.pi / 2, 0, 0), 220),
    ("Solar_Panels", "Blue_parts", "solar", (0, 73, 34), (np.pi / 2, 0, 0), 4900),
    ("Silver_Back_Plate", "Silver_parts", "silver", (0, 79, 15), (np.pi / 2, 0, 0), 500),
    ("Side_Bars", "Gold_parts", "gold", (0, 58, 12), (np.pi / 2, 0, 0), 40),
    ("Side_Bar_Supports", "Gold_parts", "gold_dark", (0, 55, -43), (0, 0, 0), 3500),
    ("Antenna", "Silver_parts", "silver", (-88, -5, -69), (0, 0.22, -0.42), 18000),
    ("Star_Tracker", "Gold_parts", "gold", (74, -27, -47), (0.1, 0.65, 0), 12000),
    ("Star_Tracker_Support", "Gold_parts", "gold_dark", (66, -18, -49), (0.1, 0.65, 0), 2100),
    ("Radiator_Plate_1", "White_parts", "white", (-39, -69, -55), (np.pi / 2, 0, 0), 450),
    ("Radiator_Plate_2", "White_parts", "white", (39, -69, -55), (np.pi / 2, 0, 0), 1600),
]


def transform_matrix(position: tuple[float, float, float], rotation: tuple[float, float, float]) -> np.ndarray:
    transform = trimesh.transformations.euler_matrix(*rotation, axes="sxyz")
    transform[:3, 3] = position
    return transform


def find_part(source: Path, folder: str, name: str) -> Path:
    path = source / folder / f"{name}.stl"
    if not path.exists():
        raise FileNotFoundError(f"Missing official model part: {path}")
    return path


def build(source: Path, output: Path) -> None:
    scene = trimesh.Scene()

    for name, folder, material_name, position, rotation, face_target in PARTS:
        mesh = trimesh.load_mesh(find_part(source, folder, name), process=True)
        mesh.apply_translation(-mesh.bounding_box.centroid)

        if len(mesh.faces) > face_target:
            mesh = mesh.simplify_quadric_decimation(face_count=face_target)

        mesh.visual = trimesh.visual.TextureVisuals(material=COLOURS[material_name])
        scene.add_geometry(
            mesh,
            geom_name=name,
            node_name=name,
            transform=transform_matrix(position, rotation),
        )

    # Centre the complete spacecraft and make +Y its "up" axis in Three.js.
    bounds = scene.bounds
    centre = (bounds[0] + bounds[1]) / 2
    centre_transform = np.eye(4)
    centre_transform[:3, 3] = -centre
    scene.apply_transform(centre_transform)
    scene.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))

    output.parent.mkdir(parents=True, exist_ok=True)
    glb = scene.export(file_type="glb")
    output.write_bytes(glb)

    fallback = output.with_suffix(".base64.js")
    encoded = base64.b64encode(glb).decode("ascii")
    fallback.write_text(
        'window.EUCLID_SPACECRAFT_GLB_BASE64="' + encoded + '";\n',
        encoding="ascii",
    )

    triangles = sum(len(geometry.faces) for geometry in scene.geometry.values())
    print(f"Wrote {output} ({len(glb):,} bytes, {triangles:,} triangles)")
    print(f"Wrote {fallback} ({fallback.stat().st_size:,} bytes)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build(args.source.resolve(), args.output.resolve())


if __name__ == "__main__":
    main()
