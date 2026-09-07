## Context

模板路径由 Electron 写入临时 JSON，再由 Python 检测器读取。当前 Python 直接调用 `cv2.imread(path, cv2.IMREAD_GRAYSCALE)`；OpenCV 在 Windows 上对非 ASCII 文件路径的支持不稳定，因此路径存在但解码结果为空，最终被统一报告为模板无法加载。

## Goals / Non-Goals

**Goals:**

- 可靠读取包含中文及其他 Unicode 字符的本地模板路径。
- 继续以灰度图进行匹配，并保留无效或空图片的拒绝行为。
- 通过真实临时 Unicode 路径执行 Python 回归测试。

**Non-Goals:**

- 不修改模板采集、路径持久化或匹配算法。
- 不增加新的图像处理依赖。
- 不改变现有错误事件协议。

## Decisions

- 先用 NumPy 从文件读取原始字节，再交给 `cv2.imdecode(..., cv2.IMREAD_GRAYSCALE)` 解码。NumPy 的文件读取使用 Python 的 Unicode 路径处理，避开 `cv2.imread` 的 Windows 路径限制，同时保持 OpenCV 解码与灰度输出。
- 将读取封装为小型辅助函数，并让模板加载器统一调用，便于独立测试和维持失败时返回空结果的现有语义。
- 回归测试直接运行 Python 脚本中的加载逻辑，并在中文临时目录下生成两张 PNG，覆盖真实跨进程路径行为。

## Risks / Trade-offs

- [文件读取与解码拆成两步，会短暂多占用一份图片字节内存] → 标题模板尺寸很小，额外内存可忽略。
- [文件权限或损坏图片仍会加载失败] → 保持安全失败，并由现有启动错误处理反馈给用户。
