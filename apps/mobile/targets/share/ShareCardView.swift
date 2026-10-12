import SwiftUI

private typealias Ink = ThemeTokens.ShareCard

/// The share sheet's card (`SS:188-215`): a light sheet 8 pt in from the edges of the screen over
/// the dimmed app that shared the receipt.
struct ShareSheetView: View {
  @ObservedObject var model: ShareModel
  let onConfirm: () -> Void
  let onCancel: () -> Void

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var shown = false
  @State private var drag: CGFloat = 0

  var body: some View {
    ZStack(alignment: .bottom) {
      Ink.scrim
        .ignoresSafeArea()
        .opacity(shown && !model.leaving ? 1 : 0)
        .onTapGesture(perform: onCancel)
      if shown, !model.leaving, model.phase == .ready {
        ShareCardView(model: model, onConfirm: onConfirm)
          .padding(.horizontal, 8)
          .padding(.bottom, 8)
          .offset(y: max(0, drag))
          .gesture(dismissDrag)
          .transition(reduceMotion ? .opacity : .move(edge: .bottom))
      }
    }
    .ignoresSafeArea(.container, edges: .bottom)
    .animation(ShareMotion.sheet(reduceMotion: reduceMotion), value: model.phase == .ready)
    .animation(ShareMotion.sheet(reduceMotion: reduceMotion), value: model.leaving)
    .onAppear {
      withAnimation(ShareMotion.enter(reduceMotion: reduceMotion)) { shown = true }
    }
  }

  /// Pulled down past 120 pt, or flicked, the sheet goes and nothing is added.
  private var dismissDrag: some Gesture {
    DragGesture()
      .onChanged { drag = $0.translation.height }
      .onEnded { value in
        let flick = value.predictedEndTranslation.height - value.translation.height > 200
        if value.translation.height > ShareMotion.dismissDistance || flick {
          onCancel()
        } else {
          withAnimation(.spring(response: 0.42, dampingFraction: 0.82)) { drag = 0 }
        }
      }
  }
}

struct ShareCardView: View {
  @ObservedObject var model: ShareModel
  let onConfirm: () -> Void

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @FocusState private var focus: Field?

  enum Field {
    case amount
    case name
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      Capsule().fill(Ink.grabber).frame(width: 36, height: 5).frame(maxWidth: .infinity)
      header
      amount
      rows
      if model.payeeUnsure && !model.editing {
        Text(model.text("unsure"))
          .font(ShareFont.body(13))
          .foregroundStyle(Ink.unsureText)
          .padding(.horizontal, 4)
          .padding(.top, -6)
      }
      buttons
    }
    .padding(.top, 10)
    .padding(.horizontal, 20)
    .padding(.bottom, 20)
    .foregroundStyle(Ink.ink)
    .background(
      RoundedRectangle(cornerRadius: 44, style: .continuous)
        .fill(Ink.sheet)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 44, style: .continuous))
        .shadow(color: Ink.shadow, radius: 20, x: 0, y: -10)
    )
    .animation(ShareMotion.sheet(reduceMotion: reduceMotion), value: model.editing)
    .onAppear { if model.editing { focus = .amount } }
  }

  private var header: some View {
    HStack(spacing: 10) {
      if model.showsCompanion, let companion = CompanionPicture.calm40() {
        Image(uiImage: companion).resizable().frame(width: 40, height: 40)
          .accessibilityHidden(true)
      }
      VStack(alignment: .leading, spacing: 1) {
        Text(model.text("title")).font(ShareFont.body(17, weight: 650))
        Text(model.readLine).font(ShareFont.body(13)).foregroundStyle(Ink.soft)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }

  /// 64 pt Bricolage, the đồng sign at 0.42 of it and a little faded.
  private var amount: some View {
    ZStack(alignment: .leading) {
      if model.editing {
        TextField(
          "", text: $model.typedAmount,
          prompt: Text(model.text("amountHint")).foregroundStyle(Ink.soft)
        )
        .keyboardType(.numberPad)
        .focused($focus, equals: .amount)
        .font(ShareFont.amount(64))
        .trackingEm(-0.02, size: 64)
      } else {
        let text = model.amountText
        let number = text.hasSuffix("₫") ? String(text.dropLast()) : text
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text(number).font(ShareFont.amount(64)).trackingEm(-0.02, size: 64)
          if text.hasSuffix("₫") {
            Text("₫").font(ShareFont.amount(64 * 0.42)).opacity(0.55)
          }
        }
        .accessibilityElement(children: .combine)
      }
    }
    .frame(height: 64)
  }

  private var rows: some View {
    VStack(spacing: 0) {
      row(model.text("to"), first: true) { payee }
      row(model.text("when")) {
        Text(model.card?.whenText ?? "").font(ShareFont.body(15, weight: 600))
      }
      if let code = model.card?.code {
        row(model.text("code")) { Text(code).font(ShareFont.mono(14)) }
      }
      if !model.categories.isEmpty || model.categoryName != nil {
        row(model.text("category")) { category }
      }
    }
    .background(
      RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Ink.rows)
        .overlay(
          RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(Ink.hair, lineWidth: 0.5)
        )
    )
  }

  private func row<Value: View>(
    _ label: String, first: Bool = false, @ViewBuilder value: () -> Value
  ) -> some View {
    HStack(spacing: 10) {
      Text(label).foregroundStyle(Ink.soft)
      Spacer(minLength: 10)
      value()
    }
    .font(ShareFont.body(15))
    .padding(.vertical, 12)
    .overlay(alignment: .top) { if !first { Ink.hair.frame(height: 0.5) } }
    .padding(.horizontal, 14)
  }

  @ViewBuilder private var payee: some View {
    if model.editing {
      TextField(
        "",
        text: Binding(get: { model.payee }, set: { model.typedName = $0 }),
        prompt: Text(model.text("nameHint")).foregroundStyle(Ink.soft)
      )
      .focused($focus, equals: .name)
      .multilineTextAlignment(.trailing)
      .font(ShareFont.body(15, weight: 600))
    } else if model.payeeUnsure {
      Button(action: checkName) {
        HStack(spacing: 6) {
          Text(model.payee).font(ShareFont.body(15, weight: 600))
          Text(Symbol.help).font(ShareFont.symbol(16)).foregroundStyle(Ink.unsureGlyph)
        }
        .padding(.vertical, 3)
        .padding(.horizontal, 8)
        .background(
          RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Ink.unsureFill)
            .overlay(
              RoundedRectangle(cornerRadius: 8, style: .continuous)
                .strokeBorder(Ink.unsureEdge, style: StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
            )
        )
      }
      .buttonStyle(.plain)
      .accessibilityHint(model.text("checkName"))
    } else {
      Text(model.payee).font(ShareFont.body(15, weight: 600)).lineLimit(1)
    }
  }

  @ViewBuilder private var category: some View {
    let name = Text(model.categoryName ?? model.text("chooseCategory"))
      .font(ShareFont.body(15, weight: 600))
    if model.editing && !model.categories.isEmpty {
      Menu {
        Picker("", selection: $model.categoryId) {
          ForEach(model.categories) { Text($0.name).tag(Optional($0.id)) }
        }
      } label: {
        HStack(spacing: 4) {
          name
          Text(Symbol.unfoldMore).font(ShareFont.symbol(16)).foregroundStyle(Ink.soft)
        }
      }
      .tint(Ink.ink)
    } else {
      name
    }
  }

  /// Edit and Confirm share the row one to two, 8 pt apart.
  private var buttons: some View {
    GeometryReader { proxy in
      let third = (proxy.size.width - 8) / 3
      HStack(spacing: 8) {
        Button(action: toggleEdit) {
          Text(model.text(model.editing ? "done" : "edit"))
            .font(ShareFont.body(16, weight: 600))
            .frame(width: third, height: 54)
            .background(Capsule().fill(Ink.editBg))
        }
        Button(action: onConfirm) {
          Text(model.text("confirm"))
            .font(ShareFont.body(17, weight: 650))
            .foregroundStyle(Ink.confirmFg)
            .frame(width: third * 2, height: 54)
            .background(Capsule().fill(Ink.ink))
        }
        .disabled(!model.canConfirm)
        .opacity(model.canConfirm ? 1 : 0.4)
      }
      .buttonStyle(.plain)
    }
    .frame(height: 54)
  }

  private func toggleEdit() {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    model.editing.toggle()
    focus = model.editing ? .amount : nil
  }

  private func checkName() {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    model.editing = true
    focus = .name
  }
}

/// Material Symbols by codepoint: the bundled font is cut to the app's icons, without ligatures.
private enum Symbol {
  static let help = "\u{e8fd}"
  static let unfoldMore = "\u{e5d7}"
}

/// The companion the app drew for the surfaces, or the one bundled with the extension when the
/// app has not drawn it yet.
enum CompanionPicture {
  static func calm40() -> UIImage? {
    if let folder = try? GroupFiles.folder("surfaces"),
      let drawn = UIImage(contentsOfFile: folder.appendingPathComponent("companion-calm-40.png").path)
    {
      return drawn
    }
    return UIImage(named: "companion-calm-40")
  }
}
