"""Check local imports without executing automation code (including lazy imports)."""
import ast
import json
from pathlib import Path
import sys


def check(payload):
    root = Path(payload['resourcesRoot'])
    local = set(payload['modules'])
    errors = []
    for relative in payload['targets']:
        script = root / relative
        if not script.is_file():
            errors.append(f'{relative}: missing script')
            continue
        try:
            tree = ast.parse(script.read_text(encoding='utf-8-sig'), filename=relative)
        except (SyntaxError, UnicodeError) as exc:
            errors.append(f'{relative}:{getattr(exc, "lineno", 0)}: invalid Python source')
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module]
            else:
                continue
            for name in names:
                if name.split('.')[0] not in local:
                    continue
                target = script.parent / (name.replace('.', '/') + '.py')
                if not target.is_file():
                    errors.append(f'{relative}:{node.lineno}: {name} -> {target.relative_to(root).as_posix()} missing')
    return errors


if __name__ == '__main__':
    errors = check(json.load(sys.stdin))
    print(json.dumps(errors, ensure_ascii=True))
    sys.exit(1 if errors else 0)
