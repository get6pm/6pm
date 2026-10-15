import SwiftUI
import WidgetKit

/// Safe today: the one number on the Home Screen (small, medium with Scan QR and Quick add) and the
/// Lock Screen (the ring, and the "6pm · Safe today" card). Measures follow the prototype.
struct SafeTodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "SafeToday", provider: SurfaceTimelineProvider()) { entry in
      SafeTodayView(entry: entry)
    }
    .configurationDisplayName(Text("safeToday.name", tableName: "Surfaces"))
    .description(Text("safeToday.description", tableName: "Surfaces"))
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    .contentMarginsDisabled()
  }
}

struct SafeTodayView: View {
  @Environment(\.widgetFamily) private var family
  let entry: SurfaceEntry

  var body: some View {
    switch family {
    case .accessoryCircular: SafeRing(entry: entry)
    case .accessoryRectangular: SafeCard(entry: entry)
    case .systemMedium: SafeMedium(entry: entry)
    default: SafeSmall(entry: entry)
    }
  }
}

/// The last line of a widget: tomorrow and what is pending, or "Open 6pm" once out of date.
func footnote(_ entry: SurfaceEntry, _ day: SurfaceSnapshot.Entry) -> String {
  if entry.state == .stale { return entry.text("openApp") }
  return [day.tomorrowText, day.pendingText].filter { !$0.isEmpty }.joined(separator: " · ")
}

/// Before the month is set up: "Open 6pm to set up", on the card.
struct SetUpView: View {
  let entry: SurfaceEntry

  var body: some View {
    let ink = entry.snapshot == nil ? ThemeTokens.PlainDay.ink : entry.color("cardInk")
    let background = entry.snapshot == nil ? ThemeTokens.PlainDay.sheetSolid : entry.color("cardBg")
    Group {
      if let snapshot = entry.snapshot {
        Text(snapshot.text("setUp"))
      } else {
        Text("setUp", tableName: "Surfaces")
      }
    }
    .font(SurfaceFont.body(size: 13, weight: 600))
    .foregroundStyle(ink)
    .multilineTextAlignment(.center)
    .padding(16)
    .containerBackground(background, for: .widget)
  }
}

/// Small (gallery and Looks): the companion and Scan QR over the number and "safe today". Free, it
/// sits on the light card (the night card on a dark Home Screen); in the user's look (Max), on the
/// look's own ground in its display face: day ground before the flip, dusk ground after.
struct SafeSmall: View {
  @Environment(\.colorScheme) private var scheme
  let entry: SurfaceEntry

  var body: some View {
    if let day = entry.entry {
      let style = SmallStyle(entry: entry, dark: scheme == .dark)
      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .top, spacing: 0) {
          CompanionPicture(image: entry.companion(size: 36), size: 36)
          Spacer(minLength: 0)
          RoundLink(
            glyph: entry.text("glyph.scan"), path: "/app/scan", size: 36, glyphSize: 20,
            background: style.button, foreground: style.onButton)
        }
        Spacer(minLength: 0)
        VStack(alignment: .leading, spacing: 2) {
          Text(day.safeShort)
            .font(SurfaceFont.display(entry.displayFont, size: style.size, weight: style.weight))
            .foregroundStyle(style.number)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
            .widgetAccentable()
          Text(entry.state == .stale ? entry.text("openApp") : entry.text("safeTodayShort"))
            .font(SurfaceFont.body(size: 12, weight: 600))
            .opacity(style.labelOpacity)
            .lineLimit(1)
        }
      }
      .foregroundStyle(style.ink)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .padding(16)
      .containerBackground(for: .widget) { style.ground }
    } else {
      SetUpView(entry: entry)
    }
  }
}

/// Medium (`SS:98-108`): the number on the look's sky, with Scan QR and Quick add beside it.
struct SafeMedium: View {
  let entry: SurfaceEntry

  var body: some View {
    if let day = entry.entry {
      HStack(spacing: 14) {
        VStack(alignment: .leading, spacing: 0) {
          Text(entry.text("safeToSpend"))
            .font(SurfaceFont.body(size: 13, weight: 600))
            .opacity(0.8)
          Spacer(minLength: 0)
          Text(day.safeShort)
            .font(SurfaceFont.display(entry.displayFont, size: 56))
            .trackingEm(-0.02, size: 56)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
          Spacer(minLength: 0)
          Text(footnote(entry, day))
            .font(SurfaceFont.body(size: 12, weight: 600))
            .opacity(0.8)
            .lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        VStack(spacing: 8) {
          ActionTile(
            glyph: entry.text("glyph.scan"), label: entry.text("scanQr"), path: "/app/scan",
            background: entry.color("accent"), foreground: entry.color("onAccent"))
          ActionTile(
            glyph: entry.text("glyph.add"), label: entry.text("quickAdd"), path: "/app/quick-add",
            background: entry.color("skyInk").opacity(0.2), foreground: entry.color("skyInk"))
        }
        .frame(width: 96)
      }
      .foregroundStyle(entry.color("skyInk"))
      .padding(16)
      .containerBackground(for: .widget) {
        LinearGradient(
          stops: [
            .init(color: entry.color("skyTop"), location: 0),
            .init(color: entry.color("skyMid"), location: 0.7),
            .init(color: entry.color("skyBottom"), location: 1),
          ],
          // CSS 160deg: from just left of the top centre to just right of the bottom centre.
          startPoint: UnitPoint(x: 0.33, y: 0.03), endPoint: UnitPoint(x: 0.67, y: 0.97))
      }
    } else {
      SetUpView(entry: entry)
    }
  }
}

/// A tile that opens the app at a route: radius 18, a 26 pt glyph over a 12 pt label.
struct ActionTile: View {
  let glyph: String
  let label: String
  let path: String
  let background: Color
  let foreground: Color

  var body: some View {
    Link(destination: appLink(path) ?? URL(fileURLWithPath: "/")) {
      VStack(spacing: 4) {
        Text(glyph).font(SurfaceFont.symbol(size: 26))
        Text(label).font(SurfaceFont.body(size: 12, weight: 650)).lineLimit(1)
      }
      .foregroundStyle(foreground)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(background, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
  }
}

/// Lock Screen ring (`SS:44-48`): what is left of today's line, "245k" over "left", inside a
/// 4.5 pt ring set 4 pt in from the glass.
struct SafeRing: View {
  let entry: SurfaceEntry

  var body: some View {
    let fraction = entry.state == .day ? (entry.entry?.ringFraction ?? 0) : 0
    ZStack {
      AccessoryWidgetBackground()
      Group {
        Circle().stroke(ThemeTokens.Activity.ink.opacity(0.25), lineWidth: 4.5)
        Circle()
          .trim(from: 0, to: fraction)
          .stroke(ThemeTokens.Activity.ink, style: StrokeStyle(lineWidth: 4.5, lineCap: .butt))
          .rotationEffect(.degrees(-90))
      }
      .padding(6.25)
      VStack(spacing: 0) {
        Text(entry.entry?.safeShort ?? "–")
          .font(SurfaceFont.body(size: 18, weight: 700))
          .trackingEm(-0.03, size: 18)
          .minimumScaleFactor(0.6)
          .lineLimit(1)
        Text(entry.snapshot == nil ? "" : entry.text("left"))
          .font(SurfaceFont.body(size: 10, weight: 600))
          .trackingEm(0.02, size: 10)
          .opacity(0.7)
      }
      .padding(.horizontal, 13)
    }
    .widgetAccentable()
    .containerBackground(for: .widget) {}
  }
}

/// Lock Screen card (`SS:49-53`): "6pm · Safe today", the number, what is pending.
struct SafeCard: View {
  let entry: SurfaceEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      if let day = entry.entry {
        Text(entry.text("brandSafe"))
          .font(SurfaceFont.body(size: 12, weight: 600))
          .opacity(0.75)
        Text(day.safeShort)
          .font(SurfaceFont.display(entry.displayFont, size: 28))
          .lineLimit(1)
        Text(entry.state == .stale ? entry.text("openApp") : day.pendingText)
          .font(SurfaceFont.body(size: 12, weight: 600))
          .opacity(0.75)
      } else if let snapshot = entry.snapshot {
        Text(snapshot.text("setUp")).font(SurfaceFont.body(size: 12, weight: 600))
      } else {
        Text("setUp", tableName: "Surfaces").font(SurfaceFont.body(size: 12, weight: 600))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(.horizontal, 14)
    .padding(.vertical, 10)
    .containerBackground(for: .widget) { AccessoryWidgetBackground() }
  }
}
