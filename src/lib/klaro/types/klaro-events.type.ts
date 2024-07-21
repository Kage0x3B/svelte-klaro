import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
import KlaroApi from '$lib/klaro/utils/api.js';

export const klaroEventTypes = ['apiConfigsLoaded', 'apiConfigsFailed'] as const;
export type KlaroEventType = (typeof klaroEventTypes)[number];

export type KlaroEventHandler<EventType extends KlaroEventType = KlaroEventType> = (
    ...args: KlaroEventArgs<EventType>
) => boolean | undefined;

export type KlaroEventArgs<EventType extends KlaroEventType = KlaroEventType> = EventType extends 'apiConfigsLoaded'
    ? [config: [KlaroConfigInterface], api: KlaroApi]
    : EventType extends 'apiConfigsFailed'
      ? [error: unknown]
      : unknown[];
