import { Link, type Href } from 'expo-router';
import type { ReactElement } from 'react';

/**
 * The iOS context menu a held Today row lifts into: Confirm (for a caught spend), Edit, Delete.
 * The row's own gestures still own the tap and the swipe; the link only lends its menu.
 */
export function SpendRowMenu({
  href,
  reviewable,
  confirmLabel,
  editLabel,
  deleteLabel,
  deleteIcon = 'trash',
  onConfirm,
  onEdit,
  onDelete,
  children,
}: {
  readonly href: Href;
  readonly reviewable: boolean;
  readonly confirmLabel: string;
  readonly editLabel: string;
  readonly deleteLabel: string;
  /** The SF Symbol beside the removing action. */
  readonly deleteIcon?: 'trash' | 'xmark';
  readonly onConfirm: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly children: ReactElement;
}) {
  return (
    <Link href={href} asChild>
      <Link.Trigger>{children}</Link.Trigger>
      <Link.Menu>
        <Link.MenuAction icon="checkmark.circle" hidden={!reviewable} onPress={onConfirm}>
          {confirmLabel}
        </Link.MenuAction>
        <Link.MenuAction icon="pencil" onPress={onEdit}>
          {editLabel}
        </Link.MenuAction>
        <Link.MenuAction icon={deleteIcon} destructive onPress={onDelete}>
          {deleteLabel}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}
