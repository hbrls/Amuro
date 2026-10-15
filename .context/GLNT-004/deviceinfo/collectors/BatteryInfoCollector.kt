package com.lisitede.preset.deviceinfo.collectors

import android.content.Context
import android.os.BatteryManager

internal data class BatteryInfo(
    val level: Int?
)

/**
 * 电池子系统的原始只读结果。
 *
 * [level] 直接读取 [BatteryManager.BATTERY_PROPERTY_CAPACITY]，系统返回无小数的整数百分比。
 * 不使用 ACTION_BATTERY_CHANGED 的 level / scale 自行计算百分比。属性不受设备支持或读取异常时
 * 返回 null，由 Repository 在公开 Map 边界序列化为空字符串。
 *
 * - 声明：不需要权限。
 * - 弹窗：不触发。
 * - PII：否，但动态电池状态可作为风险判断材料。
 *
 * 已评估但暂不采集：
 * - `BATTERY_PROPERTY_CHARGE_COUNTER`、`CURRENT_NOW`、`CURRENT_AVERAGE`、`ENERGY_COUNTER`：
 *   均为直接属性，但当前没有对应业务字段。
 * - `BATTERY_PROPERTY_STATUS`、[BatteryManager.isCharging]：可直接读取充电状态，当前暂不采集。
 * - ACTION_BATTERY_CHANGED 的 health、plugged、present、technology、temperature、voltage 和
 *   API 34+ cycle count：均可直接读取 sticky Intent extra，当前暂不采集。
 * - `computeChargeTimeRemaining`：返回系统估算值，不属于原始属性，禁止采集。
 */
internal class BatteryInfoCollector(context: Context) {
    private val batteryManager = context.applicationContext
        .getSystemService(Context.BATTERY_SERVICE) as? BatteryManager

    fun getBatteryInfo(): BatteryInfo {
        val level = try {
            batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (_: Throwable) {
            null
        }

        return BatteryInfo(
            level = level?.takeUnless { it == Int.MIN_VALUE }
        )
    }
}
