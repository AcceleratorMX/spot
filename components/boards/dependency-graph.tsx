"use client";

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Connection,
  type NodeProps,
  type Edge,
  type Node,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Priority } from "@prisma/client";
import { cn } from "@/lib/utils";
import dagre from 'dagre';
import { addTaskDependency, updateTaskPosition } from "@/app/actions/tasks";
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

// --- Types ---
type NodeData = {
  title: string;
  priority: Priority;
  columnTitle: string;
  onClick: () => void;
};

type Task = {
  id: string;
  title: string;
  priority: Priority;
  graphX: number | null;
  graphY: number | null;
  dependencies: { precedingTaskId: string }[];
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

type Board = {
  id: string;
  columns: Column[];
};

type DependencyGraphProps = {
  board: Board;
  onTaskClick: (taskId: string) => void;
};

// --- Layouting Logic ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node<NodeData>[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// --- Custom Task Node component ---
const TaskNode = ({ data }: NodeProps<Node<NodeData>>) => {
  const t = useTranslations("boards");
  const priority = data.priority;
  
  const priorityColors = {
    [Priority.LOW]: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    [Priority.MEDIUM]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    [Priority.HIGH]: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    [Priority.URGENT]: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <Card 
      className="min-w-[180px] shadow-md border-2 hover:border-primary transition-all bg-background cursor-pointer group"
      onClick={() => data.onClick && data.onClick()}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-primary border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity" 
      />
      <CardHeader className="p-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Badge className={cn("text-[9px] font-bold uppercase h-4 px-1", priorityColors[priority])} variant="outline">
              {t(priority.toLowerCase())}
            </Badge>
            <div className="text-[9px] text-muted-foreground font-medium truncate max-w-[80px]">
              {data.columnTitle as string}
            </div>
          </div>
          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
            {data.title as string}
          </CardTitle>
        </div>
      </CardHeader>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-primary border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity" 
      />
    </Card>
  );
};

const nodeTypes = {
  task: TaskNode,
};

function DependencyGraphContent({ board, onTaskClick }: DependencyGraphProps) {
  const { theme } = useTheme();
  const t = useTranslations("boards");
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isInitialLayoutDone, setIsInitialLayoutDone] = React.useState(false);

  // Function to apply layout
  const applyLayout = useCallback(async (forceDagre = false) => {
    const allTasksWithColumn = board.columns.flatMap((col) => 
      col.tasks.map(t => ({ ...t, columnTitle: col.title }))
    );

    const nodesWithSavedPositions: Node<NodeData>[] = [];
    const nodesToLayout: Node<NodeData>[] = [];

    allTasksWithColumn.forEach((task) => {
      const node: Node<NodeData> = {
        id: task.id,
        type: 'task',
        data: { 
          title: task.title, 
          priority: task.priority,
          columnTitle: task.columnTitle,
          onClick: () => onTaskClick(task.id)
        },
        position: { x: task.graphX ?? 0, y: task.graphY ?? 0 },
      };

      if (!forceDagre && task.graphX !== null && task.graphY !== null) {
        nodesWithSavedPositions.push(node);
      } else {
        nodesToLayout.push(node);
      }
    });

    const currentEdges: Edge[] = allTasksWithColumn.flatMap((task) => 
      (task.dependencies || []).map((dep) => ({
        id: `e-${dep.precedingTaskId}-${task.id}`,
        source: dep.precedingTaskId,
        target: task.id,
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      }))
    );

    if (nodesToLayout.length > 0 || forceDagre) {
      // Use dagre
      const allNodes = [...nodesWithSavedPositions, ...nodesToLayout];
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, currentEdges);
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Persist positions if it was a forced layout
      if (forceDagre) {
        layoutedNodes.forEach(node => {
          updateTaskPosition(node.id, board.id, node.position.x, node.position.y);
        });
      }

      // Small delay to let React Flow update before fitting view
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
    } else {
      setNodes(nodesWithSavedPositions);
      setEdges(currentEdges);
      // Fit view even for saved positions if it's the first render
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
    }
  }, [board, onTaskClick, setNodes, setEdges, fitView]);

  // Initial layout only once per mount
  useEffect(() => {
    if (!isInitialLayoutDone && board.columns.length > 0) {
      applyLayout();
      setIsInitialLayoutDone(true);
    }
  }, [board.id, isInitialLayoutDone, applyLayout]);

  // Handle data updates without breaking positions
  useEffect(() => {
    if (!isInitialLayoutDone) return;

    const allTasks = board.columns.flatMap(c => c.tasks);
    
    // Update edges if dependencies changed
    const newEdges: Edge[] = allTasks.flatMap((task) => 
      (task.dependencies || []).map((dep) => ({
        id: `e-${dep.precedingTaskId}-${task.id}`,
        source: dep.precedingTaskId,
        target: task.id,
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      }))
    );
    setEdges(newEdges);

    // Update node data (like titles/priority) but keep positions
    setNodes((nds) => nds.map(node => {
      const task = allTasks.find(t => t.id === node.id);
      if (!task) return node;
      return {
        ...node,
        data: {
          ...node.data,
          title: task.title,
          priority: task.priority,
        }
      };
    }));
  }, [board, isInitialLayoutDone, setNodes, setEdges]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const res = await addTaskDependency(board.id, params.target, params.source);
      if (res.error) {
        console.error(res.error);
      }
    },
    [board.id]
  );

  const onNodeDragStop = useCallback(
    async (_: any, node: Node) => {
      await updateTaskPosition(node.id, board.id, node.position.x, node.position.y);
    },
    [board.id]
  );

  return (
    <div className="w-full h-full bg-muted/5 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        colorMode={theme === 'dark' ? 'dark' : 'light'}
      >
        <Background gap={20} size={1} />
        <Controls />
        <Panel position="top-left" className="bg-background/80 backdrop-blur-sm p-3 rounded-lg border shadow-sm max-w-[250px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase text-primary">{t("interactiveGraph")}</h3>
            <button 
              onClick={() => applyLayout(true)}
              className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
              title={t("autoArrange")}
            >
              {t("magicLayout")}
            </button>
          </div>
          <ul className="text-[10px] space-y-1 text-muted-foreground">
            <li>• {t("dragInstructions")}</li>
            <li>• {t("connectInstructions")}</li>
            <li>• {t("clickInstructions")}</li>
          </ul>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function DependencyGraph(props: DependencyGraphProps) {
  return (
    <ReactFlowProvider>
      <DependencyGraphContent {...props} />
    </ReactFlowProvider>
  );
}
