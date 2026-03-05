/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "three/examples/jsm/postprocessing/UnrealBloomPass.js" {
  export class UnrealBloomPass {
    constructor(resolution: any, strength: number, radius: number, threshold: number);
  }
}

declare module "react-force-graph-3d" {
  import { Component } from "react";

  interface ForceGraph3DProps {
    graphData?: { nodes: any[]; links: any[] };
    nodeColor?: string | ((node: any) => string);
    nodeLabel?: string | ((node: any) => string);
    nodeOpacity?: number;
    nodeVal?: number | ((node: any) => number);
    linkLabel?: string | ((link: any) => string);
    linkColor?: string | ((link: any) => string);
    linkWidth?: number | ((link: any) => number);
    linkOpacity?: number;
    backgroundColor?: string;
    width?: number;
    height?: number;
    enableNodeDrag?: boolean;
    enableNavigationControls?: boolean;
    showNavInfo?: boolean;
    onNodeClick?: (node: any, event: MouseEvent) => void;
    ref?: any;
    [key: string]: any;
  }

  export default class ForceGraph3D extends Component<ForceGraph3DProps> {
    controls(): any;
    postProcessingComposer(): any;
  }
}
