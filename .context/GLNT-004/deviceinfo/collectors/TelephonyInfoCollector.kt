package com.lisitede.preset.deviceinfo.collectors

import android.annotation.SuppressLint
import android.content.Context
import android.telephony.TelephonyManager

/**
 * 运营商/归属地族。各字段的声明/弹窗/PII 详见对应 read* 方法的 KDoc。
 *
 * IMEI 已移动至 IdentifierInfo，由 IdentityInfoCollector.readImei() 采集；
 * TelephonyInfo 不再包含 IMEI。
 */
data class TelephonyInfo(
    // val meid: String = "",         // MEID，与 imei 同源，无需单独字段
    val imsi: String,             // IMSI
    val iccid: String,            // ICCID
    // val mac: String = "",         // MAC，本期不纳入，属于 NetworkInfo 范畴
    val line1Number: String,      // MSISDN / 本机号码
    val simOperator: String,      // SIM Operator (MCC-MNC)
    val networkOperator: String,  // Network Operator (MCC-MNC)
    // val simCountryIso: String = "",    // SIM Country Iso，本期不纳入
    // val networkCountryIso: String = "",// Network Country Iso，本期不纳入
    val simState: String,         // SIM State
    val simOperatorName: String  // SIM Operator Name
)

internal class TelephonyInfoCollector(context: Context) {
    private val appContext = context.applicationContext

    fun getTelephonyInfo(): TelephonyInfo {
        val tm = appContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        return TelephonyInfo(
            imsi = readImsi(tm),
            iccid = readIccid(tm),
            line1Number = readLine1Number(tm),
            simOperator = readSimOperator(tm),
            networkOperator = readNetworkOperator(tm),
            simState = readSimState(tm),
            simOperatorName = readSimOperatorName(tm)
        )
    }

    /**
     * IMSI（International Mobile Subscriber Identity），通过 [TelephonyManager.getSubscriberId] 读取。
     *
     * - 生命周期：SIM 卡级标识，换卡即变；双卡设备有两个独立 IMSI。
     * - Manifest 声明：需要 READ_PHONE_STATE。
     * - 用户授权弹窗：① Android ≤10 需 READ_PHONE_STATE 弹窗（用户拒绝则无法读取）。
     * - ② Android 11+：系统静默拒绝（需 `READ_PRIVILEGED_PHONE_STATE`，仅系统应用持有），不弹窗，直接返回空字符串。
     * - 返回值：正常时返回 IMSI 字符串；权限不足或系统拒绝时返回空字符串。
     * - PII：是。硬件级标识，可用于跨 session 关联用户。
     */
    @SuppressLint("MissingPermission")
    private fun readImsi(tm: TelephonyManager?): String {
        return try {
            @Suppress("DEPRECATION")
            tm?.subscriberId
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }

    /**
     * ICCID（Integrated Circuit Card Identifier），即 SIM 卡序列号，通过 [TelephonyManager.getSimSerialNumber] 读取。
     *
     * - 生命周期：SIM 卡级唯一序列号，换卡即变。
     * - Manifest 声明：需要 READ_PHONE_STATE。
     * - 用户授权弹窗：① 全版本需 READ_PHONE_STATE 弹窗（用户拒绝则无法读取）。
     * - 返回值：正常时返回 ICCID 字符串；权限不足时返回空字符串。
     * - PII：是。硬件级标识，可用于跨 session 关联用户。
     */
    @SuppressLint("MissingPermission")
    private fun readIccid(tm: TelephonyManager?): String {
        return try {
            tm?.simSerialNumber
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }

    /**
     * SIM Operator（SIM 卡归属运营商 MCC-MNC），通过 [TelephonyManager.getSimOperator] 读取。
     *
     * - 生命周期：换卡即变。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发。
     * - PII：否。仅标识运营商，无法定位个人。
     */
    private fun readSimOperator(tm: TelephonyManager?): String {
        return tm?.simOperator.orEmpty()
    }

    /**
     * Network Operator（当前注册网络运营商 MCC-MNC），通过 [TelephonyManager.getNetworkOperator] 读取。
     *
     * - 生命周期：随网络切换变化。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发。
     * - PII：否。仅标识运营商，无法定位个人。
     */
    private fun readNetworkOperator(tm: TelephonyManager?): String {
        return tm?.networkOperator.orEmpty()
    }

    /**
     * SIM State（SIM 卡状态），通过 [TelephonyManager.getSimState] 读取。
     *
     * - 生命周期：随 SIM 插拔变化。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发。
     * - PII：否。
     */
    private fun readSimState(tm: TelephonyManager?): String {
        return tm?.simState?.toString().orEmpty()
    }

    /**
     * SIM Operator Name（运营商显示名称），通过 [TelephonyManager.getSimOperatorName] 读取。
     *
     * - 生命周期：换卡即变。
     * - Manifest 声明：不需要。
     * - 用户授权弹窗：不触发。
     * - PII：否。仅运营商名称，无法定位个人。
     */
    private fun readSimOperatorName(tm: TelephonyManager?): String {
        return tm?.simOperatorName.orEmpty()
    }

    /**
     * Line1Number（MSISDN / 本机号码），通过 [TelephonyManager.getLine1Number] 读取。
     *
     * - 生命周期：SIM 卡上存储的号码，换卡即变；绝大多数 SIM 未写入，此时返回空字符串。
     * - Manifest 声明：需要 READ_PHONE_STATE（另需 READ_PHONE_NUMBERS）。
     * - 用户授权弹窗：① 需 READ_PHONE_STATE 弹窗（用户拒绝则无法读取）。
     * - ② Android 11+：系统限制非运营商应用读取，不弹窗，直接返回空字符串。
     * - 返回值：正常时返回号码字符串；权限不足、系统限制或 SIM 未写入时返回空字符串。
     * - PII：是。直接关联用户手机号。
     */
    @SuppressLint("MissingPermission")
    private fun readLine1Number(tm: TelephonyManager?): String {
        return try {
            @Suppress("DEPRECATION")
            tm?.line1Number
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }
}
