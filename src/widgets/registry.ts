/**
 * Widget Registry
 *
 * Central registry for all widget types. Widgets register themselves here
 * and can be looked up by type name.
 */

import type { ComponentType } from "preact";
import type { WidgetProps } from "./types.ts";

/**
 * Widget definition stored in the registry
 */
export type RegisteredWidget<T = unknown> = {
  type: string;
  schema: unknown; // Zod schema
  component: ComponentType<WidgetProps<T>>;
  island?: ComponentType<WidgetProps<T>>;
  defaultSettings: Partial<T>;
};

// Global widget registry
const widgets = new Map<string, RegisteredWidget>();

/**
 * Register a widget type
 *
 * @param definition - Widget definition including type, schema, and component
 */
export function registerWidget<T>(definition: RegisteredWidget<T>): void {
  if (widgets.has(definition.type)) {
    console.warn(`Widget type "${definition.type}" is already registered`);
  }
  widgets.set(definition.type, definition as RegisteredWidget<unknown>);
}

/**
 * Get a registered widget by type
 *
 * @param type - Widget type name
 * @returns Widget definition or undefined if not found
 */
export function getWidget(type: string): RegisteredWidget | undefined {
  return widgets.get(type);
}

/**
 * Get all registered widget types
 */
export function getAllWidgetTypes(): string[] {
  return Array.from(widgets.keys());
}

/**
 * Get all registered widgets
 */
export function getAllWidgets(): RegisteredWidget[] {
  return Array.from(widgets.values());
}

/**
 * Check if a widget type is registered
 */
export function isWidgetRegistered(type: string): boolean {
  return widgets.has(type);
}

/**
 * Unregister a widget (mainly for testing)
 */
export function unregisterWidget(type: string): boolean {
  return widgets.delete(type);
}

/**
 * Clear all registered widgets (mainly for testing)
 */
export function clearRegistry(): void {
  widgets.clear();
}
