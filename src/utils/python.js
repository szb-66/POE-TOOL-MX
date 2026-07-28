/**
 * Purpose: Python 脚本生成和执行工具，负责根据配置生成 Python 脚本内容
 * Inputs: config (object) - 物品或地图制作配置
 * Outputs: Python 脚本内容（string）
 * Preconditions: Electron 环境已初始化
 * Edge cases: 配置缺失时使用默认值；模板加载失败时返回空字符串
 * Errors: 生成失败时返回空字符串，不抛出异常
 */

import craftingTemplate from '@/assets/scripts/crafting_template.py?raw'
import mapRollingTemplate from '@/assets/scripts/map_rolling_template.py?raw'
import { electronApi } from '@/api/electron.js'
import { normalizeOperationDelay } from '@/utils/operationDelay.js'
import { normalizeEmptySlotThreshold } from '@/utils/inventorySettings.js'

const DPI_AWARENESS = `def enable_per_monitor_dpi_awareness():
    """让 Windows API 坐标始终按虚拟桌面的物理像素解释。"""
    if sys.platform != 'win32':
        return False
    import ctypes
    user32 = ctypes.windll.user32
    try:
        user32.SetProcessDpiAwarenessContext.argtypes = [ctypes.c_void_p]
        user32.SetProcessDpiAwarenessContext.restype = ctypes.c_bool
        if user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return True
    except Exception:
        pass
    try:
        return ctypes.windll.shcore.SetProcessDpiAwareness(2) == 0
    except Exception:
        try:
            return bool(user32.SetProcessDPIAware())
        except Exception:
            return False


enable_per_monitor_dpi_awareness()
`

/**
 * Purpose: 执行Python脚本
 * Inputs: scriptPath (string) - 脚本路径，args (Array) - 脚本参数
 * Outputs: Promise - 执行结果
 * Preconditions: Electron 环境已初始化
 * Edge cases: 脚本不存在时返回错误
 * Errors: 执行失败时 Promise reject
 */
export async function executePythonScript(scriptPath, args = []) {
  return electronApi.script.executePython(scriptPath, args)
}

/**
 * 生成Python脚本内容 (物品制作)
 * @param {Object} config - 配置对象
 * @returns {string} Python脚本内容
 */
export function generatePythonScript(config) {
  const {
    globalShortcuts,
    currencyPositions,
    operationDelayMs,
    itemPosition,
    preset,
    filePaths,
    dpiScale = 1.0 // 默认DPI缩放比例
  } = config

  const itemInfoFile = filePaths?.itemInfoFile || 'temp/item_info.txt'
  const itemInfoResultFile = filePaths?.itemInfoResultFile || 'temp/item_info_result.json'
  const normalizedOperationDelayMs = normalizeOperationDelay(operationDelayMs)
  const operationDelaySeconds = (normalizedOperationDelayMs / 1000).toFixed(3)

  // 转义文件路径中的反斜杠（Python使用原始字符串）
  const escapePath = (path) => path.replace(/\\/g, '\\\\')

  // 转换Electron快捷键格式为pynput格式
  const toPynputHotkey = (shortcut) => {
    if (!shortcut) return null
    
    const parts = shortcut.split('+').map(p => p.trim())
    const pynputParts = parts.map(part => {
      const lower = part.toLowerCase()
      switch(lower) {
        case 'commandorcontrol':
        case 'cmdorctrl':
        case 'control':
        case 'ctrl':
          return '<ctrl>'
        case 'alt':
          return '<alt>'
        case 'shift':
          return '<shift>'
        case 'meta':
        case 'super':
          return '<cmd>'
        case 'space':
          return '<space>'
        case 'enter':
        case 'return':
          return '<enter>'
        case 'esc':
        case 'escape':
          return '<esc>'
        case 'tab':
          return '<tab>'
        case 'up':
          return '<up>'
        case 'down':
          return '<down>'
        case 'left':
          return '<left>'
        case 'right':
          return '<right>'
        default:
          // F1-F12
          if (/^f\d+$/.test(lower)) {
            return '<' + lower + '>'
          }
          // Single characters
          return lower
      }
    })
    
    return pynputParts.join('+')
  }

  // 生成词缀匹配逻辑
  const generateAffixMatchingLogic = () => {
    if (!preset.moduleTwo || !preset.moduleTwo.enabled) {
      return 'def craft_affixes():\n    return True'
    }

    const mode = preset.moduleTwo.mode || 'alteration'
    const enableAugmentation = preset.moduleTwo.enableAugmentation || false
    const enableRegal = preset.moduleTwo.enableRegal || false
    const enableExalted = preset.moduleTwo.enableExalted || false

    let logic = `def craft_affixes():
    # 词缀匹配逻辑
    try:
        print(f"[开始] 词缀匹配流程")
        
        # 移动到物品位置
        # print(f"[操作] 移动鼠标到物品位置以读取信息: ({item_position['x']}, {item_position['y']})")
        if not move_mouse(item_position['x'], item_position['y']):
            print("[错误] 初始移动到物品位置失败")
            return False
        time.sleep(0.02)
        
        # 读取当前物品信息
        if not read_clipboard_to_file():
            print("[错误] 初始读取物品信息失败")
            return False
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 初始解析错误: {result.get('error')}")
            return False
        
        if result.get("isLegendary", False):
            print("[停止] 检测到传奇物品，无法制作")
            time.sleep(3)
            return False
        
        # 预处理：确保物品进入正确的起始状态
        # print("[预处理] 开始状态检查...")
        preprocess_limit = 10
        preprocess_count = 0
        
        while preprocess_count < preprocess_limit:
            rarity = result.get("rarity", "").replace(" ", "")
            
            # 根据模式判断是否满足条件
            is_ready = False
            action_needed = None
`

    if (mode === 'alteration') {
      logic += `
            if rarity == "魔法":
                is_ready = True
            elif rarity == "普通":
                action_needed = "transmutation"
            else:
                # 其他情况（如稀有）都需要重铸
                action_needed = "scouring"
`
    } else if (mode === 'chaos') {
      logic += `
            if rarity == "稀有":
                is_ready = True
            elif rarity == "普通":
                action_needed = "alchemy"
            else:
                # 魔法物品需要重铸
                action_needed = "scouring"
`
    } else if (mode === 'alchemy') {
      logic += `
            # 点金模式：从普通开始点金
            if rarity == "普通":
                is_ready = True
            else:
                action_needed = "scouring"
`
    }

    logic += `
            if is_ready:
                # print(f"[预处理] 物品状态符合要求 ({rarity})，准备开始")
                break
            
            print(f"[预处理] 当前状态: {rarity}，执行操作: {action_needed}")
            
            if action_needed == "transmutation":
                print("[预处理] 普通物品 -> 使用蜕变石")
                if not apply_currency("transmutation"): 
                    print("[错误] 使用蜕变石失败")
                    return False
            elif action_needed == "alchemy":
                print("[预处理] 普通物品 -> 使用点金石")
                if not apply_currency("alchemy"):
                    print("[错误] 使用点金石失败")
                    return False
            elif action_needed == "scouring":
                print(f"[预处理] {rarity}物品 -> 使用重铸石")
                if not apply_currency("scouring"):
                    print("[错误] 使用重铸石失败")
                    return False
            
            time.sleep(0.05)
            
            # 重新读取物品信息
            if not read_clipboard_to_file():
                print("[错误] 读取物品信息失败")
                return False
            
            result = wait_for_parse_result()
            if result.get("error"):
                print(f"[错误] 解析错误: {result.get('error')}")
                return False
                
            preprocess_count += 1
        
        if preprocess_count >= preprocess_limit:
            print("[警告] 预处理超时，尝试直接开始...")
`
        
    logic += `
        # 开始制作循环
        max_iterations = 1000
        iteration = 0
        
        print(f"[开始] 制作循环 (最大 {max_iterations} 次)")
        # print("[调试] 进入循环，is_running =", is_running)
        
        while is_running:
            iteration += 1
            if iteration % 10 == 0 or iteration == 1:
                print(f"[进度] 第 {iteration} 次")

            # 将当前循环次数写入结果文件供前端显示
            try:
                # 读取现有结果
                current_result = {}
                if os.path.exists(item_info_result_file):
                    with open(item_info_result_file, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                        if content:
                            current_result = json.loads(content)
                
                # 更新循环次数
                current_result['iteration'] = iteration
                
                # 写入文件
                with open(item_info_result_file, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(current_result))
            except Exception as e:
                # 写入循环次数失败不影响主流程
                pass
            
            # 检查是否应该停止
            if not is_running:
                print("[停止] 收到停止信号")
                return False
            
            if iteration > max_iterations:
                print(f"[停止] 达到最大循环次数 ({max_iterations})，停止制作")
                time.sleep(3)
                return False
            
            # print(f"[调试] 第 {iteration} 次循环开始，准备使用通货...")
            
`

    if (mode === 'alteration') {
      logic += `
            # 使用改造石
            print(f"[操作] 第 {iteration} 次 - 使用改造石")
            if not apply_currency("alteration"):
                print("[错误] 使用改造石失败，重试...")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`
    } else if (mode === 'chaos') {
      logic += `
            # 使用混沌石
            print(f"[操作] 第 {iteration} 次 - 使用混沌石")
            if not apply_currency("chaos"):
                print("[错误] 使用混沌石失败，跳过本次循环")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`
    } else if (mode === 'alchemy') {
      logic += `
            # 点金石模式循环：检查是否需要重铸
            # 如果物品不是普通品质（例如已经是稀有），先重铸
            current_rarity = result.get("rarity", "").replace(" ", "")
            if current_rarity != "普通":
                print(f"[操作] 第 {iteration} 次 - 物品非普通 ({current_rarity})，使用重铸石")
                if not apply_currency("scouring"):
                    print("[错误] 使用重铸石失败，跳过")
                    time.sleep(0.05)
                    continue
                time.sleep(0.05)
            
            # 使用点金石
            print(f"[操作] 第 {iteration} 次 - 使用点金石")
            if not apply_currency("alchemy"):
                print("[错误] 使用点金石失败，跳过本次循环")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`
    }

    logic += `
            # 复制物品并读取
            # print(f"[调试] 第 {iteration} 次 - 开始读取物品信息...")
            if not read_clipboard_to_file():
                print("[错误] 读取物品信息失败，重试...")
                time.sleep(0.05)
                continue
            
            # print(f"[调试] 第 {iteration} 次 - 等待解析结果...")
            result = wait_for_parse_result()
            
            # 检查解析结果是否有错误
            if result.get("error"):
                error_msg = result.get('error', '未知错误')
                print(f"[错误] 解析错误: {error_msg}，重试...")
                # 如果是超时错误，增加等待时间
                if "超时" in error_msg or "等待" in error_msg:
                    print("[提示] 可能是文件监听器未启动，请检查主进程")
                time.sleep(1)
                continue
            
            # print(f"[调试] 第 {iteration} 次 - 解析成功，检查是否需要增幅...")
            
            if result.get("isLegendary", False):
                print("[停止] 检测到传奇物品，停止制作")
                time.sleep(3)
                return False
            
            # 增幅石判定逻辑 (先于匹配检查)
            # 只有在改造石模式且启用了增幅石，且只有1条词缀时使用
            # 注意：不检查是否已经匹配，因为只有1条词缀必然不满足"可能有2条词缀"的完美情况(除非只要1条)，
            # 但既然开了增幅石，通常是希望补满词缀再判断
            should_augment = False
            if ${mode === 'alteration' && enableAugmentation ? 'True' : 'False'} and result.get("rarity") == "魔法":
                explicit_mods = result.get("explicitMods", [])
                
                # 只有1条词缀就直接使用增幅
                if len(explicit_mods) == 1:
                    print(f"[提示] 检测到单词缀，先使用增幅石...")
                    should_augment = True

            if should_augment:
                # 使用增幅石
                print("[操作] 使用增幅石 (单词缀)")
                if not apply_currency("augmentation"):
                    print("[错误] 使用增幅石失败")
                    continue
                time.sleep(0.05)
                
                # 读取新状态
                # print("[调试] 读取增幅后物品信息...")
                if not read_clipboard_to_file():
                    continue
                
                result = wait_for_parse_result()
                if result.get("error"):
                    continue

            # 检查词缀匹配
            affix_match = result.get("affixMatch", False)
            required_all_matched = result.get("requiredAllMatched", False)
            matched_selected_count = result.get("matchedSelectedCount", 0)
            matched_group_name = result.get("matchedGroupName", "")
            explicit_mods = result.get("explicitMods", [])
            detailed_mods = result.get("detailedMods", [])
            print(f"[调试] 第 {iteration} 次 - 词缀匹配检查:")
            print(f"  - affixMatch: {affix_match}")
            print(f"  - requiredAllMatched: {required_all_matched}")
            print(f"  - matchedSelectedCount: {matched_selected_count}")
            if matched_group_name:
                print(f"  - 命中组合: {matched_group_name}")
            print(f"  - explicitMods数量: {len(explicit_mods) if explicit_mods else 0}")
            if explicit_mods:
                print(f"  - explicitMods: {explicit_mods[:3]}...")  # 只显示前3个
            if detailed_mods:
                print(f"  - detailedMods数量: {len(detailed_mods)}")
            if affix_match:
                group_suffix = f" · {matched_group_name}" if matched_group_name else ""
                print(f"[成功] 词缀匹配成功{group_suffix}！(第 {iteration} 次)")
`

    if (mode === 'alteration') {
      if (enableAugmentation) {
        logic += `
                # 使用增幅石
                print("[操作] 使用增幅石")
                if not apply_currency("augmentation"):
                    print("[错误] 使用增幅石失败")
                    return False
                time.sleep(0.05)
`
      }
      if (enableRegal) {
        logic += `
                # 使用富豪石
                print("[操作] 使用富豪石")
                if not apply_currency("regal"):
                    print("[错误] 使用富豪石失败")
                    return False
                time.sleep(0.05)
`
      }
    } else if (mode === 'chaos' && enableExalted) {
      logic += `
                # 使用崇高石
                print("[操作] 使用崇高石")
                if not apply_currency("exalted"):
                    print("[错误] 使用崇高石失败")
                    return False
                time.sleep(0.05)
`
    }

    logic += `
                print("[完成] 词缀制作完成！")
                time.sleep(2)
                return True
            
            elif should_augment:
                # 这一段逻辑已经上移，这里需要移除多余的代码
                pass

            # 未匹配，继续循环
            if iteration % 10 == 0:
                print(f"[检查] 第 {iteration} 次 - 未匹配，继续...")
            continue
    except Exception as e:
        print(f"词缀制作过程出错: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False
`

    return logic
  }

  // 生成插槽制作逻辑
  const generateSocketCraftingLogic = () => {
    if (!preset.moduleThree || !preset.moduleThree.enabled) {
      return 'def craft_sockets():\n    return True'
    }

    const socketConfig = preset.moduleThree.socket || {}
    const linkConfig = preset.moduleThree.link || {}
    const colorConfig = preset.moduleThree.color || {}

    let logic = `def craft_sockets():
    # 插槽制作逻辑
`

    // 开孔流程
    if (socketConfig.enabled && socketConfig.count > 0) {
      logic += `
    # 开孔流程
    if craft_socket_count(${socketConfig.count}):
`
    } else {
      logic += `
    # 跳过开孔流程
    if True:
`
    }

    // 链接流程
    if (linkConfig.enabled && linkConfig.count > 0) {
      logic += `
        # 链接流程
        if craft_links(${linkConfig.count}):
`
    } else {
      logic += `
        # 跳过链接流程
        if True:
`
    }

    // 颜色流程
    if (colorConfig.enabled && (colorConfig.red > 0 || colorConfig.green > 0 || colorConfig.blue > 0)) {
      logic += `
            # 颜色流程
            if craft_colors(${colorConfig.red}, ${colorConfig.green}, ${colorConfig.blue}):
                print("[完成] 插槽制作完成！")
                time.sleep(2)
                return True
`
    } else {
      logic += `
            # 跳过颜色流程
            print("[完成] 插槽制作完成！")
            time.sleep(2)
            return True
`
    }

    logic += `
    return False

def craft_socket_count(target_count):
    # 开孔流程
    print(f"[开始] 开孔流程 (目标: {target_count} 孔)")
    max_iterations = 1000
    iteration = 0
    
    while is_running:
        iteration += 1
        if not is_running:
            print("[停止] 收到停止信号")
            return False
        
        # 将当前循环次数写入结果文件供前端显示
        try:
            # 读取现有结果
            current_result = {}
            if os.path.exists(item_info_result_file):
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            
            # 更新循环次数
            current_result['iteration'] = iteration
            
            # 写入文件
            with open(item_info_result_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(current_result))
        except Exception as e:
            pass

        if iteration > max_iterations:
            print(f"[停止] 开孔达到最大循环次数 ({max_iterations})")
            time.sleep(3)
            return False
        
        # 使用工匠石
        print(f"[操作] 第 {iteration} 次 - 使用工匠石")
        if not right_click_currency("jewellers"):
            print("[错误] 右键点击工匠石失败，重试...")
            time.sleep(0.05)
            continue
        if not left_click_item():
            print("[错误] 左键点击物品失败，重试...")
            time.sleep(0.05)
            continue
        time.sleep(0.05)
        
        # 复制物品并读取
        if not read_clipboard_to_file():
            print("[错误] 读取物品信息失败，重试...")
            time.sleep(0.05)
            continue
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 解析错误: {result.get('error')}，重试...")
            time.sleep(1)
            continue
        
        current_count = result.get("socketsCount", 0)
        if current_count >= target_count:
            print(f"[成功] 插槽数量达到目标 ({current_count}/{target_count})")
            return True
        elif iteration % 20 == 0:
            print(f"[进度] 第 {iteration} 次 - 当前 {current_count}/{target_count} 孔")

def craft_links(target_links):
    # 链接流程
    print(f"[开始] 链接流程 (目标: {target_links} 连)")
    max_iterations = 1000
    iteration = 0
    
    while is_running:
        iteration += 1
        if not is_running:
            print("[停止] 收到停止信号")
            return False
            
        # 将当前循环次数写入结果文件供前端显示
        try:
            # 读取现有结果
            current_result = {}
            if os.path.exists(item_info_result_file):
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            
            # 更新循环次数
            current_result['iteration'] = iteration
            
            # 写入文件
            with open(item_info_result_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(current_result))
        except Exception as e:
            pass

        if iteration > max_iterations:
            print(f"[停止] 链接达到最大循环次数 ({max_iterations})")
            time.sleep(3)
            return False
        
        # 使用链结石
        print(f"[操作] 第 {iteration} 次 - 使用链结石")
        if not right_click_currency("fusing"):
            print("[错误] 右键点击链结石失败，重试...")
            time.sleep(0.05)
            continue
        if not left_click_item():
            print("[错误] 左键点击物品失败，重试...")
            time.sleep(0.05)
            continue
        time.sleep(0.05)
        
        # 复制物品并读取
        if not read_clipboard_to_file():
            print("[错误] 读取物品信息失败，重试...")
            time.sleep(0.05)
            continue
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 解析错误: {result.get('error')}，重试...")
            time.sleep(1)
            continue
        
        current_links = result.get("links", 0)
        if current_links >= target_links:
            print(f"[成功] 链接数量达到目标 ({current_links}/{target_links})")
            return True
        elif iteration % 20 == 0:
            print(f"[进度] 第 {iteration} 次 - 当前 {current_links}/{target_links} 连")

def craft_colors(target_red, target_green, target_blue):
    # 颜色流程
    print(f"[开始] 颜色流程 (目标: 红{target_red} 绿{target_green} 蓝{target_blue})")
    max_iterations = 1000
    iteration = 0
    
    while is_running:
        iteration += 1
        if not is_running:
            print("[停止] 收到停止信号")
            return False
            
        # 将当前循环次数写入结果文件供前端显示
        try:
            # 读取现有结果
            current_result = {}
            if os.path.exists(item_info_result_file):
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            
            # 更新循环次数
            current_result['iteration'] = iteration
            
            # 写入文件
            with open(item_info_result_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(current_result))
        except Exception as e:
            pass

        if iteration > max_iterations:
            print(f"[停止] 颜色达到最大循环次数 ({max_iterations})")
            time.sleep(3)
            return False
        
        # 使用幻色石
        print(f"[操作] 第 {iteration} 次 - 使用幻色石")
        if not right_click_currency("chromic"):
            print("[错误] 右键点击幻色石失败，重试...")
            time.sleep(0.05)
            continue
        if not left_click_item():
            print("[错误] 左键点击物品失败，重试...")
            time.sleep(0.05)
            continue
        time.sleep(0.05)
        
        # 复制物品并读取
        if not read_clipboard_to_file():
            print("[错误] 读取物品信息失败，重试...")
            time.sleep(0.05)
            continue
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 解析错误: {result.get('error')}，重试...")
            time.sleep(1)
            continue
        
        colors = result.get("socketsColors", {})
        current_red = colors.get("red", 0)
        current_green = colors.get("green", 0)
        current_blue = colors.get("blue", 0)
        
        if (current_red >= target_red and 
            current_green >= target_green and 
            current_blue >= target_blue):
            print(f"[成功] 颜色达到目标 (红{current_red} 绿{current_green} 蓝{current_blue})")
            return True
        elif iteration % 20 == 0:
            print(f"[进度] 第 {iteration} 次 - 当前 红{current_red}/{target_red} 绿{current_green}/{target_green} 蓝{current_blue}/{target_blue}")
`

    return logic
  }

  // 准备替换数据
  const stopShortcut = globalShortcuts?.end || 'Alt+3'
  const pynputStopShortcut = toPynputHotkey(stopShortcut) || '<alt>+3'
  
  // 构建通货坐标对象
  const safeCurrencyPositions = {}
  if (currencyPositions) {
    for (const [key, val] of Object.entries(currencyPositions)) {
      if (val) {
        safeCurrencyPositions[key] = {
          x: Math.floor(val.x || 0),
          y: Math.floor(val.y || 0)
        }
      }
    }
  }

  // 构建物品坐标对象
  const safeItemPosition = {
    x: Math.floor(itemPosition?.x || 0),
    y: Math.floor(itemPosition?.y || 0)
  }

  // 填充模板
  let script = craftingTemplate

  // 将JSON字符串中的 true/false 转换为 Python 的 True/False
  const jsonToPython = (jsonStr) => {
    return jsonStr.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False')
  }

  const replacements = {
    '{{GEN_DATE}}': new Date().toLocaleString(),
    '{{ITEM_INFO_FILE}}': escapePath(itemInfoFile),
    '{{ITEM_INFO_RESULT_FILE}}': escapePath(itemInfoResultFile),
    '{{DELAY_MOUSE_MOVE}}': operationDelaySeconds,
    '{{DELAY_MOUSE_CLICK}}': operationDelaySeconds,
    '{{DELAY_CLIPBOARD}}': normalizedOperationDelayMs.toFixed(0),
    '{{CURRENCY_POSITIONS}}': jsonToPython(JSON.stringify(safeCurrencyPositions)),
    '{{ITEM_POSITION}}': jsonToPython(JSON.stringify(safeItemPosition)),
    '{{DPI_SCALE_FACTOR}}': String(Math.min(3, Math.max(1, Number(dpiScale) || 1))),
    '{{STOP_SHORTCUT}}': stopShortcut,
    '{{PYNPUT_STOP_SHORTCUT}}': pynputStopShortcut,
    '{{ENABLE_AFFIX}}': preset.moduleTwo?.enabled ? 'True' : 'False',
    '{{ENABLE_SOCKET}}': preset.moduleThree?.enabled ? 'True' : 'False',
    '{{AFFIX_CRAFTING_FUNC}}': generateAffixMatchingLogic(),
    '{{SOCKET_CRAFTING_FUNC}}': generateSocketCraftingLogic(),
    '{{DPI_AWARENESS}}': DPI_AWARENESS
  }

  // 执行替换
  for (const [key, value] of Object.entries(replacements)) {
    // 使用 split-join 进行全局替换
    script = script.split(key).join(value)
  }

  return script
}

/**
 * 生成地图洗练Python脚本内容
 * @param {Object} config - 配置对象
 * @returns {string} Python脚本内容
 */
export function generateMapRollingScript(config) {
  const {
    globalShortcuts,
    currencyPositions,
    inventory,
    operationDelayMs,
    mapConfig,
    filePaths,
    dpiScale = 1.0
  } = config

  const itemInfoFile = filePaths?.itemInfoFile || 'temp/item_info.txt'
  const itemInfoResultFile = filePaths?.itemInfoResultFile || 'temp/item_info_result.json'
  const normalizedOperationDelayMs = normalizeOperationDelay(operationDelayMs)
  const operationDelaySeconds = (normalizedOperationDelayMs / 1000).toFixed(3)

  const escapePath = (path) => path.replace(/\\/g, '\\\\')

  const toPynputHotkey = (shortcut) => {
    if (!shortcut) return null
    const parts = shortcut.split('+').map(p => p.trim())
    return parts.map(part => {
      const lower = part.toLowerCase()
      const map = {
        'ctrl': '<ctrl>', 'control': '<ctrl>',
        'alt': '<alt>',
        'shift': '<shift>',
        'cmd': '<cmd>', 'meta': '<cmd>',
        'enter': '<enter>', 'return': '<enter>',
        'esc': '<esc>', 'escape': '<esc>',
        'tab': '<tab>',
        'up': '<up>', 'down': '<down>', 'left': '<left>', 'right': '<right>'
      }
      if (map[lower]) return map[lower]
      if (/^f\d+$/.test(lower)) return '<' + lower + '>'
      return lower
    }).join('+')
  }

  const stopShortcut = globalShortcuts?.end || 'Alt+3'
  const pynputStopShortcut = toPynputHotkey(stopShortcut) || '<alt>+3'

  // 构建通货坐标对象
  const safeCurrencyPositions = {}
  if (currencyPositions) {
    for (const [key, val] of Object.entries(currencyPositions)) {
      if (val) {
        safeCurrencyPositions[key] = {
          x: Math.floor(val.x || 0),
          y: Math.floor(val.y || 0)
        }
      }
    }
  }

  // 计算最终的网格配置 (强制使用全局设置)
  const grid = mapConfig.grid || {}
  const finalGridConfig = {
    rows: grid.rows || 5,
    cols: grid.cols || 12,
    startX: inventory?.startPos?.x || 0,
    startY: inventory?.startPos?.y || 0,
    offsetX: inventory?.slotSize?.w || 0,
    offsetY: inventory?.slotSize?.h || 0,
    emptySlotThreshold: normalizeEmptySlotThreshold(inventory?.emptySlotThreshold)
  }

  // 填充模板
  let script = mapRollingTemplate

  // 将JSON字符串中的 true/false 转换为 Python 的 True/False
  const jsonToPython = (jsonStr) => {
    return jsonStr.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False')
  }

  const replacements = {
    '{{GEN_DATE}}': new Date().toLocaleString(),
    '{{ITEM_INFO_FILE}}': escapePath(itemInfoFile),
    '{{ITEM_INFO_RESULT_FILE}}': escapePath(itemInfoResultFile),
    '{{DELAY_MOUSE_MOVE}}': operationDelaySeconds,
    '{{DELAY_MOUSE_CLICK}}': operationDelaySeconds,
    '{{DELAY_CLIPBOARD}}': normalizedOperationDelayMs.toFixed(0),
    '{{CURRENCY_POSITIONS}}': jsonToPython(JSON.stringify(safeCurrencyPositions)),
    '{{GRID_CONFIG}}': jsonToPython(JSON.stringify(finalGridConfig)),
    '{{MAP_CONFIG}}': jsonToPython(JSON.stringify(mapConfig)),
    '{{DPI_SCALE_FACTOR}}': String(Math.min(3, Math.max(1, Number(dpiScale) || 1))),
    '{{STOP_SHORTCUT}}': stopShortcut,
    '{{PYNPUT_STOP_SHORTCUT}}': pynputStopShortcut,
    '{{DPI_AWARENESS}}': DPI_AWARENESS
  }

  for (const [key, value] of Object.entries(replacements)) {
    script = script.split(key).join(value)
  }

  return script
}

/**
 * 保存Python脚本到文件
 * @param {string} scriptContent -脚本内容
 * @param {string} filePath - 文件路径
 */
export async function savePythonScript(scriptContent, filePath) {
  return electronApi.file.save(filePath, scriptContent)
}
