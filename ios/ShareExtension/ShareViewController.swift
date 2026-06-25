import UIKit
import UniformTypeIdentifiers

/**
 * Share Extension: receives text/URL from the iOS share sheet and opens the
 * host app via the `ainote://share?sharedText=...` deep link (handled by
 * RCTLinkingManager + React Navigation), so a shared item becomes a new note.
 */
class ShareViewController: UIViewController {
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    handleShare()
  }

  private func handleShare() {
    guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
          let provider = item.attachments?.first else {
      complete()
      return
    }
    let textType = UTType.plainText.identifier
    let urlType = UTType.url.identifier
    if provider.hasItemConformingToTypeIdentifier(textType) {
      provider.loadItem(forTypeIdentifier: textType, options: nil) { data, _ in
        self.openHost(with: (data as? String) ?? "")
      }
    } else if provider.hasItemConformingToTypeIdentifier(urlType) {
      provider.loadItem(forTypeIdentifier: urlType, options: nil) { data, _ in
        self.openHost(with: (data as? URL)?.absoluteString ?? "")
      }
    } else {
      complete()
    }
  }

  private static let appGroup =
    "group.org.reactjs.native.example.AiNoteOfflineAiMemo"

  private func openHost(with text: String) {
    // Robust path: persist into the shared App Group container. The app reads
    // and consumes this when it next becomes active (SharedStore native module).
    if let defaults = UserDefaults(suiteName: Self.appGroup) {
      defaults.set(text, forKey: "pendingSharedText")
    }
    // Best-effort: also try to open the app immediately via the deep link.
    let encoded =
      text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    if let url = URL(string: "ainote://share?sharedText=\(encoded)") {
      openURL(url)
    }
    complete()
  }

  // Extensions can't reach UIApplication.shared; walk the responder chain.
  @objc private func openURL(_ url: URL) {
    var responder: UIResponder? = self
    while let r = responder {
      if let app = r as? UIApplication {
        app.open(url, options: [:], completionHandler: nil)
        return
      }
      responder = r.next
    }
  }

  private func complete() {
    DispatchQueue.main.async {
      self.extensionContext?.completeRequest(
        returningItems: [], completionHandler: nil)
    }
  }
}
