package expo.modules.textscan

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import java.io.File

class TextScanPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(ShareListener())
}

/**
 * Receives images shared to the app (Share → Questly). The image is copied into
 * the cache so it stays readable after the sharing app's permission grant ends;
 * JS collects it with TextScan.takeSharedImage().
 */
class ShareListener : ReactActivityLifecycleListener {
  private var activity: Activity? = null

  override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
    this.activity = activity
    receive(activity?.intent)
  }

  override fun onNewIntent(intent: Intent?): Boolean {
    receive(intent)
    return false
  }

  private fun receive(intent: Intent?) {
    val context = activity ?: return
    if (intent?.action != Intent.ACTION_SEND || intent.type?.startsWith("image/") != true) return
    val uri: Uri = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
    } else {
      @Suppress("DEPRECATION")
      intent.getParcelableExtra(Intent.EXTRA_STREAM)
    }) ?: return
    try {
      val file = File(context.cacheDir, "shared-${System.currentTimeMillis()}.img")
      context.contentResolver.openInputStream(uri)?.use { input ->
        file.outputStream().use { input.copyTo(it) }
      }
      pending = Uri.fromFile(file).toString()
    } catch (e: Exception) {
      pending = null
    }
    // Consume it so a later recreation of the activity doesn't import it again.
    intent.action = Intent.ACTION_MAIN
  }

  companion object {
    @Volatile var pending: String? = null
  }
}
