package expo.modules.questlywidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews

/** Home-screen widget: streak, coins, level, today's XP and the next task. */
class QuestlyWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    ids.forEach { render(context, manager, it) }
  }

  companion object {
    const val PREFS = "questly_widget"
    private const val DAY = 86_400_000L

    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      manager.getAppWidgetIds(ComponentName(context, QuestlyWidgetProvider::class.java))
        .forEach { render(context, manager, it) }
    }

    private fun render(context: Context, manager: AppWidgetManager, id: Int) {
      val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      // Today's XP resets once the saved day is over, even if the app was not opened.
      val sameDay = System.currentTimeMillis() - p.getLong("dayStart", 0) < DAY
      val xp = if (sameDay) p.getInt("xp", 0) else 0
      val goal = p.getInt("goal", 30).coerceAtLeast(1)
      val views = RemoteViews(context.packageName, R.layout.questly_widget).apply {
        setTextViewText(R.id.streak, "🔥 ${p.getInt("streak", 0)}")
        setTextViewText(R.id.coins, "🪙 ${p.getInt("coins", 0)}")
        setTextViewText(R.id.level, "Lv ${p.getInt("level", 1)}")
        setTextViewText(R.id.goal, if (xp >= goal) "✅ $xp XP" else "$xp / $goal XP")
        setProgressBar(R.id.bar, 100, (xp * 100 / goal).coerceAtMost(100), false)
        setTextViewText(R.id.next, p.getString("next", null)?.let { "→ $it" } ?: "All clear")
      }
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
        views.setOnClickPendingIntent(
          R.id.root,
          PendingIntent.getActivity(
            context,
            0,
            it,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
          ),
        )
      }
      manager.updateAppWidget(id, views)
    }
  }
}
