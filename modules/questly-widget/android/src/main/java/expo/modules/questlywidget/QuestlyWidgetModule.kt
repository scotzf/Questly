package expo.modules.questlywidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

@ExpoModule("QuestlyWidget")
class QuestlyWidgetModule : Module() {
  /** Saves a snapshot ({ streak, coins, level, xp, goal, next, dayStart }) and redraws widgets. */
  @JS
  suspend fun update(json: String): Unit = withContext(Dispatchers.IO) {
    val data = JSONObject(json)
    androidContext.getSharedPreferences(QuestlyWidgetProvider.PREFS, Context.MODE_PRIVATE).edit()
      .putInt("streak", data.optInt("streak"))
      .putInt("coins", data.optInt("coins"))
      .putInt("level", data.optInt("level", 1))
      .putInt("xp", data.optInt("xp"))
      .putInt("goal", data.optInt("goal", 30))
      .putString("next", if (data.isNull("next")) null else data.optString("next"))
      .putLong("dayStart", data.optLong("dayStart"))
      .apply()
    QuestlyWidgetProvider.refreshAll(androidContext)
  }

  /** Asks the launcher to place the widget; false if the launcher cannot. */
  @JS
  suspend fun requestPin(): Boolean = withContext(Dispatchers.Main) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@withContext false
    val manager = AppWidgetManager.getInstance(androidContext)
    if (!manager.isRequestPinAppWidgetSupported) return@withContext false
    manager.requestPinAppWidget(
      ComponentName(androidContext, QuestlyWidgetProvider::class.java),
      null,
      null,
    )
  }
}
