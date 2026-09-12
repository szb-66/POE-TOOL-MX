export const effectOptionLabel = option => option
  ? `${option.name} · ${option.tier === 'major' ? '主要':'次要'}${option.kind === 'boon' ? '恩赐':'痛苦'} · ${(option.descriptions || []).join('；') || '暂无描述'}`
  : '词条已删除'
