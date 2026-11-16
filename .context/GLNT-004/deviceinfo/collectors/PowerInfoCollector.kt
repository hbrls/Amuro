package com.lisitede.preset.deviceinfo.collectors

import android.content.Context
import android.os.PowerManager

internal data class PowerInfo(
    val isLowPowerMode: Boolean?
)

/**
 * Android 电源管理策略的原始只读结果。
 *
 * [isLowPowerMode] 直接读取 [PowerManager.isPowerSaveMode]，不转换为自定义状态或等级。
 * PowerManager 不存在或读取异常时返回 null，由 Repository 在公开 Map 边界序列化为空字符串。
 *
 * - 声明：不需要权限。
 * - 弹窗：不触发。
 * - PII：否，但动态电源策略可作为风险判断材料。
 *
 * 已评估但暂不采集：
 * - `isDeviceIdleMode`、`isInteractive`、`locationPowerSaveMode`、`currentThermalStatus`：
 *   均有直接 getter，但当前没有对应业务字段。
 * - `isIgnoringBatteryOptimizations`：结果与传入的应用包名绑定，不是纯设备属性。
 * - `getBatteryDischargePrediction`、`getThermalHeadroom`：属于系统预测值，不是原始属性，禁止采集。
 */
internal class PowerInfoCollector(context: Context) {
    private val powerManager = context.applicationContext
        .getSystemService(Context.POWER_SERVICE) as? PowerManager

    fun getPowerInfo(): PowerInfo {
        return PowerInfo(
            isLowPowerMode = try {
                powerManager?.isPowerSaveMode
            } catch (_: Throwable) {
                null
            }
        )
    }
}
