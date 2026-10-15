import SwiftUI

private typealias Ink = ThemeTokens.ShareCard

struct ShareCardView: View {
  @ObservedObject var model: ShareModel
  let onConfirm: () -> Void
  let onSkip: () -> Void

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
      if let under = model.underLine {
        Text(under)
          .font(ShareFont.body(15))
          .foregroundStyle(Ink.soft)
          .padding(.top, -10)
      }
      rows
      if let unsure = unsureLine, !model.editing {
        Text(unsure)
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

  /// What the card is unsure of, the name first.
  private var unsureLine: String? {
    if model.payeeUnsure { return model.text("unsure") }
    return model.currencyUnsure ? model.text("currencyUnsure") : nil
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
      if let step = model.stepText {
        VStack(alignment: .trailing, spacing: 4) {
          Text(step).font(ShareFont.body(13)).foregroundStyle(Ink.soft)
          Button(action: onSkip) {
            Text(model.text("skip"))
              .font(ShareFont.body(13, weight: 600))
              .padding(.horizontal, 12)
              .frame(height: 28)
              .background(Capsule().fill(Ink.editBg))
          }
          .buttonStyle(.plain)
        }
      }
    }
  }

  /// 64 pt Bricolage, the home currency's sign at 0.42 of it and a little faded, on its side.
  /// A foreign amount carries its own sign at full size ("S$68,80").
  private var amount: some View {
    ZStack(alignment: .leading) {
      if model.editing {
        TextField(
          "", text: $model.typedAmount,
          prompt: Text(model.text("amountHint")).foregroundStyle(Ink.soft)
        )
        .keyboardType(model.decimalEntry ? .decimalPad : .numberPad)
        .focused($focus, equals: .amount)
        .font(ShareFont.amount(64))
        .trackingEm(-0.02, size: 64)
      } else {
        let parts = model.amountParts
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          if !parts.prefix.isEmpty {
            Text(parts.prefix).font(ShareFont.amount(64 * 0.42)).opacity(0.55)
          }
          Text(parts.number).font(ShareFont.amount(64)).trackingEm(-0.02, size: 64)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
          if !parts.suffix.isEmpty {
            Text(parts.suffix).font(ShareFont.amount(64 * 0.42)).opacity(0.55)
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
      if let label = model.currencyLabel, let options = model.card?.currencies {
        row(model.text("currency")) { currency(label, options) }
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
        .unsureChip()
      }
      .buttonStyle(.plain)
      .accessibilityHint(model.text("checkName"))
    } else {
      Text(model.payee).font(ShareFont.body(15, weight: 600)).lineLimit(1)
    }
  }

  /// In Edit, a menu; a guessed currency is a dashed chip that opens the same menu, so it can be
  /// switched (re-pricing the card) without opening Edit.
  @ViewBuilder private func currency(
    _ label: String, _ options: [ShareCardData.Currency]
  ) -> some View {
    let name = Text(label).font(ShareFont.body(15, weight: 600))
    if model.editing || model.currencyUnsure {
      Menu {
        Picker("", selection: $model.currency) {
          ForEach(options) { Text($0.label).tag(Optional($0.code)) }
        }
      } label: {
        if model.currencyUnsure && !model.editing {
          HStack(spacing: 6) {
            name
            Text(Symbol.unfoldMore).font(ShareFont.symbol(16)).foregroundStyle(Ink.unsureGlyph)
          }
          .unsureChip()
        } else {
          HStack(spacing: 4) {
            name
            Text(Symbol.unfoldMore).font(ShareFont.symbol(16)).foregroundStyle(Ink.soft)
          }
        }
      }
      .tint(Ink.ink)
      .accessibilityHint(model.currencyUnsure ? model.text("checkCurrency") : "")
    } else {
      name
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

extension View {
  /// The dashed chip around something the card is unsure of (the name, a guessed currency).
  func unsureChip() -> some View {
    padding(.vertical, 3)
      .padding(.horizontal, 8)
      .background(
        RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Ink.unsureFill)
          .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
              .strokeBorder(Ink.unsureEdge, style: StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
          )
      )
  }
}

/// Material Symbols by codepoint: the bundled font is cut to the app's icons, without ligatures.
private enum Symbol {
  static let help = "\u{e8fd}"
  static let unfoldMore = "\u{e5d7}"
}
