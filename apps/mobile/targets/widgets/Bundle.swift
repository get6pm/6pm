import SwiftUI
import WidgetKit

/// Everything the widget extension draws: the Home and Lock Screen widgets and the Live Activity.
@main
struct SixpmWidgets: WidgetBundle {
  var body: some Widget {
    SafeTodayWidget()
    TodayListWidget()
    SurfaceActivityWidget()
  }
}
