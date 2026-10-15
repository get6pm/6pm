import SwiftUI
import WidgetKit

/// Today (large, `SS:121-127`): what is left, the day's spend against its line, then today's newest
/// three spends and "+N more" with what they add up to.
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
  @Environment(\.colorScheme) private var scheme
  let entry: SurfaceEntry

  var body: some View {
    if let day = entry.entry {
      // Free, the card turns to the night card on a dark Home Screen, as the small one does.
      let dark = scheme == .dark && !entry.inLook
      let ink = dark ? ThemeTokens.PlainNight.ink : entry.color("cardInk")
      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .lastTextBaseline) {
          HStack(spacing: 8) {
            CompanionPicture(image: entry.companion(size: 22), size: 22)
            Text(entry.text("today")).font(SurfaceFont.body(size: 15, weight: 700))
          }
          Spacer(minLength: 8)
          Text(day.safeText)
            .font(SurfaceFont.display(entry.displayFont, size: 24))
            .lineLimit(1)
            .widgetAccentable()
        }
        if let fraction = day.spentFraction {
          VStack(spacing: 5) {
            LineBar(fraction: fraction, track: ink.opacity(0.08), fill: entry.color("accent"))
            HStack {
              Text(day.spentText ?? "")
              Spacer(minLength: 8)
              Text(day.lineText ?? "")
            }
            .font(SurfaceFont.body(size: 11, weight: 600))
            .foregroundStyle(ink.opacity(0.55))
            .lineLimit(1)
          }
          .padding(EdgeInsets(top: 6, leading: 0, bottom: 8, trailing: 0))
        } else {
          Spacer().frame(height: 6)
        }
        if day.list.isEmpty {
          ListLine(ink: ink) {
            Text(entry.text("listEmpty")).opacity(0.55)
            Spacer(minLength: 0)
          }
        }
        ForEach(Array(day.list.enumerated()), id: \.offset) { _, row in
          SpendLine(
            row: row, entry: entry, ink: ink,
            pendingInk: entry.color(dark ? "pendingInkDark" : "pendingInk"))
        }
        if !day.moreText.isEmpty {
          ListLine(ink: ink, vertical: 7) {
            Text(day.moreText)
            Spacer(minLength: 0)
            Text(day.moreAmountText ?? "")
          }
          .opacity(0.55)
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
      .padding(EdgeInsets(top: 14, leading: 16, bottom: 6, trailing: 16))
      .containerBackground(
        dark ? ThemeTokens.PlainNight.sheetSolid : entry.color("cardBg"), for: .widget)
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
  let pendingInk: Color

  var body: some View {
    let hue = row.hue.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(row.hue)) : String(row.hue)
    ListLine(ink: ink) {
      FilledGlyph(glyph: row.icon, size: 16)
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
            .foregroundStyle(pendingInk)
        }
      }
      Spacer(minLength: 8)
      Text(row.amountText).font(SurfaceFont.body(size: 14, weight: 600))
    }
  }
}
