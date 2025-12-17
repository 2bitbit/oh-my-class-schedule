"""
用于统一更新所有位置下的版本号
"""

from pathlib import Path
import json
import tomlkit
import re
import sys


def update_version(new_version):
    """
    在根目录运行 python scripts/release.py 1.0.1 即可自动更新 package.json, tauri.conf.json 和 Cargo.toml 中的版本号。
    """

    def update_toml(file_path, key_1, key_2, new_value):
        with open(file_path, "r", encoding="utf-8") as f:
            data = tomlkit.load(f)

        data[key_1][key_2] = new_value
        with open(file_path, "w", encoding="utf-8") as f:
            tomlkit.dump(data, f)

        print(f"Updated {file_path}")

    def update_json(file_path, key, new_value):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        data[key] = new_value
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"Updated {file_path}")

    # 1. Update package.json
    update_json("package.json", "version", new_version)

    # 2. Update tauri.conf.json
    update_json("src-tauri/tauri.conf.json", "version", new_version)

    # 3. Update Cargo.toml
    update_toml("src-tauri/Cargo.toml", "package", "version", new_version)


def git_push(new_version):
    print("=======================================================")
    print("\033[92mPlease run git tag v{}\033[0m".format(new_version))
    print("\033[92mAnd then run git push origin v{}\033[0m".format(new_version))


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/release.py <new_version>")
        sys.exit(1)
    if not re.match(r"^\d+\.\d+\.\d+$", sys.argv[1]):
        print("Version must be in the format X.Y.Z")
        sys.exit(1)
    if Path(".").absolute().name != "oh-my-class-schedule":
        print("Please run this script in the root directory")
        sys.exit(1)

    new_version = sys.argv[1]
    update_version(new_version)
    git_push(new_version)


if __name__ == "__main__":
    main()
