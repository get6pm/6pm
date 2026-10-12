import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

/// The content states the app writes (`features/surfaces/activity-state.ts`), already worded.
struct PendingPayState: Decodable {
  let spendId: String
  let caption: String
  let title: String
  let short: String
  let paid: String
  let path: String
  let companion: String?
  let accent: String
  let onAccent: String
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
}

extension SurfaceAttributes.ContentState {
  func decoded<T: Decodable>(_ type: T.Type) -> T? {
    guard let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }
}

/// The one Live Activity type: a waiting QR payment (`pendingPay`) or a trip (`travel`).
struct SurfaceActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SurfaceAttributes.self) { context in
      LockBanner(attributes: context.attributes, state: context.state)
        .activityBackgroundTint(.black.opacity(0.55))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      let attributes = context.attributes
      let state = context.state
      let pay = attributes.kind == "pendingPay" ? state.decoded(PendingPayState.self) : nil
      let trip = attributes.kind == "travel" ? state.decoded(TravelState.self) : nil
      return DynamicIsland {
        DynamicIslandExpandedRegion(.bottom) {
          if let pay {
            PendingPayRow(state: pay, companionSize: 46, buttonHeight: 36, buttonPadding: 16)
          } else if let trip {
            TravelPanel(state: trip)
          }
        }
      } compactLeading: {
        if let pay {
          CompanionOrNothing(name: pay.companion, size: 24)
        } else if let trip {
          Text(trip.icon).font(SurfaceFont.symbol(size: 20)).foregroundStyle(Color(css: trip.accent))
        }
      } compactTrailing: {
        if let pay {
          Text(pay.short)
            .font(SurfaceFont.body(size: 14, weight: 650))
            .foregroundStyle(Color(css: pay.accent))
        } else if let trip {
          Text(trip.left)
            .font(SurfaceFont.body(size: 13, weight: 600))
            .foregroundStyle(.white.opacity(0.6))
        }
      } minimal: {
        if let pay {
          if pay.companion == nil {
            Text(pay.short)
              .font(SurfaceFont.body(size: 12, weight: 650))
              .foregroundStyle(Color(css: pay.accent))
              .minimumScaleFactor(0.6)
          } else {
            CompanionOrNothing(name: pay.companion, size: 24)
          }
        } else if let trip {
          Text(trip.icon).font(SurfaceFont.symbol(size: 20)).foregroundStyle(Color(css: trip.accent))
        }
      }
      .widgetURL(appLink(pay?.path ?? trip?.path ?? "/app"))
    }
  }
}

/// The companion picture the app drew, or nothing in serious mode.
struct CompanionOrNothing: View {
  let name: String?
  let size: Int

  var body: some View {
    if let name, let image = CompanionImage.load(mood: name, size: size) {
      Image(uiImage: image).resizable().frame(width: CGFloat(size), height: CGFloat(size))
    }
  }
}

/// Lock Screen (`SS:55-64`): the companion, "Waiting · tap when paid", "45.000₫ to Phở Hòa", Paid.
/// A trip shows its expanded panel here too.
struct LockBanner: View {
  let attributes: SurfaceAttributes
  let state: SurfaceAttributes.ContentState

  var body: some View {
    Group {
      if attributes.kind == "pendingPay", let pay = state.decoded(PendingPayState.self) {
        PendingPayRow(state: pay, companionSize: 44, buttonHeight: 34, buttonPadding: 14)
          .padding(EdgeInsets(top: 14, leading: 16, bottom: 14, trailing: 14))
          .widgetURL(appLink(pay.path))
      } else if attributes.kind == "travel", let trip = state.decoded(TravelState.self) {
        TravelPanel(state: trip)
          .padding(EdgeInsets(top: 16, leading: 20, bottom: 18, trailing: 20))
          .widgetURL(appLink(trip.path))
      }
    }
    .foregroundStyle(.white)
  }
}

/// The waiting payment's row, shared by the Lock Screen and the expanded island (`SS:147-151`).
struct PendingPayRow: View {
  let state: PendingPayState
  let companionSize: Int
  let buttonHeight: CGFloat
  let buttonPadding: CGFloat

  var body: some View {
    HStack(spacing: 12) {
      CompanionOrNothing(name: state.companion, size: companionSize)
      VStack(alignment: .leading, spacing: 2) {
        Text(state.caption)
          .font(SurfaceFont.body(size: 12, weight: 600))
          .foregroundStyle(.white.opacity(0.55))
          .lineLimit(1)
        Text(state.title)
          .font(SurfaceFont.body(size: 15, weight: 650))
          .foregroundStyle(.white)
          .lineLimit(1)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      Button(intent: MarkPaidIntent(spendId: state.spendId)) {
        Text(state.paid)
          .font(SurfaceFont.body(size: 14, weight: 650))
          .foregroundStyle(Color(css: state.onAccent))
          .padding(.horizontal, buttonPadding)
          .frame(height: buttonHeight)
          .background(Color(css: state.accent), in: Capsule())
      }
      .buttonStyle(.plain)
    }
  }
}

/// Travel (`SS:152-156`): where and how much is left, the day's spend, its bar.
struct TravelPanel: View {
  let state: TravelState

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(spacing: 10) {
        Text(state.icon).font(SurfaceFont.symbol(size: 20)).foregroundStyle(Color(css: state.accent))
        Text(state.place)
        Spacer(minLength: 0)
        Text(state.left)
      }
      .font(SurfaceFont.body(size: 13, weight: 600))
      .foregroundStyle(.white.opacity(0.6))
      HStack(alignment: .firstTextBaseline, spacing: 8) {
        Text(state.spent)
          .font(SurfaceFont.display(SurfaceSnapshot.load()?.strings["font.display"], size: 34))
          .foregroundStyle(.white)
        Text(state.of)
          .font(SurfaceFont.body(size: 14, weight: 400))
          .foregroundStyle(.white.opacity(0.6))
          .lineLimit(1)
      }
      GeometryReader { proxy in
        ZStack(alignment: .leading) {
          Capsule().fill(.white.opacity(0.15))
          Capsule()
            .fill(Color(css: state.accent))
            .frame(width: proxy.size.width * min(1, max(0, state.fraction)))
        }
      }
      .frame(height: 6)
    }
  }
}
