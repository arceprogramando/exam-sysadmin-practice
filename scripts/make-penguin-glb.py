"""Cute penguin as a single glTF binary. No textures, so the file stays small."""
import json
import math
import struct
from pathlib import Path

PHI = (1 + math.sqrt(5)) / 2


def norm(v):
    x, y, z = v
    length = math.sqrt(x * x + y * y + z * z) or 1
    return (x / length, y / length, z / length)


def icosphere(radius, subdiv):
    verts = [norm(v) for v in [
        (-1, PHI, 0), (1, PHI, 0), (-1, -PHI, 0), (1, -PHI, 0),
        (0, -1, PHI), (0, 1, PHI), (0, -1, -PHI), (0, 1, -PHI),
        (PHI, 0, -1), (PHI, 0, 1), (-PHI, 0, -1), (-PHI, 0, 1),
    ]]
    faces = [
        (0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11),
        (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
        (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9),
        (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1),
    ]
    midpoint = {}

    def mid(a, b):
        key = (min(a, b), max(a, b))
        if key not in midpoint:
            ax, ay, az = verts[a]
            bx, by, bz = verts[b]
            verts.append(norm(((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2)))
            midpoint[key] = len(verts) - 1
        return midpoint[key]

    for _ in range(subdiv):
        nxt = []
        for a, b, c in faces:
            ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
            nxt.extend([(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)])
        faces = nxt
    positions = [(x * radius, y * radius, z * radius) for x, y, z in verts]
    return positions, faces


def cone(radius, height, segments):
    positions = [(0, height / 2, 0), (0, -height / 2, 0)]
    for i in range(segments):
        angle = i / segments * math.tau
        positions.append((math.cos(angle) * radius, -height / 2, math.sin(angle) * radius))
    faces = []
    for i in range(segments):
        nxt = (i + 1) % segments
        faces.append((0, 2 + i, 2 + nxt))
        faces.append((1, 2 + nxt, 2 + i))
    return positions, faces


def transform(positions, scale, translate):
    sx, sy, sz = scale
    tx, ty, tz = translate
    return [(x * sx + tx, y * sy + ty, z * sz + tz) for x, y, z in positions]


def smooth_normals(positions, faces):
    normals = [[0.0, 0.0, 0.0] for _ in positions]
    for a, b, c in faces:
        ax, ay, az = positions[a]
        bx, by, bz = positions[b]
        cx, cy, cz = positions[c]
        nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay)
        ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
        nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        for index in (a, b, c):
            normals[index][0] += nx
            normals[index][1] += ny
            normals[index][2] += nz
    return [norm(n) for n in normals]


parts = []


def add(positions, faces, color, rough):
    parts.append((positions, faces, smooth_normals(positions, faces), color, rough))


def blob_sphere(radius, subdiv, scale, translate, color, rough):
    positions, faces = icosphere(radius, subdiv)
    add(transform(positions, scale, translate), faces, color, rough)


BLACK = (0.11, 0.12, 0.14, 1)
WHITE = (0.97, 0.96, 0.93, 1)
ORANGE = (1.0, 0.62, 0.08, 1)
BLUE = (0.22, 0.48, 0.82, 1)
PUPIL = (0.04, 0.05, 0.08, 1)
MOUTH = (0.72, 0.22, 0.16, 1)

blob_sphere(1, 3, (1.12, 1.22, 0.98), (0, 1.05, 0), BLACK, 0.55)
blob_sphere(0.78, 3, (0.98, 1.2, 0.55), (0, 0.95, 0.48), WHITE, 0.62)
blob_sphere(0.86, 3, (1.08, 1.05, 1.02), (0, 2.28, 0.02), BLACK, 0.5)
blob_sphere(0.62, 3, (0.92, 1.05, 0.48), (0, 2.12, 0.48), WHITE, 0.58)

eye, eye_faces = icosphere(0.28, 2)
iris, iris_faces = icosphere(0.16, 2)
pupil, pupil_faces = icosphere(0.09, 1)
shine, shine_faces = icosphere(0.045, 1)
for side in (-1, 1):
    blob_sphere(0.28, 2, (1, 1.08, 0.78), (side * 0.32, 2.32, 0.62), WHITE, 0.08)
    blob_sphere(0.16, 2, (1, 1, 0.72), (side * 0.32, 2.3, 0.82), BLUE, 0.05)
    blob_sphere(0.09, 1, (1, 1.05, 0.55), (side * 0.32, 2.28, 0.92), PUPIL, 0.04)
    blob_sphere(0.04, 1, (1, 1, 1), (side * 0.38, 2.4, 0.98), (1, 1, 1, 1), 0.02)
    blob_sphere(0.02, 1, (1, 1, 1), (side * 0.26, 2.22, 0.96), (0.85, 0.95, 1, 1), 0.02)

beak, beak_faces = cone(0.18, 0.42, 16)
add(transform(beak, (1.25, 0.62, 1.05), (0, 2.05, 0.98)), beak_faces, ORANGE, 0.28)
add(transform(beak, (0.7, 0.28, 0.55), (0, 1.92, 1.08)), beak_faces, MOUTH, 0.4)

flipper, flipper_faces = icosphere(0.32, 2)
for side in (-1, 1):
    add(transform(flipper, (0.42, 1.55, 0.72), (side * 1.12, 1.15, 0.02)), flipper_faces, BLACK, 0.55)

foot, foot_faces = icosphere(0.34, 2)
toe, toe_faces = icosphere(0.12, 1)
for side in (-1, 1):
    add(transform(foot, (1.25, 0.32, 1.55), (side * 0.42, 0.06, 0.32)), foot_faces, ORANGE, 0.35)
    for toe_x in (-0.18, 0, 0.18):
        add(transform(toe, (1.1, 0.5, 1.35), (side * 0.42 + toe_x, 0.05, 0.72)), toe_faces, ORANGE, 0.32)

blob = bytearray()
accessors = []
views = []
meshes = []
nodes = []
materials = []


def align():
    while len(blob) % 4:
        blob.append(0)


def push(data):
    align()
    offset = len(blob)
    blob.extend(data)
    return offset


for positions, faces, normals, color, rough in parts:
    pos_bytes = b"".join(struct.pack("<3f", *p) for p in positions)
    nrm_bytes = b"".join(struct.pack("<3f", *n) for n in normals)
    idx = []
    for face in faces:
        idx.extend(face)
    idx_bytes = b"".join(struct.pack("<H", i) for i in idx)
    pos_off = push(pos_bytes)
    views.append({"buffer": 0, "byteOffset": pos_off, "byteLength": len(pos_bytes), "target": 34962})
    xs = [p[0] for p in positions]
    ys = [p[1] for p in positions]
    zs = [p[2] for p in positions]
    accessors.append({
        "bufferView": len(views) - 1,
        "componentType": 5126,
        "count": len(positions),
        "type": "VEC3",
        "min": [min(xs), min(ys), min(zs)],
        "max": [max(xs), max(ys), max(zs)],
    })
    pos_accessor = len(accessors) - 1
    nrm_off = push(nrm_bytes)
    views.append({"buffer": 0, "byteOffset": nrm_off, "byteLength": len(nrm_bytes), "target": 34962})
    accessors.append({
        "bufferView": len(views) - 1,
        "componentType": 5126,
        "count": len(normals),
        "type": "VEC3",
    })
    idx_off = push(idx_bytes)
    views.append({"buffer": 0, "byteOffset": idx_off, "byteLength": len(idx_bytes), "target": 34963})
    accessors.append({
        "bufferView": len(views) - 1,
        "componentType": 5123,
        "count": len(idx),
        "type": "SCALAR",
    })
    materials.append({
        "pbrMetallicRoughness": {
            "baseColorFactor": list(color),
            "metallicFactor": 0,
            "roughnessFactor": rough,
        },
        "doubleSided": True,
    })
    meshes.append({
        "primitives": [{
            "attributes": {"POSITION": pos_accessor, "NORMAL": pos_accessor + 1},
            "indices": len(accessors) - 1,
            "material": len(materials) - 1,
        }]
    })
    nodes.append({"mesh": len(meshes) - 1})

gltf = {
    "asset": {"version": "2.0", "generator": "rhcsa penguin"},
    "scene": 0,
    "scenes": [{"nodes": list(range(len(nodes)))}],
    "nodes": nodes,
    "meshes": meshes,
    "materials": materials,
    "accessors": accessors,
    "bufferViews": views,
    "buffers": [{"byteLength": len(blob)}],
}

raw = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
while len(raw) % 4:
    raw += b" "
align()
bin_chunk = bytes(blob)
while len(bin_chunk) % 4:
    bin_chunk += b"\x00"
total = 12 + 8 + len(raw) + 8 + len(bin_chunk)
out = struct.pack("<III", 0x46546C67, 2, total)
out += struct.pack("<II", len(raw), 0x4E4F534A) + raw
out += struct.pack("<II", len(bin_chunk), 0x004E4942) + bin_chunk
path = Path(__file__).resolve().parents[1] / "public" / "penguin.glb"
path.write_bytes(out)
print(path, len(out))
