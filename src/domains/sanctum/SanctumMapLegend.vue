<template>
  <div class="map-legend" aria-label="路径状态图例">
    <span class="completed">━ ✓ 已完成</span><span class="unreachable">━ × 不可达</span>
    <span class="reachable">─ 可达</span><span class="recommended">━━➤ 推荐路径</span>
    <span class="recommended">▣ 推荐房间</span><span class="current">◎ 当前</span><span class="unknown">┄ 未知</span>
  </div>
</template>
<style scoped lang="less">
.map-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 10px 12px; margin: 10px 0;
  background: #151b24; border-radius: 6px; font-size: 12px; line-height: 1.5;
  span { white-space: nowrap; } .completed { color: #b99a58; } .unreachable { color: #e77f87; }
  .reachable { color: #91a8bf; } .recommended { color: #69efad; } .current { color: #55c9ed; } .unknown { color: #a4adbb; }
}
</style>
