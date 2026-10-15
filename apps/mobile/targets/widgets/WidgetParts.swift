import SwiftUI
import WidgetKit

/// The small widget's colours and number face, for the snapshot's look and the Home Screen's mode.
struct SmallStyle {
  let ink: Color
  let number: Color
  let button: Color
  let onButton: Color
  let size: CGFloat
  let weight: CGFloat
  let labelOpacity: Double
  let ground: AnyView

  init(entry: SurfaceEntry, dark: Bool) {
    if entry.inLook {
      ink = entry.color("skyInk")
      number = ink
      button = entry.color("accent")
      onButton = entry.color("onAccent")
      size = 38
      weight = 600
      labelOpacity = 0.65
      ground = AnyView(
        LinearGradient(
          colors: [entry.color("skyTop"), entry.color("skyMid")], startPoint: .top,
          endPoint: .bottom))
    } else if dark {
      ink = ThemeTokens.PlainNight.ink
      number = ThemeTokens.PlainNight.accent
      button = ThemeTokens.PlainNight.accent
      onButton = entry.color("onAccent")
      size = 44
      weight = 500
      labelOpacity = 0.6
      ground = AnyView(ThemeTokens.PlainNight.sheetSolid)
    } else {
      ink = entry.color("cardInk")
      number = ink
      button = ink
      onButton = entry.color("cardBg")
      size = 44
      weight = 500
      labelOpacity = 0.6
      ground = AnyView(entry.color("cardBg"))
    }
  }
}

/// The companion the app drew, at a size; nothing in serious mode. With a tinted Home Screen it is
/// drawn in the tint's tones rather than as a flat shape.
struct CompanionPicture: View {
  let image: UIImage?
  let size: CGFloat

  var body: some View {
    if let image {
      if #available(iOS 18.0, *) {
        Image(uiImage: image)
          .resizable()
          .widgetAccentedRenderingMode(.desaturated)
          .frame(width: size, height: size)
      } else {
        Image(uiImage: image).resizable().frame(width: size, height: size)
      }
    }
  }
}

/// A round button that opens the app at a route: Scan QR on the small widget.
struct RoundLink: View {
  let glyph: String
  let path: String
  let size: CGFloat
  let glyphSize: CGFloat
  let background: Color
  let foreground: Color

  var body: some View {
    Link(destination: appLink(path) ?? URL(fileURLWithPath: "/")) {
      Text(glyph)
        .font(SurfaceFont.symbol(size: glyphSize))
        .foregroundStyle(foreground)
        .frame(width: size, height: size)
        .background(background, in: Circle())
        .widgetAccentable()
    }
  }
}

/// A 6 pt bar: what is spent of a line.
struct LineBar: View {
  let fraction: Double
  let track: Color
  let fill: Color

  var body: some View {
    GeometryReader { proxy in
      ZStack(alignment: .leading) {
        Capsule().fill(track)
        Capsule()
          .fill(fill)
          .frame(width: proxy.size.width * min(1, max(0, fraction)))
      }
    }
    .frame(height: 6)
  }
}

/// A filled Material Symbols glyph at a size, in the surrounding foreground colour.
struct FilledGlyph: View {
  let glyph: String
  let size: CGFloat

  var body: some View {
    if let image = SurfaceFont.filledGlyph(glyph, size: size) {
      Image(uiImage: image)
    }
  }
}

/// The app's icon, small, at the head of a Live Activity on the Lock Screen.
struct AppMark: View {
  var body: some View {
    Image("AppMark")
      .resizable()
      .frame(width: 20, height: 20)
      .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
  }
}
