package expo.modules.textscan

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** On-device OCR (ML Kit). Returns JSON lines: [{ text, top, height }]. */
@ExpoModule("TextScan")
class TextScanModule : Module() {
  @JS
  suspend fun recognize(uri: String): String = withContext(Dispatchers.IO) {
    val image = InputImage.fromFilePath(androidContext, Uri.parse(uri))
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    try {
      val result = suspendCancellableCoroutine { cont ->
        recognizer.process(image)
          .addOnSuccessListener { cont.resume(it) }
          .addOnFailureListener { cont.resumeWithException(it) }
      }
      val lines = JSONArray()
      for (block in result.textBlocks) {
        for (line in block.lines) {
          val box = line.boundingBox
          lines.put(
            JSONObject()
              .put("text", line.text)
              .put("top", box?.top ?: 0)
              .put("left", box?.left ?: 0)
              .put("height", box?.height() ?: 0)
          )
        }
      }
      lines.toString()
    } finally {
      recognizer.close()
    }
  }

  /** Cached file URI of an image shared to the app, once; null if none. */
  @JS
  suspend fun takeSharedImage(): String? {
    val uri = ShareListener.pending
    ShareListener.pending = null
    return uri
  }
}
