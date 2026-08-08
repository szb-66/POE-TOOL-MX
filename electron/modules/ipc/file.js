/**
 * Purpose: 注册文件操作和物品解析相关的 IPC 处理器
 * Inputs: fileWatcher (object) - 文件监听模块，itemParser (object) - 物品解析模块，itemMatcher (object) - 物品匹配模块，window (object) - 窗口管理模块
 * Outputs: 注册 IPC 处理器和事件监听器，无返回值
 * Preconditions: 文件监听器已初始化
 * Edge cases: 文件不存在时返回错误；解析失败时返回错误信息
 * Errors: 文件操作失败时返回错误对象，不抛出异常
 */

import { ipcMain } from 'electron'
import fs from 'fs'
import { parseItemInfo } from '../item/parser.js'
import { matchAffixes, matchEldritchImplicits, matchSockets, matchMapRequirements } from '../item/matcher.js'

export function registerFileHandlers(fileWatcher, itemParser, itemMatcher, window, crafting = null) {
  const { getMainWindow, getOverlayWindow } = window
  const { getFilePaths } = fileWatcher
  const isMapCategory = (category) => category === '异界地图' || category === '地图'
  const sendItemResult = (result, config) => {
    const overlayWindow = getOverlayWindow()
    if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.webContents.send('update-overlay', result)
    if (!config?.moduleEldritch?.enabled) return
    const mainWindow = getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('update-overlay', result)
    }
  }

  // IPC: 保存文件
  ipcMain.handle('save-file', async (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 读取文件
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 启动文件监听
  ipcMain.handle('start-file-watcher', async (event, config) => {
    fileWatcher.startFileWatcher(config)
    return { success: true }
  })

  // IPC: 停止文件监听
  ipcMain.handle('stop-file-watcher', async () => {
    fileWatcher.stopFileWatcher()
    return { success: true }
  })

  // IPC: 获取文件通信路径
  ipcMain.handle('get-file-paths', async () => {
    return getFilePaths()
  })

  // 监听文件变化事件，处理业务逻辑
  fileWatcher.on('fileChanged', (clipboardText, config) => {
    try {
      // 解析物品信息
      const itemInfo = parseItemInfo(clipboardText)
      
      if (!itemInfo) {
        writeParseResult({
          error: '无法解析物品信息'
        })
        return
      }

      const isLegendary = itemInfo.rarity === '传奇'
      const isCorrupted = itemInfo.isCorrupted

      // 腐化的传奇物品仍然禁止制作
      if (isLegendary && isCorrupted) {
        writeParseResult({
          rarity: itemInfo.rarity,
          isLegendary: true,
          isCorrupted: true,
          error: '腐化的传奇物品无法制作'
        })
        return
      }

      // 匹配词缀（物品制作）
      let affixMatchResult = {
        isMatch: false,
        requiredAllMatched: false,
        matchedSelectedCount: 0,
        matchedModTexts: [],
        matchedGroupId: null,
        matchedGroupName: '',
        groupResults: []
      }
      if (config && config.moduleTwo && config.moduleTwo.enabled) {
        affixMatchResult = Array.isArray(config.moduleTwo.affixGroups)
          ? matchAffixes(itemInfo, config.moduleTwo.affixGroups)
          : matchAffixes(
              itemInfo,
              config.moduleTwo.requiredAffixes || [],
              config.moduleTwo.selectedAffixes || [],
              config.moduleTwo.selectedCount || 1
            )
      }

      // 匹配插槽
      let socketMatch = false
      if (config && config.moduleThree && config.moduleThree.enabled) {
        socketMatch = matchSockets(
          itemInfo,
          config.moduleThree.socket,
          config.moduleThree.link,
          config.moduleThree.color
        )
      }

      // 匹配地图（地图制作）- 仅用于判断，统计完全由脚本负责
      let mapMatchResult = { isMatch: false }
      if (config && config.map && isMapCategory(itemInfo.category)) {
        mapMatchResult = matchMapRequirements(itemInfo, config.map)
      }

      const eldritchMatchResult = config?.moduleEldritch?.enabled
        ? matchEldritchImplicits(itemInfo, config.moduleEldritch.targets, {
            naturalBaseImplicitTexts: crafting?.naturalBaseImplicitTexts?.(itemInfo.baseName) ?? []
          })
        : { isMatch: false, matchedTargetName: '', matchedText: '' }

      // 读取脚本写入的循环次数、处理数量、符合条件数量和词缀统计（如果文件中有）
      const filePaths = getFilePaths()
      let currentIteration = 0
      let scriptProcessedCount = null
      let scriptQualifiedCount = null
      let scriptBlacklistStats = null
      let scriptWhitelistStats = null
      try {
        if (fs.existsSync(filePaths.itemInfoResultFile)) {
          const oldContent = fs.readFileSync(filePaths.itemInfoResultFile, 'utf8')
          if (oldContent) {
            const oldResult = JSON.parse(oldContent)
            if (oldResult.iteration) {
              currentIteration = oldResult.iteration
            }
            if (oldResult.processed_count !== undefined && oldResult.processed_count !== null) {
              scriptProcessedCount = oldResult.processed_count
            }
            if (oldResult.qualified_count !== undefined && oldResult.qualified_count !== null) {
              scriptQualifiedCount = oldResult.qualified_count
            }
            if (oldResult.blacklist_stats !== undefined && oldResult.blacklist_stats !== null) {
              scriptBlacklistStats = oldResult.blacklist_stats
            }
            if (oldResult.whitelist_stats !== undefined && oldResult.whitelist_stats !== null) {
              scriptWhitelistStats = oldResult.whitelist_stats
            }
          }
        }
      } catch (e) {
        // 忽略读取错误
      }

      const result = {
        category: itemInfo.category,
        rarity: itemInfo.rarity,
        name: itemInfo.name,
        baseName: itemInfo.baseName,
        level: itemInfo.level,
        quality: itemInfo.quality,
        socketsCount: itemInfo.socketsCount,
        links: itemInfo.links,
        socketsColors: itemInfo.socketsColors,
        itemQuantity: itemInfo.itemQuantity,
        itemRarity: itemInfo.itemRarity,
        monsterPackSize: itemInfo.monsterPackSize,
        mapTier: itemInfo.mapTier,
        moreMaps: itemInfo.moreMaps || 0,
        moreScarabs: itemInfo.moreScarabs || 0,
        moreCurrency: itemInfo.moreCurrency || 0,
        isCorrupted: isCorrupted,
        isMirrored: itemInfo.isMirrored,
        isUnmodifiable: itemInfo.isUnmodifiable,
        influences: itemInfo.influences,
        isUnidentified: itemInfo.isUnidentified || false,
        affixMatch: affixMatchResult.isMatch,
        requiredAllMatched: affixMatchResult.requiredAllMatched,
        matchedSelectedCount: affixMatchResult.matchedSelectedCount,
        matchedModTexts: affixMatchResult.matchedModTexts,
        matchedGroupId: affixMatchResult.matchedGroupId,
        matchedGroupName: affixMatchResult.matchedGroupName,
        affixGroupResults: affixMatchResult.groupResults,
        eldritchImplicitMatch: eldritchMatchResult.isMatch,
        matchedEldritchTargetName: eldritchMatchResult.matchedTargetName,
        matchedEldritchText: eldritchMatchResult.matchedText,
        mapMatch: mapMatchResult.isMatch,
        explicitMods: itemInfo.explicitMods,
        implicitMods: itemInfo.implicitMods,
        detailedMods: itemInfo.detailedMods,
        socketMatch,
        isLegendary,
        iteration: currentIteration,
        mapStats: isMapCategory(itemInfo.category) ? {
          processedCount: scriptProcessedCount !== null && scriptProcessedCount !== undefined 
            ? scriptProcessedCount 
            : 0,
          qualifiedCount: scriptQualifiedCount !== null && scriptQualifiedCount !== undefined 
            ? scriptQualifiedCount 
            : 0,
          blacklistStats: scriptBlacklistStats !== null && scriptBlacklistStats !== undefined 
            ? { ...scriptBlacklistStats } 
            : {},
          whitelistStats: scriptWhitelistStats !== null && scriptWhitelistStats !== undefined 
            ? { ...scriptWhitelistStats } 
            : {}
        } : null
      }
      writeParseResult(result)
      
      sendItemResult(result, config)
    } catch (error) {
      writeParseResult({
        error: error.message
      })
    }
  })

  // 监听结果文件变化事件
  fileWatcher.on('resultFileChanged', (result, config) => {
    // 如果脚本写入了 processed_count、qualified_count 或词缀统计，需要包装成 mapStats 格式
    // 检查是否有地图统计信息需要更新（不依赖 config?.map，因为统计信息可能独立更新）
    const hasMapStats = (result.processed_count !== undefined && result.processed_count !== null) || 
                       (result.qualified_count !== undefined && result.qualified_count !== null) ||
                       (result.blacklist_stats !== undefined && result.blacklist_stats !== null) ||
                       (result.whitelist_stats !== undefined && result.whitelist_stats !== null)
    
    if (hasMapStats) {
      // 如果 result 中没有 category，但 config 中有地图配置，则认为是地图模式
      // 或者如果 result 中已经有 category 为异界地图，也认为是地图模式
      const isMapMode = isMapCategory(result.category) || config?.map
      
      if (isMapMode) {
        result.mapStats = {
          processedCount: result.processed_count !== undefined && result.processed_count !== null 
            ? result.processed_count 
            : (result.mapStats?.processedCount || 0),
          qualifiedCount: result.qualified_count !== undefined && result.qualified_count !== null 
            ? result.qualified_count 
            : (result.mapStats?.qualifiedCount || 0),
          blacklistStats: result.blacklist_stats !== undefined && result.blacklist_stats !== null 
            ? { ...result.blacklist_stats } 
            : (result.mapStats?.blacklistStats || {}),
          whitelistStats: result.whitelist_stats !== undefined && result.whitelist_stats !== null 
            ? { ...result.whitelist_stats } 
            : (result.mapStats?.whitelistStats || {})
        }
        // 确保 category 存在，以便前端正确识别为地图模式
        if (!result.category) {
          result.category = '地图'
        }
      }
    }
    
    // 地图统计继续发送浮层；古灵结果额外同步主页面。
    sendItemResult(result, config)
  })

  // 写入解析结果
  function writeParseResult(result) {
    try {
      const filePaths = getFilePaths()
      // 读取现有文件，保留脚本写入的 processed_count 和 iteration
      let existingData = {}
      if (fs.existsSync(filePaths.itemInfoResultFile)) {
        try {
          const existingContent = fs.readFileSync(filePaths.itemInfoResultFile, 'utf8')
          if (existingContent) {
            existingData = JSON.parse(existingContent)
          }
        } catch (e) {
          // 忽略读取错误
        }
      }
      
      // 合并数据：保留脚本写入的值，使用主进程解析的结果
      const mergedResult = {
        ...result,
        processed_count: existingData.processed_count !== undefined && existingData.processed_count !== null 
          ? existingData.processed_count 
          : result.processed_count,
        qualified_count: existingData.qualified_count !== undefined && existingData.qualified_count !== null 
          ? existingData.qualified_count 
          : result.qualified_count,
        blacklist_stats: existingData.blacklist_stats !== undefined && existingData.blacklist_stats !== null 
          ? existingData.blacklist_stats 
          : result.blacklist_stats,
        whitelist_stats: existingData.whitelist_stats !== undefined && existingData.whitelist_stats !== null 
          ? existingData.whitelist_stats 
          : result.whitelist_stats,
        iteration: existingData.iteration !== undefined && existingData.iteration !== null
          ? existingData.iteration 
          : result.iteration
      }
      
      fs.writeFileSync(filePaths.itemInfoResultFile, JSON.stringify(mergedResult), 'utf8')
    } catch (error) {
      // 写入解析结果失败
    }
  }
}

