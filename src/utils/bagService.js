import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { useBagStore } from '@/stores/bag'
import { useSettingsStore } from '@/domains/settings/settingsStore'

export async function startBagStash() {
  const bagStore = useBagStore()
  if (bagStore.isStashing) return
  const settingsStore = useSettingsStore()
  try {
    const result = await electronApi.bag.startStash({
      templates: {
        stashTitle: String(bagStore.templates.stashTitle || ''),
        inventoryTitle: String(bagStore.templates.inventoryTitle || '')
      },
      inventory: {
        startPos: {
          x: Number(settingsStore.inventory.startPos?.x || 2658),
          y: Number(settingsStore.inventory.startPos?.y || 1199)
        },
        slotSize: {
          w: Number(settingsStore.inventory.slotSize?.w || 100),
          h: Number(settingsStore.inventory.slotSize?.h || 100)
        }
      }
    })
    if (!result?.success) throw new Error(result?.error || '未知错误')
    bagStore.setStashingStatus(true, 0)
    ElMessage.success('开始自动入库')
  } catch (error) {
    ElMessage.error(`启动入库失败: ${error.message}`)
  }
}
