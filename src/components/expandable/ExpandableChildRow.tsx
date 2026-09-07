import type { HTMLAttributes, ReactNode, TdHTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

export type ExpandableChildRowProps = {
  children: ReactNode;
  className?: string;
  id?: string;
} & Omit<HTMLAttributes<HTMLTableRowElement>, "children" | "className" | "id">;

export function ExpandableChildRow({ children, className, id, ...rest }: ExpandableChildRowProps) {
  return (
    <tr id={id} className={cx("pilotage-expandable-child-row", className)} {...rest}>
      {children}
    </tr>
  );
}

export type ExpandableChildCellProps = {
  children?: ReactNode;
  indent?: boolean;
  className?: string;
  colSpan?: number;
} & Omit<TdHTMLAttributes<HTMLTableCellElement>, "children" | "className" | "colSpan">;

export function ExpandableChildCell({
  children,
  indent = false,
  className,
  colSpan,
  ...rest
}: ExpandableChildCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={cx(
        "pilotage-expandable-child-cell",
        indent && "pilotage-expandable-child-cell--indent",
        className,
      )}
      {...rest}
    >
      <div className="fr-text--sm fr-mb-0">{children}</div>
    </td>
  );
}
