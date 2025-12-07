interface SwitchCaseProps<T extends string> {
  value: T;
  caseBy: Record<T, React.ReactNode>;
  default?: React.ReactNode;
}

export function SwitchCase<T extends string>({
  value,
  caseBy,
  default: defaultValue,
}: SwitchCaseProps<T>) {
  return <>{caseBy[value] ?? defaultValue}</>;
}
