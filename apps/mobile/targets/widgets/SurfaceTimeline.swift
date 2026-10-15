import SwiftUI
import UIKit
import WidgetKit

/// The snapshot the app writes for its widgets (`SurfaceSnapshot` in `@6pm/domain`). Every word,
/// number and colour in it was decided by the app.
struct SurfaceSnapshot: Decodable {
  struct Row: Decodable {
    let name: String
    let amountText: String
    /// The Material Symbols glyph itself (its private-use character).
    let icon: String
    let hue: Double
    let pending: Bool
  }

  struct Entry: Decodable {
    let from: String
    let safeText: String
    let safeShort: String
    let tomorrowText: String
    let pendingText: String
    let ringFraction: Double
    let list: [Row]
    let moreText: String
    /// The large widget's bar: "155k spent" of "of 400k", and how full it is. Absent in a snapshot
    /// written before the bar was drawn.
    let spentText: String?
    let lineText: String?
    let spentFraction: Double?
    /// What the spends past the list add up to, beside "+2 more".
    let moreAmountText: String?
  }

  struct HourPalette: Decodable {
    let hour: Int
    let tokens: [String: String]
  }

  let v: Int
  let writtenAt: String
  let maxLook: String?
  let serious: Bool
  let entries: [Entry]
  let palettes: [HourPalette]
  let strings: [String: String]

  static let version = 1

  /// What the app last wrote, or nil before it has written a version this widget reads.
  static func load() -> SurfaceSnapshot? {
    guard let data = GroupFiles.readSurface("snapshot"),
      let snapshot = try? JSONDecoder().decode(SurfaceSnapshot.self, from: data),
      snapshot.v == version
    else { return nil }
    return snapshot
  }

  func text(_ key: String) -> String { strings[key] ?? "" }

  func tokens(at date: Date) -> [String: String] {
    let hour = Calendar.current.component(.hour, from: date)
    return palettes.first { $0.hour == hour }?.tokens ?? palettes.first?.tokens ?? [:]
  }
}

private let isoFormatter: ISO8601DateFormatter = {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  return formatter
}()

func surfaceDate(_ iso: String) -> Date? {
  isoFormatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
}

/// One moment of a widget: the stretch of the day it shows, in that hour's colours.
struct SurfaceEntry: TimelineEntry {
  enum State {
    /// The app has not set the month up (or not written anything yet).
    case setUp
    case day
    /// Past the last stretch the app wrote: the last number, and a nudge to open 6pm.
    case stale
  }

  let date: Date
  let state: State
  let snapshot: SurfaceSnapshot?
  let entry: SurfaceSnapshot.Entry?
  let tokens: [String: String]

  func color(_ token: String) -> Color { Color(css: tokens[token]) }
  func text(_ key: String) -> String { snapshot?.text(key) ?? "" }
  var displayFont: String? { snapshot?.strings["font.display"] }
  /// Drawn in the user's look (Max): the look's own ground and display face.
  var inLook: Bool { snapshot?.maxLook != nil }

  /// The companion in the hour's mood at a size, or nil in serious mode (and before the app drew
  /// it in that mood).
  func companion(size: Int) -> UIImage? {
    guard snapshot?.serious == false else { return nil }
    return CompanionImage.load(mood: tokens["mood"] ?? "calm", size: size)
      ?? CompanionImage.load(mood: "calm", size: size)
  }
}

/// How long the last stretch the app wrote is good for before it counts as out of date.
private let lastStretch: TimeInterval = 24 * 60 * 60

/// A timeline from the app's entries, redrawn at the top of every hour so the colours follow the
/// sky, refreshed by WidgetKit after the next money-day boundary (04:00).
struct SurfaceTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> SurfaceEntry {
    SurfaceEntry(date: .now, state: .setUp, snapshot: nil, entry: nil, tokens: [:])
  }

  func getSnapshot(in context: Context, completion: @escaping (SurfaceEntry) -> Void) {
    completion(Self.timeline(now: .now).entries.first ?? placeholder(in: context))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SurfaceEntry>) -> Void) {
    completion(Self.timeline(now: .now))
  }

  static func timeline(now: Date) -> Timeline<SurfaceEntry> {
    let loaded = SurfaceSnapshot.load()
    guard let snapshot = loaded, !snapshot.entries.isEmpty else {
      let entry = SurfaceEntry(
        date: now, state: .setUp, snapshot: loaded, entry: nil,
        tokens: loaded?.tokens(at: now) ?? [:])
      return Timeline(entries: [entry], policy: .never)
    }
    let starts = snapshot.entries.map { surfaceDate($0.from) ?? now }
    let end = (starts.last ?? now).addingTimeInterval(lastStretch)

    var dates: Set<Date> = [now, end]
    for start in starts where start > now && start < end { dates.insert(start) }
    var hour = Calendar.current.dateInterval(of: .hour, for: now)?.end ?? end
    while hour < end {
      dates.insert(hour)
      hour = hour.addingTimeInterval(60 * 60)
    }

    let entries = dates.sorted().filter { $0 >= now }.map { date -> SurfaceEntry in
      let index = starts.lastIndex { $0 <= date } ?? 0
      return SurfaceEntry(
        date: date, state: date >= end ? .stale : .day, snapshot: snapshot,
        entry: snapshot.entries[index], tokens: snapshot.tokens(at: date))
    }
    let next = starts.first { $0 > now } ?? (now < end ? end : nil)
    return Timeline(entries: entries, policy: next.map { .after($0) } ?? .never)
  }
}

/// The companion the app drew for the surfaces (`companion-<mood>-<size>.png` in the group).
enum CompanionImage {
  static func load(mood: String, size: Int) -> UIImage? {
    guard let folder = try? GroupFiles.folder("surfaces") else { return nil }
    return UIImage(contentsOfFile: folder.appendingPathComponent("companion-\(mood)-\(size).png").path)
  }
}

/// Where a widget's links go: the app's universal links (`/app/scan`, `/app/quick-add`).
func appLink(_ path: String) -> URL? {
  URL(string: "https://\(GroupFiles.host)\(path)")
}
