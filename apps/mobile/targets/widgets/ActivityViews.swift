import SwiftUI
import WidgetKit

private let soft = ThemeTokens.Activity.ink.opacity(0.6)
private let head = ThemeTokens.Activity.ink.opacity(0.7)
private let pillQuiet = ThemeTokens.Activity.ink.opacity(0.14)
private let barTrack = ThemeTokens.Activity.ink.opacity(0.16)

/// The head of a Live Activity on the Lock Screen: the app's icon, what it is, and on the right
/// how long ago it started.
struct ActivityHead<Trailing: View>: View {
  let title: String
  @ViewBuilder let trailing: () -> Trailing

  var body: some View {
    HStack(spacing: 8) {
      AppMark()
      Text(title).lineLimit(1).layoutPriority(1)
      Spacer(minLength: 8)
      trailing()
    }
    .font(SurfaceFont.body(size: 13, weight: 600))
    .foregroundStyle(head)
  }
}

/// "2 min ago", kept current by the system; the time it started before iOS 18.
struct SinceText: View {
  let iso: String?

  var body: some View {
    if let iso, let date = surfaceDate(iso) {
      if #available(iOS 18.0, *) {
        // The system sizes a live date for its longest wording; the words sit at its right edge.
        Text(
          .currentDate,
          format: .reference(to: date, allowedFields: [.hour, .minute], maxFieldCount: 1)
        )
        .multilineTextAlignment(.trailing)
      } else {
        Text(date, style: .time)
      }
    }
  }
}

/// Waiting to pay, Lock Screen: the head, the amount large with its symbol set small, to whom and
/// through which bank, the companion thinking, then Paid.
struct PendingPayLock: View {
  let state: PendingPayState

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      ActivityHead(title: state.caption) { SinceText(iso: state.since) }
      HStack(spacing: 12) {
        VStack(alignment: .leading, spacing: 4) {
          if let amount = state.amount {
            AmountLine(parts: amount)
            Text(state.detail ?? "")
              .font(SurfaceFont.body(size: 13, weight: 400))
              .foregroundStyle(soft)
              .lineLimit(1)
          } else {
            Text(state.title).font(SurfaceFont.body(size: 15, weight: 650)).lineLimit(1)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        CompanionOrNothing(name: state.companion, size: 52)
      }
      PaidButton(state: state)
    }
  }
}

/// "45.000₫" in the display face at 40 pt, the symbol at 0.45 of that and softer.
struct AmountLine: View {
  let parts: PendingPayState.Parts

  var body: some View {
    let symbol = SurfaceFont.display(activityDisplayFont, size: 18)
    HStack(alignment: .firstTextBaseline, spacing: 3) {
      if !parts.prefix.isEmpty { Text(parts.prefix).font(symbol).opacity(0.6) }
      Text(parts.number)
        .font(SurfaceFont.display(activityDisplayFont, size: 40))
        .trackingEm(-0.02, size: 40)
      if !parts.suffix.isEmpty { Text(parts.suffix).font(symbol).opacity(0.6) }
    }
    .lineLimit(1)
    .minimumScaleFactor(0.6)
  }
}

/// Waiting to pay, expanded island: the companion beside "Waiting · MB Bank" and the amount to
/// whom, then Paid.
struct PendingPayExpanded: View {
  let state: PendingPayState

  var body: some View {
    VStack(spacing: 12) {
      HStack(spacing: 12) {
        CompanionOrNothing(name: state.companion, size: 46)
        VStack(alignment: .leading, spacing: 2) {
          Text(state.bankCaption ?? state.caption)
            .font(SurfaceFont.body(size: 13, weight: 400))
            .foregroundStyle(soft)
          Text(state.title)
            .font(SurfaceFont.body(size: 16, weight: 650))
            .foregroundStyle(ThemeTokens.Activity.ink)
        }
        .lineLimit(1)
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      PaidButton(state: state)
    }
    .padding(.horizontal, 6)
    .padding(.bottom, 4)
  }
}

/// Travel day, Lock Screen: the head, what is left today in the local money large with the line
/// and the home currency beside it, the day's bar, then Log in the local currency.
struct TravelLock: View {
  let state: TravelState

  var body: some View {
    if let leftAmount = state.leftAmount {
      VStack(alignment: .leading, spacing: 12) {
        ActivityHead(title: state.place) { EmptyView() }
        HStack(alignment: .firstTextBaseline, spacing: 8) {
          Text(leftAmount)
            .font(SurfaceFont.display(activityDisplayFont, size: 40))
            .trackingEm(-0.02, size: 40)
            .foregroundStyle(ThemeTokens.Activity.ink)
          Text(state.leftDetail ?? "")
            .font(SurfaceFont.body(size: 13, weight: 400))
            .foregroundStyle(soft)
        }
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        LineBar(fraction: state.fraction, track: barTrack, fill: Color(css: state.accent))
        if let log = state.log, let link = appLink(state.logPath ?? "/app/quick-add") {
          Link(destination: link) {
            ActivityPill(
              background: Color(css: state.accent), foreground: Color(css: state.onAccent)
            ) {
              if let icon = state.logIcon { Text(icon).font(SurfaceFont.symbol(size: 18)) }
              Text(log)
            }
          }
        }
      }
    } else {
      TravelExpanded(state: state)
    }
  }
}

/// Travel day, expanded island: the plane and the place, what is left large with the home
/// currency beside it, the day's bar.
struct TravelExpanded: View {
  let state: TravelState

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(spacing: 10) {
        FilledGlyph(glyph: state.icon, size: 20)
          .foregroundStyle(Color(css: state.accent))
        Text(state.place)
        Spacer(minLength: 0)
      }
      .font(SurfaceFont.body(size: 13, weight: 400))
      .foregroundStyle(soft)
      HStack(alignment: .firstTextBaseline, spacing: 8) {
        Text(state.leftAmount ?? state.spent)
          .font(SurfaceFont.display(activityDisplayFont, size: 34))
          .trackingEm(-0.02, size: 34)
          .foregroundStyle(ThemeTokens.Activity.ink)
        Text(state.leftHome ?? state.of)
          .font(SurfaceFont.body(size: 13, weight: 400))
          .foregroundStyle(soft)
      }
      .lineLimit(1)
      .minimumScaleFactor(0.7)
      LineBar(fraction: state.fraction, track: barTrack, fill: Color(css: state.accent))
    }
    .padding(.horizontal, 6)
    .padding(.bottom, 4)
  }
}

/// Travel day, minimal island: the day's bar as a ring around the plane.
struct TravelMinimal: View {
  let state: TravelState

  var body: some View {
    ZStack {
      Circle().stroke(ThemeTokens.Activity.ink.opacity(0.2), lineWidth: 2.5)
      Circle()
        .trim(from: 0, to: min(1, max(0, state.fraction)))
        .stroke(Color(css: state.accent), style: StrokeStyle(lineWidth: 2.5, lineCap: .butt))
        .rotationEffect(.degrees(-90))
      FilledGlyph(glyph: state.icon, size: 13)
        .foregroundStyle(Color(css: state.accent))
    }
    .frame(width: 26, height: 26)
  }
}
