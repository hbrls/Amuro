package com.lisitede.preset.deviceinfo.collectors

import android.annotation.SuppressLint
import android.os.Build

/**
 * 设备身份型号与 Android 构建系统版本类字段，全部读取自 [android.os.Build]。
 *
 * - 声明：除 [serial] 需 READ_PHONE_STATE 外，其余字段无需权限声明。
 * - 弹窗：除 [serial] 在 26~28 需运行时权限弹窗外，其余字段不触发。
 * - PII：品牌/型号/序列号等可组合定位设备，需在隐私政策中声明。
 */
data class BuildInfo(
    val brand: String,
    val model: String,
    val manufacturer: String,
    val device: String,
    val product: String,
    val versionRelease: String,
    val versionSdkInt: Int,
    val board: String,
    val hardware: String,
    val display: String,
    val fingerprint: String,
    val id: String,                // Build.ID
    val serial: String             // Build.getSerial() / Build.SERIAL
)

internal class BuildInfoCollector {
    fun getBuildInfo(): BuildInfo {
        return BuildInfo(
            brand = Build.BRAND,
            model = Build.MODEL,
            manufacturer = Build.MANUFACTURER,
            device = Build.DEVICE,
            product = Build.PRODUCT,
            versionRelease = Build.VERSION.RELEASE,
            versionSdkInt = Build.VERSION.SDK_INT,
            board = Build.BOARD,
            hardware = Build.HARDWARE,
            display = Build.DISPLAY,
            fingerprint = Build.FINGERPRINT,
            id = Build.ID,
            serial = readSerial()
        )
    }

    /**
     * Serial Number（设备序列号），通过 [Build.getSerial]（API 26+）或 [Build.SERIAL]（deprecated fallback）读取。
     *
     * - 生命周期：设备硬件级序列号，恢复出厂设置不变；部分定制 ROM 可能返回固定值或空。
     * - Manifest 声明：需要 READ_PHONE_STATE。
     * - 用户授权弹窗：① Android 26~28 需 READ_PHONE_STATE 弹窗（用户拒绝则无法读取）。
     * - ② Android 29+：系统静默拒绝，不弹窗，直接返回空字符串。
     * - 返回值：正常时返回序列号字符串；权限不足或系统拒绝时返回空字符串。
     * - PII：是。硬件级标识，可用于跨 session 关联设备。
     */
    @SuppressLint("MissingPermission")
    private fun readSerial(): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Build.getSerial()
            } else {
                @Suppress("DEPRECATION")
                Build.SERIAL
            }
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }
}
