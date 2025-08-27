import { totalRuleCount } from '../core/command';
import type { CommandDescriptor } from '../core/command';

/** @internal Implementation detail behind the public `CommandRegistry`. */
class CommandRegistryImpl {
  private map = new Map<string, CommandDescriptor>();

  /** Register a command descriptor by key. Throws if duplicate or empty. */
  register(descriptor: CommandDescriptor): void {
    const { key } = descriptor;
    if (this.map.has(key)) throw new Error(`command already registered: ${key}`);
    if (totalRuleCount(descriptor) === 0) throw new Error(`command has zero rules: ${key}`);
    this.map.set(key, descriptor);
  }

  /** Retrieve a descriptor or undefined if not found. */
  get(key: string): CommandDescriptor | undefined {
    return this.map.get(key);
  }

  /** List all registered descriptors. */
  list(): readonly CommandDescriptor[] {
    return Array.from(this.map.values());
  }

  /** Clear all registrations (primarily for tests). */
  clear(): void {
    this.map.clear();
  }
}

/**
 * Global command registry used by the authoring DSL to auto-register
 * descriptors. You can also register custom commands manually in bootstrap.
 */
export const CommandRegistry = new CommandRegistryImpl();
