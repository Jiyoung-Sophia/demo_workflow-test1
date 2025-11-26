import React, { useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
  NodeMouseHandler
} from 'reactflow';
import CustomNode from './CustomNode';
import { NodeData } from '../../types';

// Define custom node types
const nodeTypes = {
  custom: CustomNode,
};

interface PipelineEditorProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: any; // Using any for simplicity with ReactFlow hooks types
  onEdgesChange: any;
  onNodeClick: (node: Node<NodeData>) => void;
  onConnect?: (connection: Connection) => void;
}

const PipelineEditor: React.FC<PipelineEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onConnect: onConnectProp
}) => {
  const onConnect = useCallback((params: Connection) => {
      // Wrapper if we wanted to add local logic, otherwise pass through
      if (onConnectProp) onConnectProp(params);
  }, [onConnectProp]);

  const handleNodeClick: NodeMouseHandler = useCallback((event, node) => {
    onNodeClick(node);
  }, [onNodeClick]);

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            type: 'smoothstep'
        }}
      >
        <Background color="#e2e8f0" gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap 
            nodeStrokeColor="#cbd5e1"
            nodeColor="#f1f5f9"
            maskColor="rgba(241, 245, 249, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};

export default PipelineEditor;
