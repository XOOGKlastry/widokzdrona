"""Verify exported ZIP with an independent standard-library implementation."""
import io
import json
import os
from pathlib import Path
import re
import zipfile

archive = Path(os.environ.get("RUNNER_TEMP", ".")) / "gallery-regression.zip"
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None, "Outer ZIP CRC mismatch"
    photos = [name for name in bundle.namelist() if name.startswith("zdjecia/")]
    assert len(photos) == 92
    page = bundle.read("galeria.html").decode("utf-8")
    assert len(page.encode("utf-8")) < 200_000, "HTML must not contain large photo payloads"
    payload = re.search(r'<script id="project" type="application/json">([\s\S]*?)</script>', page)
    data = json.loads(payload.group(1))
    assert data["viewer"] and data["photosArchive"]
    assert len(data["frames"]) == 92
    assert data["frames"][0]["title"] == "Łąka </script>"
    assert data["frames"][91]["yaw"] == 91
    assert all(f["image"].startswith("zdjecia/") for f in data["frames"])
    assert all(f["width"] == 3840 and f["height"] == 2160 for f in data["frames"])
    with zipfile.ZipFile(io.BytesIO(bundle.read("Zdjecia-z-drona.zip"))) as download:
        assert len(download.namelist()) == 92
        assert download.testzip() is None, "Download ZIP CRC mismatch"
        for name in download.namelist():
            picture = download.read(name)
            assert len(picture) == 1024 * 1024
            assert picture == bundle.read("zdjecia/" + name)
print("PASS: both ZIP archives, all 92 original payloads, lightweight HTML, Unicode titles, GPS and camera direction.")
