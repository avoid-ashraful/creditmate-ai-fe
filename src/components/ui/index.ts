/**
 * CreditMate design-system component library (Phase 0 foundation).
 *
 * Primitives and product components built entirely on design tokens
 * (src/styles/tokens.css). Pages adopt these progressively from Phase 1;
 * a page may not ship a bespoke variant of anything exported here.
 */

// Primitives
export { default as Alert } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';
export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';
export { default as Button } from './Button';
export type { ButtonProps } from './Button';
export { default as Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export { default as ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';
export { default as DataTable } from './DataTable';
export type { DataTableColumn, DataTableProps } from './DataTable';
export { default as Dialog } from './Dialog';
export type { DialogProps } from './Dialog';
export { default as Gloss } from './Gloss';
export type { GlossProps } from './Gloss';
export { default as Input } from './Input';
export type { InputProps } from './Input';
export { default as MoneyInput } from './MoneyInput';
export type { MoneyInputProps } from './MoneyInput';
export { default as Pagination, paginationItems } from './Pagination';
export type { PaginationProps } from './Pagination';
export { default as PromptDialog } from './PromptDialog';
export type { PromptDialogProps } from './PromptDialog';
export { default as Radio } from './Radio';
export type { RadioProps } from './Radio';
export { default as Select } from './Select';
export type { SelectProps } from './Select';
export { default as Switch } from './Switch';
export type { SwitchProps } from './Switch';
export { default as Tabs } from './Tabs';
export type { TabItem, TabsProps } from './Tabs';
export { ToastProvider, useToast } from './Toast';
export type { ToastAction, ToastOptions, ToastVariant } from './Toast';
export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

// Product components
export { default as DetailSummary } from './DetailSummary';
export type { DetailSummaryFact, DetailSummaryProps } from './DetailSummary';
export { default as Money } from './Money';
export type { MoneyProps } from './Money';
export { default as ResultCard } from './ResultCard';
export type { ResultCardFact, ResultCardProps } from './ResultCard';
export { default as ScenarioPanel } from './ScenarioPanel';
export type { ScenarioPanelProps } from './ScenarioPanel';
export { default as SliderWithBubble } from './SliderWithBubble';
export type { SliderWithBubbleProps } from './SliderWithBubble';
export { default as Sparkline } from './Sparkline';
export type { SparklinePoint, SparklineProps } from './Sparkline';
export { default as StatusChip } from './StatusChip';
export type { StatusChipProps, StatusChipTone } from './StatusChip';
export { default as TrustChip } from './TrustChip';
export type { TrustChipMarker, TrustChipProps } from './TrustChip';
export { default as UnknownValue } from './UnknownValue';
export type { UnknownValueKind, UnknownValueProps } from './UnknownValue';
export { default as VerdictStrip } from './VerdictStrip';
export type { VerdictItem, VerdictStripProps } from './VerdictStrip';
