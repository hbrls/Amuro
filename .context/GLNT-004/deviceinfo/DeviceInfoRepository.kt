package com.lisitede.preset.deviceinfo

import android.content.Context
import com.lisitede.preset.deviceinfo.collectors.BatteryInfoCollector
import com.lisitede.preset.deviceinfo.collectors.BuildInfoCollector
import com.lisitede.preset.deviceinfo.collectors.DisplayInfoCollector
import com.lisitede.preset.deviceinfo.collectors.FingerprintCollector
import com.lisitede.preset.deviceinfo.collectors.IdentityInfoCollector
import com.lisitede.preset.deviceinfo.collectors.MemoryInfoCollector
import com.lisitede.preset.deviceinfo.collectors.PowerInfoCollector
import com.lisitede.preset.deviceinfo.collectors.TelephonyInfoCollector

class DeviceInfoRepository(context: Context) {
    private val buildInfoCollector = BuildInfoCollector()
    private val identityInfoCollector = IdentityInfoCollector(context)
    private val telephonyInfoCollector = TelephonyInfoCollector(context)
    private val fingerprintCollector = FingerprintCollector()
    private val displayInfoCollector = DisplayInfoCollector(context)
    private val memoryInfoCollector = MemoryInfoCollector(context)
    private val batteryInfoCollector = BatteryInfoCollector(context)
    private val powerInfoCollector = PowerInfoCollector(context)

    fun getIdentity(): Map<String, String> {
        val info = identityInfoCollector.getIdentifierInfo()
        return mapOf(
            "oaid" to info.oaid,
            "vaid" to info.vaid,
            "aaid" to info.aaid,
            "gaid" to info.gaid,
            "androidId" to info.androidId,
            "widevineDeviceId" to info.widevineDeviceId,
            "imei" to info.imei
        )
    }

    fun getProfile(): Map<String, String> {
        val build = buildInfoCollector.getBuildInfo()
        return mapOf(
            "brand" to build.brand,
            "model" to build.model,
            "manufacturer" to build.manufacturer,
            "device" to build.device,
            "product" to build.product
        )
    }

    fun getFingerprint(): Map<String, String> {
        val build = buildInfoCollector.getBuildInfo()
        val telephony = telephonyInfoCollector.getTelephonyInfo()
        val rom = fingerprintCollector.getRomInfo()
        val displayInfo = displayInfoCollector.getDisplayInfo()
        val memoryInfo = memoryInfoCollector.getMemoryInfo()
        return mapOf(
            "versionRelease" to build.versionRelease,
            "versionSdkInt" to build.versionSdkInt.toString(),
            "board" to build.board,
            "hardware" to build.hardware,
            "display" to build.display,
            "fingerprint" to build.fingerprint,
            "id" to build.id,
            "serial" to build.serial,
            "display_physical_width" to displayInfo.physicalWidth?.toString().orEmpty(),
            "display_physical_height" to displayInfo.physicalHeight?.toString().orEmpty(),
            "display_refresh_rate" to displayInfo.refreshRate?.toString().orEmpty(),
            "display_rotation" to displayInfo.rotation?.toString().orEmpty(),
            "display_state" to displayInfo.state?.toString().orEmpty(),
            "display_is_hdr" to displayInfo.isHdr?.toString().orEmpty(),
            "display_is_wide_color_gamut" to displayInfo.isWideColorGamut?.toString().orEmpty(),
            "device_memory" to memoryInfo.totalMemory?.toString().orEmpty(),
            "device_advertised_memory" to memoryInfo.advertisedMemory?.toString().orEmpty(),
            "imsi" to telephony.imsi,
            "iccid" to telephony.iccid,
            "line1Number" to telephony.line1Number,
            "simOperator" to telephony.simOperator,
            "networkOperator" to telephony.networkOperator,
            "simState" to telephony.simState,
            "simOperatorName" to telephony.simOperatorName,
            "ro_miui_ui_version_name" to rom.ro_miui_ui_version_name,
            "ro_miui_ui_version_code" to rom.ro_miui_ui_version_code,
            "ro_mi_os_version_name" to rom.ro_mi_os_version_name,
            "ro_mi_os_version_code" to rom.ro_mi_os_version_code,
            "ro_mi_os_version_incremental" to rom.ro_mi_os_version_incremental,
            "ro_build_version_emui" to rom.ro_build_version_emui,
            "ro_build_version_magic" to rom.ro_build_version_magic,
            "ro_build_version_opporom" to rom.ro_build_version_opporom,
            "ro_build_version_oplusrom" to rom.ro_build_version_oplusrom,
            "ro_build_version_realmeui" to rom.ro_build_version_realmeui,
            "ro_vivo_os_name" to rom.ro_vivo_os_name,
            "ro_vivo_os_version" to rom.ro_vivo_os_version,
            "ro_vivo_rom" to rom.ro_vivo_rom,
            "ro_vivo_rom_version" to rom.ro_vivo_rom_version,
            "ro_build_version_oneui" to rom.ro_build_version_oneui,
            "ro_flyme_published" to rom.ro_flyme_published,
            "ro_meizu_setupwizard_flyme" to rom.ro_meizu_setupwizard_flyme,
            "ro_smartisan_version" to rom.ro_smartisan_version,
            "ro_letv_release_version" to rom.ro_letv_release_version,
            "ro_lenovo_lvp_version" to rom.ro_lenovo_lvp_version,
            "ro_build_nubia_rom_name" to rom.ro_build_nubia_rom_name,
            "ro_build_nubia_rom_code" to rom.ro_build_nubia_rom_code,
            "ro_build_version_oxygen" to rom.ro_build_version_oxygen,
            "ro_build_version_harmony" to rom.ro_build_version_harmony,
            "ro_build_version_harmony_type" to rom.ro_build_version_harmony_type,
            "hw_sc_build_platform_version" to rom.hw_sc_build_platform_version
        )
    }

    fun getRisk(): Map<String, String> {
        val batteryInfo = batteryInfoCollector.getBatteryInfo()
        val powerInfo = powerInfoCollector.getPowerInfo()
        return mapOf(
            "battery_level" to batteryInfo.level?.toString().orEmpty(),
            "battery_low_power_mode" to powerInfo.isLowPowerMode?.toString().orEmpty()
        )
    }
}
