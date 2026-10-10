import { useState } from 'react';
import { Text, type TextProps } from 'react-native';

/** Breaks `text` into two lines whose lengths differ least, at a space. */
export function balanceTwoLines(text: string): string {
  const words = text.split(' ');
  if (words.length < 2) return text;
  let best = text;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = `${a}\n${b}`;
    }
  }
  return best;
}

/**
 * Text that wraps like CSS `text-wrap: balance` for headings: when it would take two lines, the
 * break moves so both lines are about as long, instead of leaving one word alone.
 */
export function BalancedText({ children, ...props }: TextProps & { readonly children: string }) {
  const [twoLines, setTwoLines] = useState(false);
  return (
    <Text
      {...props}
      onTextLayout={(e) => {
        if (!twoLines && e.nativeEvent.lines.length === 2) setTwoLines(true);
        props.onTextLayout?.(e);
      }}
    >
      {twoLines ? balanceTwoLines(children) : children}
    </Text>
  );
}
