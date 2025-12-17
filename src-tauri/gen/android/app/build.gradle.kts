import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

android {
    compileSdk = 36
    namespace = "com.xie_bro.oh_my_class_schedule"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "com.xie_bro.oh_my_class_schedule"
        minSdk = 24
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }

    // Enable APK splits to generate smaller, ABI-specific APKs
    splits {
        abi {
            isEnable = true
            reset()
            include("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
            isUniversalApk = true // Also generate a universal APK if needed, or false to save space
        }
    }

    // ========================
        // === 智能签名配置 (兼容本地文件 和 GitHub Actions) ===
    val keystorePropertiesFile = rootProject.file("key.properties")
    val keystoreProperties = Properties()
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
    }

    // 辅助函数：优先从环境变量读，没有再从 key.properties 读
    fun getEnvOrProp(envName: String, propName: String): String? {
        return System.getenv(envName) ?: keystoreProperties[propName] as? String
    }

    signingConfigs {
        create("release") {
            // 这里定义了四个关键变量的读取逻辑
            // 逻辑是：先找 GitHub Actions 注入的 ENV，找不到就找本地文件的配置
            keyAlias = getEnvOrProp("ANDROID_KEY_ALIAS", "keyAlias")
            keyPassword = getEnvOrProp("ANDROID_KEY_PASSWORD", "keyPassword")
            storePassword = getEnvOrProp("ANDROID_STORE_PASSWORD", "storePassword")
            
            // 处理 Keystore 文件路径
            // 在 CI 中，我们会把文件解码到一个临时路径；在本地，则直接用文件名
            val envKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
            storeFile = if (envKeystorePath != null) {
                file(envKeystorePath)
            } else {
                file(getEnvOrProp("DUMMY", "storeFile") ?: "my-keys.jks")
            }
        }
    }
        // ========================
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            isMinifyEnabled = true
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
            signingConfig = signingConfigs.getByName("release") 
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")