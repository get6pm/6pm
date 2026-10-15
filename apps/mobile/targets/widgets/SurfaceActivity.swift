import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

/// The content states the app writes (`features/surfaces/activity-state.ts`), already worded. The
/// later fields are optional: an activity started by an older app still decodes.
struct PendingPayState: Decodable {
  struct Parts: Decodable {
    let prefix: String
    let number: String
    let suffix: String
  }

  let spendId: String
  let caption: String
  let title: String
  let short: String
  let paid: String
  let paidIcon: String?
  let path: String
  let companion: String?
  let accent: String
  let onAccent: String
  let amount: Parts?
  let detail: String?
  let bankCaption: String?
  let since: String?
}

struct TravelState: Decodable {
  let icon: String
  let place: String
  let left: String
  let spent: String
  let of: String
  let fraction: Double
  let path: String
  let accent: String
  let leftAmount: String?
  let leftDetail: String?
  let leftHome: String?
  let log: String?
  let logIcon: String?
  let logPath: String?
  let onAccent: String?
}

extension SurfaceAttributes.ContentState {
  func decoded<T: Decodable>(_ type: T.Type) -> T? {
    guard let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }
}

/// The look's display face, as the widgets last wrote it.
var activityDisplayFont: String? { SurfaceSnapshot.load()?.strings["font.display"] }

/// The one Live Activity type: a waiting QR payment (`pendingPay`) or a trip (`travel`).
struct SurfaceActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SurfaceAttributes.self) { context in
      LockBanner(attributes: context.attributes, state: context.state)
        .activityBackgroundTint(ThemeTokens.Activity.banner)
        .activitySystemActionForegroundColor(ThemeTokens.Activity.ink)
    } dynamicIsland: { context in
      let attributes = context.attributes
      let state = context.state
      let pay = attributes.kind == "pendingPay" ? state.decoded(PendingPayState.self) : nil
      let trip = attributes.kind == "travel" ? state.decoded(TravelState.self) : nil
      return DynamicIsland {
        DynamicIslandExpandedRegion(.bottom) {
          if let pay {
            PendingPayExpanded(state: pay)
          } else if let trip {
            TravelExpanded(state: trip)
          }
        }
      } compactLeading: {
        if let pay {
          CompanionOrNothing(name: pay.companion, size: 24)
        } else if let trip {
          FilledGlyph(glyph: trip.icon, size: 21)
            .foregroundStyle(Color(css: trip.accent))
        }
      } compactTrailing: {
        if let pay {
          Text(pay.short)
            .font(SurfaceFont.body(size: 14, weight: 650))
            .foregroundStyle(Color(css: pay.accent))
        } else if let trip {
          Text(trip.leftAmount ?? trip.left)
            .font(SurfaceFont.body(size: 14, weight: 650))
            .foregroundStyle(Color(css: trip.accent))
        }
      } minimal: {
        if let pay {
          if pay.companion == nil {
            Text(pay.short)
              .font(SurfaceFont.body(size: 12, weight: 650))
              .foregroundStyle(Color(css: pay.accent))
              .minimumScaleFactor(0.6)
          } else {
            CompanionOrNothing(name: pay.companion, size: 26)
          }
        } else if let trip {
          TravelMinimal(state: trip)
        }
      }
      .widgetURL(appLink(pay?.path ?? trip?.path ?? "/app"))
    }
  }
}

/// The companion picture the app drew, in the activity's mood, or nothing in serious mode.
struct CompanionOrNothing: View {
  let name: String?
  let size: Int

  var body: some View {
    if let name, let image = CompanionImage.load(mood: name, size: size) {
      Image(uiImage: image).resizable().frame(width: CGFloat(size), height: CGFloat(size))
    }
  }
}

/// Lock Screen: the waiting payment or the trip on the banner's dark glass.
struct LockBanner: View {
  let attributes: SurfaceAttributes
  let state: SurfaceAttributes.ContentState

  var body: some View {
    Group {
      if attributes.kind == "pendingPay", let pay = state.decoded(PendingPayState.self) {
        PendingPayLock(state: pay)
          .padding(EdgeInsets(top: 14, leading: 16, bottom: 16, trailing: 16))
          .widgetURL(appLink(pay.path))
      } else if attributes.kind == "travel", let trip = state.decoded(TravelState.self) {
        TravelLock(state: trip)
          .padding(EdgeInsets(top: 14, leading: 16, bottom: 16, trailing: 16))
          .widgetURL(appLink(trip.path))
      }
    }
    .foregroundStyle(ThemeTokens.Activity.ink)
  }
}

/// A Live Activity's 40 pt pill: Paid on a waiting payment, Log on a trip.
struct ActivityPill<Label: View>: View {
  let background: Color
  let foreground: Color
  @ViewBuilder let label: () -> Label

  var body: some View {
    HStack(spacing: 5, content: label)
      .font(SurfaceFont.body(size: 14, weight: 650))
      .foregroundStyle(foreground)
      .frame(maxWidth: .infinity)
      .frame(height: 40)
      .background(background, in: Capsule())
  }
}

/// "Paid": leaves the inbox event and ends the activity.
struct PaidButton: View {
  let state: PendingPayState

  var body: some View {
    Button(intent: MarkPaidIntent(spendId: state.spendId)) {
      ActivityPill(background: Color(css: state.accent), foreground: Color(css: state.onAccent)) {
        if let icon = state.paidIcon { Text(icon).font(SurfaceFont.symbol(size: 18)) }
        Text(state.paid)
      }
    }
    .buttonStyle(.plain)
  }
}
