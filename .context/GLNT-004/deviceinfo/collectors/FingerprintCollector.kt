package com.lisitede.preset.deviceinfo.collectors

/**
 * ROM 相关 system property 原始读取结果。
 *
 * 字段名使用下划线映射实际 system property key（如 `ro_miui_ui_version_name` 对应 `ro.miui.ui.version.name`）。
 * 读取方式为反射调用 [SystemProperties.get]，不汇总、不归一化、不做 ROM 归类。
 *
 * - 声明：不需要。
 * - 弹窗：不触发。
 * - PII：否。ROM 版本字段无法定位个人。
 */
data class RomInfo(
    /** ro.miui.ui.version.name */
    val ro_miui_ui_version_name: String,

    /** ro.miui.ui.version.code */
    val ro_miui_ui_version_code: String,

    /** ro.mi.os.version.name */
    val ro_mi_os_version_name: String,

    /** ro.mi.os.version.code */
    val ro_mi_os_version_code: String,

    /** ro.mi.os.version.incremental */
    val ro_mi_os_version_incremental: String,

    /** ro.build.version.emui */
    val ro_build_version_emui: String,

    /** ro.build.version.magic */
    val ro_build_version_magic: String,

    /** ro.build.version.opporom */
    val ro_build_version_opporom: String,

    /** ro.build.version.oplusrom */
    val ro_build_version_oplusrom: String,

    /** ro.build.version.realmeui */
    val ro_build_version_realmeui: String,

    /** ro.vivo.os.name */
    val ro_vivo_os_name: String,

    /** ro.vivo.os.version */
    val ro_vivo_os_version: String,

    /** ro.vivo.rom */
    val ro_vivo_rom: String,

    /** ro.vivo.rom.version */
    val ro_vivo_rom_version: String,

    /** ro.build.version.oneui */
    val ro_build_version_oneui: String,

    /** ro.flyme.published */
    val ro_flyme_published: String,

    /** ro.meizu.setupwizard.flyme */
    val ro_meizu_setupwizard_flyme: String,

    /** ro.smartisan.version */
    val ro_smartisan_version: String,

    /** ro.letv.release.version */
    val ro_letv_release_version: String,

    /** ro.lenovo.lvp.version */
    val ro_lenovo_lvp_version: String,

    /** ro.build.nubia.rom.name */
    val ro_build_nubia_rom_name: String,

    /** ro.build.nubia.rom.code */
    val ro_build_nubia_rom_code: String,

    /** ro.build.version.oxygen */
    val ro_build_version_oxygen: String,

    /** ro.build.version.harmony */
    val ro_build_version_harmony: String,

    /** ro.build.version.harmony_type */
    val ro_build_version_harmony_type: String,

    /** hw_sc.build.platform.version */
    val hw_sc_build_platform_version: String
)

internal class FingerprintCollector {
    fun getRomInfo(): RomInfo {
        return RomInfo(
            ro_miui_ui_version_name = getSystemProperty("ro.miui.ui.version.name"),
            ro_miui_ui_version_code = getSystemProperty("ro.miui.ui.version.code"),
            ro_mi_os_version_name = getSystemProperty("ro.mi.os.version.name"),
            ro_mi_os_version_code = getSystemProperty("ro.mi.os.version.code"),
            ro_mi_os_version_incremental = getSystemProperty("ro.mi.os.version.incremental"),
            ro_build_version_emui = getSystemProperty("ro.build.version.emui"),
            ro_build_version_magic = getSystemProperty("ro.build.version.magic"),
            ro_build_version_opporom = getSystemProperty("ro.build.version.opporom"),
            ro_build_version_oplusrom = getSystemProperty("ro.build.version.oplusrom"),
            ro_build_version_realmeui = getSystemProperty("ro.build.version.realmeui"),
            ro_vivo_os_name = getSystemProperty("ro.vivo.os.name"),
            ro_vivo_os_version = getSystemProperty("ro.vivo.os.version"),
            ro_vivo_rom = getSystemProperty("ro.vivo.rom"),
            ro_vivo_rom_version = getSystemProperty("ro.vivo.rom.version"),
            ro_build_version_oneui = getSystemProperty("ro.build.version.oneui"),
            ro_flyme_published = getSystemProperty("ro.flyme.published"),
            ro_meizu_setupwizard_flyme = getSystemProperty("ro.meizu.setupwizard.flyme"),
            ro_smartisan_version = getSystemProperty("ro.smartisan.version"),
            ro_letv_release_version = getSystemProperty("ro.letv.release.version"),
            ro_lenovo_lvp_version = getSystemProperty("ro.lenovo.lvp.version"),
            ro_build_nubia_rom_name = getSystemProperty("ro.build.nubia.rom.name"),
            ro_build_nubia_rom_code = getSystemProperty("ro.build.nubia.rom.code"),
            ro_build_version_oxygen = getSystemProperty("ro.build.version.oxygen"),
            ro_build_version_harmony = getSystemProperty("ro.build.version.harmony"),
            ro_build_version_harmony_type = getSystemProperty("ro.build.version.harmony_type"),
            hw_sc_build_platform_version = getSystemProperty("hw_sc.build.platform.version")
        )
    }

    private fun getSystemProperty(key: String): String {
        return try {
            Class.forName("android.os.SystemProperties")
                .getMethod("get", String::class.java)
                .invoke(null, key) as? String
        } catch (_: Throwable) {
            null
        }.orEmpty()
    }
}
