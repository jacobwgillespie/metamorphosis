export class Topology {}

/**
 * TopologyNode represents the topology of Kafka topics necessary
 * for the metamorphosis application to function - it does not represent
 * the topology of every data transformation, but rather just the necessary
 * topics and topic configuration that should be reflected in Kafka.
 */
export interface TopologyNode {
  topic: string
  generated: boolean
  dependents: TopologyNode[]
}
