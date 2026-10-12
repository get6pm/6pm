import SwiftUI
import WidgetKit

/// Everything the widget extension draws: the Home and Lock Screen widgets, the Live Activity and
/// the Control Center controls.
@main
struct SixpmWidgets: WidgetBundle {
  var body: some Widget {
    SafeTodayWidget()
    TodayListWidget()
    SurfaceActivityWidget()
    if #available(iOS 18.0, *) {
      ScanQRControl()
      QuickAddControl()
    }
  }
}
