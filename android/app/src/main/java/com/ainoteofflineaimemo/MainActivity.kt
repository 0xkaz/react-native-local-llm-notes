package com.ainoteofflineaimemo

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AiNoteOfflineAiMemo"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    convertShareIntent(intent)
    super.onCreate(savedInstanceState)
  }

  override fun onNewIntent(intent: Intent) {
    convertShareIntent(intent)
    super.onNewIntent(intent)
  }

  /**
   * Rewrite an ACTION_SEND text/plain intent (from the OS share sheet) into an
   * ACTION_VIEW deep link (ainote://share?sharedText=...) so React Native's
   * Linking can route it to the editor.
   */
  private fun convertShareIntent(intent: Intent?) {
    if (intent == null) return
    if (Intent.ACTION_SEND == intent.action && intent.type == "text/plain") {
      val text = intent.getStringExtra(Intent.EXTRA_TEXT)
      if (!text.isNullOrEmpty()) {
        intent.action = Intent.ACTION_VIEW
        intent.data = Uri.parse("ainote://share?sharedText=" + Uri.encode(text))
        intent.removeExtra(Intent.EXTRA_TEXT)
      }
    }
  }
}
