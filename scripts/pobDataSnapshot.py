"""Read identity data using the installed PoB Lua runtime; never launch or modify PoB.

The resulting small, hashed snapshot is consumed offline by the mapping generator.
"""
import ctypes as C
import hashlib
import json
import os
from pathlib import Path

POB_COMMIT = 'b32759ab0f31a1c8499a0d420cb0f0633d4fe478'


def snapshot(root):
    root = Path(root).resolve()
    files = sorted((root / 'Data/Bases').glob('*.lua')) + sorted((root / 'Data/Uniques').glob('*.lua'))
    files += [root / 'Data/Gems.lua', root / 'TreeData/3_29/tree.lua']
    sources = [{'path': p.relative_to(root).as_posix(),
                'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
    dll_dir = os.add_dll_directory(str(root))
    lua = C.CDLL(str(root / 'lua51.dll'))
    lua.luaL_newstate.restype = C.c_void_p
    for name, args in {'luaL_openlibs': [C.c_void_p], 'luaL_loadstring': [C.c_void_p, C.c_char_p],
                       'lua_pcall': [C.c_void_p, C.c_int, C.c_int, C.c_int],
                       'lua_tolstring': [C.c_void_p, C.c_int, C.c_void_p], 'lua_close': [C.c_void_p]}.items():
        getattr(lua, name).argtypes = args
    lua.lua_tolstring.restype = C.c_char_p
    state = lua.luaL_newstate()
    lua.luaL_openlibs(state)
    # All Lua files come from the explicitly selected local PoB data installation.
    source = 'local root = ' + json.dumps(root.as_posix(), ensure_ascii=False) + '\n'
    source += "local function read(p, ...) return assert(loadfile(root .. '/' .. p))(...) end\nlocal bases, uniques = {}, {}\n"
    for p in files:
        relative = p.relative_to(root).as_posix()
        if '/Bases/' in '/' + relative:
            source += f'read({json.dumps(relative)}, bases)\n'
        elif '/Uniques/' in '/' + relative:
            source += f'for _, v in ipairs(read({json.dumps(relative)})) do if type(v) == "string" then uniques[#uniques+1] = v end end\n'
    source += '''
local result = {bases={}, uniques={}, gems={}, nodes={}}
for name, base in pairs(bases) do result.bases[#result.bases+1] = {en=name, type=base.type} end
for _, text in ipairs(uniques) do
 local name = text:match("^%s*([^\\n]+)")
 for line in text:gmatch('[^\\n]+') do
  local base = line:gsub('^%{variant:[^}]+%}', '')
  if bases[base] then result.uniques[#result.uniques+1] = {en=name, base=base} end
 end
end
for _, gem in pairs(read('Data/Gems.lua')) do
 result.gems[#result.gems+1] = {en=gem.name, base=gem.baseTypeName, id=gem.gameId, variant=gem.variantId, effect=gem.grantedEffectId}
end
local tree = read('TreeData/3_29/tree.lua')
result.classes = tree.classes
result.jewelSlots = tree.jewelSlots
for id, node in pairs(tree.nodes) do
 if type(node) == 'table' and node.name and tonumber(id) then
  result.nodes[#result.nodes+1] = {id=tonumber(id), en=node.name, keystone=node.isKeystone, notable=node.isNotable, ascendancy=node.ascendancyName, tattoo=node.isTattoo}
 end
end
local json = read('lua/dkjson.lua')
return json.encode(result)
'''
    try:
        status = lua.luaL_loadstring(state, source.encode('utf-8'))
        if not status:
            status = lua.lua_pcall(state, 0, 1, 0)
        text = lua.lua_tolstring(state, -1, None).decode('utf-8')
        if status:
            raise RuntimeError(text)
        result = json.loads(text)
    finally:
        lua.lua_close(state)
        dll_dir.close()
    for key in ['bases', 'uniques', 'gems', 'nodes']:
        result[key].sort(key=lambda x: json.dumps(x, sort_keys=True))
    return {'version': '2.67.2', 'commit': POB_COMMIT, 'sources': sources, **result}
