import type { Destination } from '../types.js';
import type { ExtensionConfig } from '../config.js';
import { HttpDestination } from './http.js';

export type DestinationId = 'http';

export interface DestinationDefinition {
  readonly id: DestinationId;
  readonly label: string;
  create(config: ExtensionConfig): Destination;
}

const definitions: Record<DestinationId, DestinationDefinition> = {
  http: {
    id: 'http',
    label: 'HTTP',
    create: (config) => new HttpDestination(config),
  },
};

export function getDestination(id: DestinationId, config: ExtensionConfig): Destination {
  const definition = definitions[id];
  if (!definition) throw new Error(`Unknown destination: ${id}`);
  return definition.create(config);
}

export function listDestinations(): DestinationDefinition[] {
  return Object.values(definitions);
}
