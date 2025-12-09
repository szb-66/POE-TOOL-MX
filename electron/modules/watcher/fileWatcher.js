/**
 * Purpose: 文件监听模块，监听 Python 脚本写入的物品信息和结果文件
 * Inputs: config (object) - 物品匹配配置
 * Outputs: 触发 'fileChanged' 和 'resultFileChanged' 事件
 * Preconditions: 临时目录可写
 * Edge cases: 文件不存在时自动创建；读取失败时静默处理
 * Errors: 文件操作失败时静默处理，不抛出异常
 */

import { EventEmitter } from 'events'
import fs from 'fs'
import os from 'os'
import path from 'path'

// 文件通信路径
const tempDir = path.join(os.tmpdir(), 'exile-helper')
const itemInfoFile = path.join(tempDir, 'item_info.txt')
const itemInfoResultFile = path.join(tempDir, 'item_info_result.json')

// 确保临时目录存在
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

class FileWatcher extends EventEmitter {
  constructor() {
    super()
    this.fileWatcher = null
    this.resultFileWatcher = null
    this.currentConfig = null
  }

  startFileWatcher(config) {
    // 停止旧的监听器
    this.stopFileWatcher()
    
    // 在停止监听器后重新设置配置（因为stopFileWatcher会清空currentConfig）
    this.currentConfig = config

    // 确保被监听的文件存在
    try {
      if (!fs.existsSync(itemInfoFile)) {
        fs.writeFileSync(itemInfoFile, JSON.stringify({ clipboard: '' }), 'utf8')
      }
      if (!fs.existsSync(itemInfoResultFile)) {
        fs.writeFileSync(itemInfoResultFile, '{}', 'utf8')
      }
    } catch (error) {
      // 创建监听文件失败
    }

    // 监听结果文件变化 (用于实时更新循环次数等由脚本写入的信息)
    try {
      let lastContent = ''
      let lastModified = 0
      this.resultFileWatcher = fs.watch(itemInfoResultFile, { persistent: false }, (eventType) => {
        if (eventType === 'change') {
          try {
            // 稍微延迟读取，避免读取到写入中间状态
            setTimeout(() => {
              if (!fs.existsSync(itemInfoResultFile)) return
              
              // 检查文件修改时间，避免重复处理
              try {
                const stats = fs.statSync(itemInfoResultFile)
                if (stats.mtimeMs <= lastModified) {
                  return  // 文件没有真正更新
                }
                lastModified = stats.mtimeMs
              } catch (statError) {
                // 忽略 stat 错误
              }
              
              const content = fs.readFileSync(itemInfoResultFile, 'utf8')
              if (!content || content.trim() === '') return
              
              // 如果内容没有变化，跳过处理（避免重复触发）
              if (content === lastContent) return
              lastContent = content
              
              try {
                const result = JSON.parse(content)
                
                // 发射结果文件变化事件
                this.emit('resultFileChanged', result, this.currentConfig)
              } catch (jsonError) {
                // 忽略 JSON 解析错误 (可能正在写入)
              }
            }, 20)  // 进一步减少延迟到20ms，提高响应速度
          } catch (error) {
            // 读取失败
          }
        }
      })
    } catch (error) {
      // 启动失败
    }

    // 监听剪切板文件变化
    this.fileWatcher = fs.watch(itemInfoFile, { persistent: false }, (eventType) => {
      if (eventType === 'change') {
        try {
          const content = fs.readFileSync(itemInfoFile, 'utf8')
          const data = JSON.parse(content)
          
          // 发射文件变化事件，让 IPC 处理器处理业务逻辑
          this.emit('fileChanged', data.clipboard, this.currentConfig)
        } catch (error) {
          this.emit('fileError', error)
        }
      }
    })
  }

  stopFileWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.close()
      this.fileWatcher = null
    }
    if (this.resultFileWatcher) {
      this.resultFileWatcher.close()
      this.resultFileWatcher = null
    }
    this.currentConfig = null
  }

  getCurrentConfig() {
    return this.currentConfig
  }

  getFilePaths() {
    return {
      itemInfoFile,
      itemInfoResultFile,
      tempDir
    }
  }
}

export const fileWatcher = new FileWatcher()

