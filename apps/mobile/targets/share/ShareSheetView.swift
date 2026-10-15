import SwiftUI

private typealias Ink = ThemeTokens.ShareCard

/// The share sheet's card (`SS:188-215`): a light sheet 8 pt in from the edges of the screen over
/// the dimmed app that shared the receipt.
struct ShareSheetView: View {
  @ObservedObject var model: ShareModel
  let onConfirm: () -> Void
  let onSkip: () -> Void
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
        ZStack(alignment: .bottom) {
          // Each receipt is its own card: Confirm or Skip slides the next one in from the side.
          ShareCardView(model: model, onConfirm: onConfirm, onSkip: onSkip)
            .id(model.index)
            .transition(reduceMotion ? .opacity : next)
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 8)
        .offset(y: max(0, drag))
        .gesture(dismissDrag)
        .transition(reduceMotion ? .opacity : .move(edge: .bottom))
      }
    }
    .ignoresSafeArea(.container, edges: .bottom)
    .animation(ShareMotion.sheet(reduceMotion: reduceMotion), value: model.phase == .ready)
    .animation(ShareMotion.sheet(reduceMotion: reduceMotion), value: model.index)
    .animation(ShareMotion.sheet(reduceMotion: reduceMotion), value: model.leaving)
    .onAppear {
      withAnimation(ShareMotion.enter(reduceMotion: reduceMotion)) { shown = true }
    }
  }

  private var next: AnyTransition {
    .asymmetric(
      insertion: .move(edge: .trailing).combined(with: .opacity),
      removal: .move(edge: .leading).combined(with: .opacity))
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
