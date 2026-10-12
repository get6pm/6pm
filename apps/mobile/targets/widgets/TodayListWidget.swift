import SwiftUI
import WidgetKit

/// Today (large, `SS:121-127`): what is left, then today's newest three spends and "+N more".
struct TodayListWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TodayList", provider: SurfaceTimelineProvider()) { entry in
      TodayListView(entry: entry)
    }
    .configurationDisplayName(Text("todayList.name", tableName: "Surfaces"))
    .description(Text("todayList.description", tableName: "Surfaces"))
    .supportedFamilies([.systemLarge])
    .contentMarginsDisabled()
  }
}

struct TodayListView: View {
  let entry: SurfaceEntry

  var body: some View {
    if let day = entry.entry {
      let ink = entry.color("cardInk")
      VStack(alignment: .leading, spacing: 2) {
        HStack(alignment: .firstTextBaseline) {
          Text(entry.text("today")).font(SurfaceFont.body(size: 15, weight: 700))
          Spacer(minLength: 8)
          Text(day.safeText)
            .font(SurfaceFont.display(entry.displayFont, size: 24))
            .lineLimit(1)
        }
        .padding(.bottom, 6)
        if day.list.isEmpty {
          ListLine(ink: ink) {
            Text(entry.text("listEmpty")).opacity(0.55)
            Spacer(minLength: 0)
          }
        }
        ForEach(Array(day.list.enumerated()), id: \.offset) { _, row in
          SpendLine(row: row, entry: entry, ink: ink)
        }
        if !day.moreText.isEmpty {
          ListLine(ink: ink, vertical: 7) {
            Text(day.moreText).opacity(0.55)
            Spacer(minLength: 0)
          }
        }
        if entry.state == .stale {
          ListLine(ink: ink, vertical: 7) {
            Text(entry.text("openApp")).font(SurfaceFont.body(size: 14, weight: 600))
            Spacer(minLength: 0)
          }
        }
        Spacer(minLength: 0)
      }
      .font(SurfaceFont.body(size: 14, weight: 400))
      .foregroundStyle(ink)
      .padding(EdgeInsets(top: 16, leading: 16, bottom: 10, trailing: 16))
      .containerBackground(entry.color("cardBg"), for: .widget)
    } else {
      SetUpView(entry: entry)
    }
  }
}

/// A row of the list with its 0.5 pt rule above it.
struct ListLine<Content: View>: View {
  let ink: Color
  var vertical: CGFloat = 6
  @ViewBuilder let content: () -> Content

  var body: some View {
    HStack(spacing: 9, content: content)
      .padding(.vertical, vertical)
      .overlay(alignment: .top) {
        Rectangle().fill(ink.opacity(0.1)).frame(height: 0.5)
      }
  }
}

/// One spend: its 26 pt tile, the name (and PENDING while it waits), the amount.
struct SpendLine: View {
  let row: SurfaceSnapshot.Row
  let entry: SurfaceEntry
  let ink: Color

  var body: some View {
    let hue = row.hue.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(row.hue)) : String(row.hue)
    ListLine(ink: ink) {
      Text(row.icon)
        .font(SurfaceFont.symbol(size: 16, filled: true))
        .foregroundStyle(Color(css: entry.text("tile.\(hue).glyph")))
        .frame(width: 26, height: 26)
        .background(
          LinearGradient(
            colors: [
              Color(css: entry.text("tile.\(hue).from")), Color(css: entry.text("tile.\(hue).to")),
            ],
            // CSS 155deg.
            startPoint: UnitPoint(x: 0.29, y: 0.05), endPoint: UnitPoint(x: 0.71, y: 0.95)),
          in: RoundedRectangle(cornerRadius: 9, style: .continuous))
      HStack(spacing: 4) {
        Text(row.name).lineLimit(1)
        if row.pending {
          Text(entry.text("pendingTag").uppercased())
            .font(SurfaceFont.body(size: 11, weight: 700))
            .trackingEm(0.04, size: 11)
            .foregroundStyle(entry.color("pendingInk"))
        }
      }
      Spacer(minLength: 8)
      Text(row.amountText).font(SurfaceFont.body(size: 14, weight: 600))
    }
  }
}
