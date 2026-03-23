from __future__ import annotations

import fnmatch
from pathlib import Path


def _should_skip(path: Path, root: Path) -> bool:
    # Never overwrite/include the output file itself.
    if path.name == "CODE_DUMP.txt":
        return True

    # Skip git + common caches/build artifacts.
    parts = set(path.relative_to(root).parts)
    if ".git" in parts:
        return True

    skip_dirs = {
        "__pycache__",
        ".venv",
        "venv",
        "env",
        "ENV",
        ".pytest_cache",
        ".mypy_cache",
        ".ruff_cache",
        "dist",
        "build",
        ".cursor",
    }
    if any(part in skip_dirs for part in parts):
        return True

    # Never include secrets/env.
    if fnmatch.fnmatch(path.name, ".env*"):
        return True

    return False


def _read_text(path: Path) -> str:
    # Deterministic UTF-8 read; tolerate odd characters.
    return path.read_text(encoding="utf-8", errors="replace")


def generate_code_dump(
    root_dir: Path,
    output_path: Path,
) -> None:
    root_dir = root_dir.resolve()
    output_path = output_path.resolve()

    included: list[Path] = []

    gitignore = root_dir / ".gitignore"
    if gitignore.exists():
        included.append(gitignore)

    python_dir = root_dir / "python"
    if python_dir.exists():
        for p in python_dir.rglob("*.py"):
            if not _should_skip(p, root_dir):
                included.append(p)

    included = sorted(included, key=lambda p: str(p.relative_to(root_dir)).replace("\\", "/"))

    header = (
        "# CODE DUMP\n"
        "# Regenerated from repository files.\n"
        "# Skips any .env* files and common cache/build directories.\n"
        "\n"
    )

    with output_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write(header)

        for p in included:
            rel = p.relative_to(root_dir).as_posix()
            f.write(f"# ===== FILE: {p.as_posix()} =====\n")
            content = _read_text(p)
            if content:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            f.write(f"\n# ===== END FILE: {p.as_posix()} =====\n\n")


if __name__ == "__main__":
    repo_root = Path(__file__).parent
    generate_code_dump(
        root_dir=repo_root,
        output_path=repo_root / "CODE_DUMP.txt",
    )
    print("CODE_DUMP.txt regenerated.")

