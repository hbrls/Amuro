package com.lisitede.preset.deviceinfo.collectors

import android.app.Application
import android.content.Context
import android.telephony.TelephonyManager
import com.github.gzuliyujiang.oaid.DeviceIdentifier
import com.google.android.gms.ads.identifier.AdvertisingIdClient
import com.google.android.gms.common.GooglePlayServicesNotAvailableException

/**
 * 设备标识族读取结果。各字段的声明/弹窗/PII 详见对应 read* 方法的 KDoc。
 *
 * 标识来源体系：
 * - MSA「移动智能终端补充设备标识体系」：由移动安全联盟（MSA）牵头，国行 ROM 厂商（华为/小米/OPPO/vivo 等）支持。
 *   标准族含 UDID/OAID/VAID/AAID 四种标识符；统一 SDK 面向应用提供 OAID/VAID/AAID，不提供 UDID。
 *   当前 Android_CN_OAID 封装只在本仓库实际接入 [oaid]，[vaid] / [aaid] 因 [DeviceIdentifier] 未暴露接口而留空占位。
 * - Google 体系：[gaid] 走 Google Play Services 通道，依赖设备有 GMS。Google 文档也常称它为 Advertising ID / Ad ID /
 *   AAID；此处命名为 `gaid`，用于和 MSA 的 [aaid] 区分。
 * - Android Framework：[androidId]（SSAID）由系统直接提供，与 MSA / Google 广告标识体系均无关。
 * - DRM 体系：[widevineDeviceId] 属于内容版权保护场景的设备证书标识，不属于广告、归因或用户统计标识。
 *
 * 业界使用习惯：
 * - 广告投放、广告归因、反作弊归因：国内 Android 分发生态通常优先使用 [oaid]；Google Play / 海外 GMS 生态通常优先使用
 *   [gaid]。两者不是二选一，而是取决于 ROM、GMS、厂商服务与用户设置：可能同时可读，也可能只读到其一。
 * - Google Play 生态内，只要设备可提供 Advertising ID，广告用途应使用 [gaid]，不应改用 IMEI、Android ID、MAC 等持久标识；
 *   用户重置或删除广告 ID 后，也不应把新旧广告 ID 或广告 ID 与持久设备标识重新拼接。
 * - MSA 生态内，[oaid] 常作为 IMEI 等硬件号被限制后的广告/归因替代标识；仍应按个人信息或敏感设备标识处理，在隐私政策、
 *   SDK 清单、数据安全披露中说明用途，并尊重厂商提供的关闭、重置或空值返回。
 * - [vaid] 适合同一开发者主体下的多应用推荐、统计或风控关联；[aaid] 适合单应用内匿名统计。二者关联范围小于 [oaid]，
 *   但当前实现未真正读取，调用方不应依赖其有值。
 * - [androidId] 更适合应用自身的非广告类匿名状态关联或诊断兜底。Android 8.0+ 上它按应用签名、用户和设备分区，不是全局
 *   广告 ID；不应用它规避广告 ID 的用户重置/删除选择。
 * - [widevineDeviceId] 只应作为 DRM 能力/异常排查信息看待；该接口存在兼容性风险，也不应用于业务画像、广告归因或跨应用追踪。
 */
data class IdentifierInfo(
    // MSA 匿名标识族
    val oaid: String,             // OAID (Open Anonymous Identifier)
    val vaid: String,             // VAID，DeviceIdentifier 未暴露 getVAID 方法
    val aaid: String,             // AAID，DeviceIdentifier 未暴露 getAAID 方法
    val gaid: String,             // GAID (Google Advertising ID)
    val androidId: String,        // Android ID (SSAID)
    val widevineDeviceId: String, // Widevine Device ID (DRM)
    val imei: String              // IMEI，库内 fallback 已含 MEID
)

internal class IdentityInfoCollector(context: Context) {
    private val appContext = context.applicationContext

    init {
        DeviceIdentifier.register(appContext as Application)
    }

    fun getIdentifierInfo(): IdentifierInfo {
        return IdentifierInfo(
            oaid = readOaid(),
            // DeviceIdentifier 未暴露 getVAID / getAAID 方法。
            vaid = "",
            aaid = "",
            androidId = readAndroidId(),
            gaid = readGaid(),
            widevineDeviceId = readWidevineDeviceId(),
            imei = readImei()
        )
    }

    /**
     * OAID（Open Anonymous Identifier），通过 [DeviceIdentifier.getOAID] 获取。
     * 由移动安全联盟（MSA）定义，国产 Android 设备匿名标识。
     * 库同时提供 [DeviceID.getByManufacturer] 异步回调方式（走厂商私有 SDK 通道获取 OAID），
     * 本方法采用 MSA 标准同步路径，不接入异步厂商回调。
     * [DeviceID.getByMsa] 为 MSA 标准路径异步版，[DeviceIdentifier.register] 已在 init 中走该通路完成预取，
     * 此处 [getOAID] 为同步读取已缓存结果。
     *
     * - 生命周期：设备级标识，不随卸载重装变化；用户可在系统设置重置。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：② ROM 自定义授权窗（首次读取时部分厂商弹出），非 Android 标准权限弹窗。
     * - 返回值：正常时返回 OAID 字符串；ROM 未授权或异常时返回空字符串。
     * - PII：是。可用于跨 session 关联设备。
     */
    private fun readOaid(): String {
        return try {
            // register() 已在 init 中完成预取，此处为同步读取。
            DeviceIdentifier.getOAID(appContext)
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }

    /**
     * Android ID（SSAID，Secure Settings Android ID），通过 [DeviceIdentifier.getAndroidID] 获取。
     *
     * - 生命周期：Android 8+ 按签名密钥 + 用户维度生成，同签名同用户下不随卸载重装变化；恢复出厂设置后重置。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发，直接读取，无运行时权限及 ROM 授权窗。
     * - 返回值：正常时返回 Android ID 字符串；异常时返回空字符串。
     * - PII：是。可用于跨 session 关联用户，需在隐私政策中声明。
     */
    private fun readAndroidId(): String {
        return try {
            DeviceIdentifier.getAndroidID(appContext)
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }

    /**
     * GAID（Google Advertising ID）。
     *
     * - 生命周期：用户可在系统设置（设置 > Google > 广告）中随时重置；恢复出厂设置后重置。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发应用内权限弹窗。用户可在系统设置中停用个性化广告或重置 GAID，非 APP 弹窗。
     * - 返回值：设备有 Google Play Services 时返回 GAID 字符串；无 GMS 或异常时返回空字符串。
     * - ⚠️ 库同时提供 [DeviceID.getByGms] 异步回调方式获取 GAID；本方法使用 [AdvertisingIdClient] 同步读取，
     *   与该异步通路同源（均为 Google Play Services 通道）。
     * - PII：是。可用于跨应用追踪用户，需在隐私政策中声明。
     */
    private fun readGaid(): String {
        return try {
            val info = AdvertisingIdClient.getAdvertisingIdInfo(appContext)
            info.id
        } catch (_: GooglePlayServicesNotAvailableException) {
            null
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }

    /**
     * Widevine Device ID（DRM 设备标识），通过 [DeviceIdentifier.getWidevineID] 获取。
     *
     * - 生命周期：设备级固定标识；部分 ROM 限制非系统应用读取。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发。
     * - 返回值：正常时返回 DRM 设备 ID 字符串；ROM 限制或异常时返回空字符串。
     * - PII：是。可用于跨 session 关联设备。
     * - 用途：Google 内容版权保护（DRM）体系下的设备证书绑定，非广告标识。
     * - ⚠️ 来自 Android_CN_OAID 库的经验：该接口在某些手机上可能造成卡死或闪退，
     *   自 4.2.7 版本后已弃用。此处通过 try/catch 兜底，异常时返回空字符串。
     */
    private fun readWidevineDeviceId(): String {
        return try {
            DeviceIdentifier.getWidevineID()
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }

    /**
     * IMEI / MEID 合并读取。
     * 通过 [DeviceIdentifier.getIMEI] 获取，仅支持 Android 10 之前的系统；库内部逻辑为：
     * 优先取 [TelephonyManager.getImei]（API 26+），
     * IMEI 为空时降级取 [TelephonyManager.getMeid]（纯 CDMA 设备无 IMEI）。
     *
     * - 生命周期：基带模块硬件级标识。
     * - Manifest 声明：需要 READ_PHONE_STATE。
     * - 用户授权弹窗：① Android ≤9 需 READ_PHONE_STATE 弹窗（用户拒绝则无法读取）。
     * - ② Android 10+：系统静默拒绝，不弹窗，直接返回空字符串。
     * - 返回值：正常时返回 IMEI/MEID 字符串；权限不足或系统拒绝时返回空字符串。
     * - PII：是。硬件级标识，可用于跨 session 关联设备。
     */
    private fun readImei(): String {
        return try {
            DeviceIdentifier.getIMEI(appContext)
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }
}
