import { useEffect, useRef, useState, useCallback } from 'react';
import { useHaxTrace } from '@/contexts/HaxTraceContext';
import { CanvasRenderer } from '@/lib/canvasRenderer';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Copy, Trash2, Move } from 'lucide-react';

export const HaxTraceCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number>();
  
  const {
    map,
    currentTool,
    setCurrentTool,
    selectedVertices,
    selectedSegments,
    hoveredVertex,
    setHoveredVertex,
    addVertex,
    selectVertex,
    selectSegment,
    selectAllVertices,
    clearSegmentSelection,
    clearVertexSelection,
    updateVertex,
    gridVisible,
    gridSize,
    zoom,
    setZoom,
    setMousePos,
    deleteVertex,
    duplicateVertex,
    duplicateSegment,
    duplicateSelectedVertices,
    duplicateSelectedSegments,
    deleteSelectedSegments,
    deleteSelectedVertices,
  } = useHaxTrace();

  const [isDraggingVertex, setIsDraggingVertex] = useState<number | null>(null);
  const [dragStartPositions, setDragStartPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<{ type: 'vertex' | 'segment'; index: number } | null>(null);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const renderer = new CanvasRenderer(canvasRef.current);
    rendererRef.current = renderer;

    if (map.bg.image) {
      renderer.loadBackgroundImage(map.bg.image.dataURL).then(() => {
        render();
      });
    }

    const handleResize = () => {
      renderer.updateCanvasSize();
      render();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (map.bg.image) {
      renderer.loadBackgroundImage(map.bg.image.dataURL).then(() => {
        render();
      });
    } else {
      renderer.clearBackgroundImage();
      render();
    }
  }, [map.bg.image?.dataURL]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.state.zoom = zoom;
    render();
  }, [zoom]);

  const render = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.clear(map.bg.color);
    
    if (map.bg.image) {
      renderer.drawBackgroundImage(map.bg.image);
    }
    
    if (gridVisible) {
      renderer.drawGrid(map.width, map.height, gridSize);
    }

    map.segments.forEach((segment, index) => {
      const isSelected = selectedSegments.includes(index);
      renderer.drawSegment(segment, map.vertexes, isSelected);
    });

    map.vertexes.forEach((vertex, index) => {
      const isSelected = selectedVertices.includes(index);
      const isHovered = hoveredVertex === index;
      renderer.drawVertex(vertex, isSelected, isHovered);
    });

    if (marqueeStart && marqueeCurrent && canvasRef.current) {
      const ctx = renderer['ctx'];
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 2;
      const width = marqueeCurrent.x - marqueeStart.x;
      const height = marqueeCurrent.y - marqueeStart.y;
      ctx.fillRect(marqueeStart.x, marqueeStart.y, width, height);
      ctx.strokeRect(marqueeStart.x, marqueeStart.y, width, height);
    }
  }, [map, selectedVertices, selectedSegments, hoveredVertex, gridVisible, gridSize, marqueeStart, marqueeCurrent]);

  useEffect(() => {
    render();
  }, [render]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (!renderer || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vertexIndex = renderer.getVertexAt(x, y, map.vertexes);
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    
    if (e.button === 2) {
      if (vertexIndex !== null) {
        setContextMenuTarget({ type: 'vertex', index: vertexIndex });
        if (selectedVertices.includes(vertexIndex) && selectedVertices.length > 1) {
          const world = renderer.screenToWorld(x, y);
          const positions = new Map<number, { x: number; y: number }>();
          selectedVertices.forEach(idx => {
            positions.set(idx, { x: map.vertexes[idx].x, y: map.vertexes[idx].y });
          });
          setDragStartPositions(positions);
          setDragOffset({ x: world.x, y: world.y });
          setIsDraggingVertex(vertexIndex);
        } else {
          setIsDraggingVertex(vertexIndex);
        }
        return;
      }
      
      const segmentIndex = renderer.getSegmentAt(x, y, map.segments, map.vertexes);
      if (segmentIndex !== null) {
        setContextMenuTarget({ type: 'segment', index: segmentIndex });
        return;
      }
      
      setContextMenuTarget(null);
      return;
    }

    if (e.button === 0) {
      if (vertexIndex !== null && isCtrlPressed) {
        selectVertex(vertexIndex, true);
        return;
      }

      const segmentIndex = renderer.getSegmentAt(x, y, map.segments, map.vertexes);
      if (segmentIndex !== null && isCtrlPressed) {
        selectSegment(segmentIndex, true);
        return;
      }

      if (currentTool === 'pan' && !isCtrlPressed) {
        renderer.startPan(x, y);
        return;
      }

      if (currentTool === 'vertex') {
        if (vertexIndex !== null) {
          const multiSelect = e.shiftKey || isCtrlPressed;
          selectVertex(vertexIndex, multiSelect);
          if (!multiSelect) {
            setIsDraggingVertex(vertexIndex);
          } else if (selectedVertices.includes(vertexIndex)) {
            const world = renderer.screenToWorld(x, y);
            const positions = new Map<number, { x: number; y: number }>();
            selectedVertices.forEach(idx => {
              positions.set(idx, { x: map.vertexes[idx].x, y: map.vertexes[idx].y });
            });
            setDragStartPositions(positions);
            setDragOffset({ x: world.x, y: world.y });
            setIsDraggingVertex(vertexIndex);
          }
          return;
        }
        
        if (!e.shiftKey && !isCtrlPressed) {
          const world = renderer.screenToWorld(x, y);
          addVertex(Math.round(world.x), Math.round(world.y));
          clearVertexSelection();
        } else {
          setMarqueeStart({ x, y });
          setMarqueeCurrent({ x, y });
        }
        return;
      }

      if (currentTool === 'segment') {
        if (vertexIndex !== null) {
          selectVertex(vertexIndex);
          return;
        }

        if (segmentIndex !== null) {
          selectSegment(segmentIndex, e.shiftKey || isCtrlPressed);
        } else if (!e.shiftKey && !isCtrlPressed) {
          clearSegmentSelection();
        }
      }
    }
  }, [currentTool, map, selectedVertices, addVertex, selectVertex, selectSegment, clearSegmentSelection, clearVertexSelection]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (!renderer || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const world = renderer.screenToWorld(x, y);
    setMousePos({ x: Math.round(world.x), y: Math.round(world.y) });

    if (marqueeStart) {
      setMarqueeCurrent({ x, y });
      return;
    }

    if (isDraggingVertex !== null) {
      if (dragStartPositions.size > 0 && dragOffset) {
        const deltaX = world.x - dragOffset.x;
        const deltaY = world.y - dragOffset.y;
        
        dragStartPositions.forEach((startPos, idx) => {
          updateVertex(idx, Math.round(startPos.x + deltaX), Math.round(startPos.y + deltaY));
        });
      } else {
        updateVertex(isDraggingVertex, Math.round(world.x), Math.round(world.y));
      }
      render();
      return;
    }

    if (renderer.state.isPanning) {
      renderer.updatePan(x, y);
      render();
      return;
    }

    const vertexIndex = renderer.getVertexAt(x, y, map.vertexes);
    if (vertexIndex !== hoveredVertex) {
      setHoveredVertex(vertexIndex);
    }
  }, [isDraggingVertex, dragStartPositions, dragOffset, map, hoveredVertex, setHoveredVertex, updateVertex, render, marqueeStart, setMousePos]);

  const handleMouseUp = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (marqueeStart && marqueeCurrent) {
      const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
      const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);
      
      const worldMin = renderer.screenToWorld(minX, minY);
      const worldMax = renderer.screenToWorld(maxX, maxY);
      
      const verticesInBox: number[] = [];
      map.vertexes.forEach((vertex, index) => {
        if (vertex.x >= worldMin.x && vertex.x <= worldMax.x &&
            vertex.y >= worldMin.y && vertex.y <= worldMax.y) {
          if (!selectedVertices.includes(index)) {
            verticesInBox.push(index);
          }
        }
      });
      
      if (verticesInBox.length > 0) {
        verticesInBox.forEach(index => selectVertex(index, true));
      }
      
      setMarqueeStart(null);
      setMarqueeCurrent(null);
      return;
    }

    setIsDraggingVertex(null);
    setDragStartPositions(new Map());
    setDragOffset(null);
    renderer.endPan();
  }, [marqueeStart, marqueeCurrent, map.vertexes, selectedVertices, selectVertex]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (e.deltaY < 0) {
      renderer.zoomIn();
    } else {
      renderer.zoomOut();
    }
    setZoom(renderer.state.zoom);
    render();
  }, [render, setZoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllVertices();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedVertices.length > 0) {
          duplicateSelectedVertices();
        } else if (selectedSegments.length > 0) {
          duplicateSelectedSegments();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedVertices.length > 0) {
          deleteSelectedVertices();
        } else if (selectedSegments.length > 0) {
          deleteSelectedSegments();
        }
      } else if (e.key === 'v' || e.key === 'V' || e.key === '2') {
        e.preventDefault();
        setCurrentTool('vertex');
      } else if (e.key === 's' || e.key === 'S' || e.key === '3') {
        e.preventDefault();
        setCurrentTool('segment');
      } else if (e.key === 'p' || e.key === 'P' || e.key === '1') {
        e.preventDefault();
        setCurrentTool('pan');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAllVertices, selectedVertices, selectedSegments, duplicateSelectedVertices, duplicateSelectedSegments, deleteSelectedVertices, deleteSelectedSegments, setCurrentTool]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <canvas
          ref={canvasRef}
          data-testid="canvas-haxtrace"
          className="w-full h-full cursor-crosshair"
          style={{ cursor: currentTool === 'pan' ? 'grab' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
        />
      </ContextMenuTrigger>
      <ContextMenuContent data-testid="context-menu-canvas">
        {contextMenuTarget?.type === 'vertex' && (
          <>
            <ContextMenuItem
              data-testid="context-menu-duplicate-vertex"
              onClick={() => {
                duplicateVertex(contextMenuTarget.index);
                setContextMenuTarget(null);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Vertex
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              data-testid="context-menu-delete-vertex"
              onClick={() => {
                deleteVertex(contextMenuTarget.index);
                setContextMenuTarget(null);
              }}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Vertex
            </ContextMenuItem>
          </>
        )}
        {contextMenuTarget?.type === 'segment' && (
          <>
            <ContextMenuItem
              data-testid="context-menu-duplicate-segment"
              onClick={() => {
                duplicateSegment(contextMenuTarget.index);
                setContextMenuTarget(null);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Segment
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              data-testid="context-menu-delete-segment"
              onClick={() => {
                if (!selectedSegments.includes(contextMenuTarget.index)) {
                  selectSegment(contextMenuTarget.index);
                }
                deleteSelectedSegments();
                setContextMenuTarget(null);
              }}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Segment
            </ContextMenuItem>
          </>
        )}
        {!contextMenuTarget && (
          <ContextMenuItem disabled>No selection</ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
