import SwiftUI
import WidgetKit

@main
struct SixpmWidgets: WidgetBundle {
  var body: some Widget {
    SafeTodayWidget()
  }
}

/// Safe today, before the app has written anything for widgets to draw.
struct SafeTodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "SafeToday", provider: SafeTodayProvider()) { _ in
      Text("setUp", tableName: "Surfaces")
        .font(.footnote)
        .foregroundStyle(ThemeTokens.PlainDay.ink)
        .containerBackground(ThemeTokens.PlainDay.sheetSolid, for: .widget)
    }
    .configurationDisplayName(Text("safeToday.name", tableName: "Surfaces"))
    .description(Text("safeToday.description", tableName: "Surfaces"))
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct SafeTodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> SafeTodayEntry { SafeTodayEntry(date: .now) }

  func getSnapshot(in context: Context, completion: @escaping (SafeTodayEntry) -> Void) {
    completion(SafeTodayEntry(date: .now))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SafeTodayEntry>) -> Void) {
    completion(Timeline(entries: [SafeTodayEntry(date: .now)], policy: .never))
  }
}

struct SafeTodayEntry: TimelineEntry {
  let date: Date
}
