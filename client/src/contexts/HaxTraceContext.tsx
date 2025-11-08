import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { HaxMap, Vertex, Segment, BackgroundImage } from '@shared/schema';
import { chordLength, radiusToAngle, sagittaToAngle } from '@/lib/circularArc';

export type Tool = 'vertex' | 'segment' | 'pan';

interface HaxTraceContextType {
  map: HaxMap;
  setMap: (map: HaxMap) => void;
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  selectedVertices: number[];
  selectedSegments: number[];
  hoveredVertex: number | null;
  setHoveredVertex: (index: number | null) => void;
  segmentColor: string;
  setSegmentColor: (color: string) => void;
  curveType: 'angle' | 'radius' | 'sagitta';
  setCurveType: (type: 'angle' | 'radius' | 'sagitta') => void;
  curveValue: number;
  setCurveValue: (value: number) => void;
  gridVisible: boolean;
  toggleGrid: () => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  mousePos: { x: number; y: number };
  setMousePos: (pos: { x: number; y: number }) => void;
  addVertex: (x: number, y: number) => void;
  addSegment: (v0: number, v1: number, color?: string) => void;
  selectVertex: (index: number, multiSelect?: boolean) => void;
  clearVertexSelection: () => void;
  selectSegment: (index: number, multiSelect?: boolean) => void;
  clearSegmentSelection: () => void;
  updateVertex: (index: number, x: number, y: number) => void;
  updateSegmentCurve: (index: number, type: 'angle' | 'radius' | 'sagitta', value: number) => void;
  deleteSelectedSegments: () => void;
  deleteSelectedVertices: () => void;
  deleteVertex: (index: number) => void;
  duplicateVertex: (index: number) => void;
  duplicateSegment: (index: number) => void;
  setBackgroundImage: (dataURL: string) => void;
  updateBackgroundImage: (bgImage: BackgroundImage) => void;
  removeBackgroundImage: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  importMap: (mapData: HaxMap) => void;
  exportMap: () => HaxMap;
}

const HaxTraceContext = createContext<HaxTraceContextType | undefined>(undefined);

export const useHaxTrace = () => {
  const context = useContext(HaxTraceContext);
  if (!context) {
    throw new Error('useHaxTrace must be used within HaxTraceProvider');
  }
  return context;
};

interface HaxTraceProviderProps {
  children: ReactNode;
}

const defaultMap: HaxMap = {
  id: '1',
  name: 'HaxTrace',
  width: 400,
  height: 200,
  bg: { color: '000000ff' },
  vertexes: [
  ],
  segments: [
  ],
  discs: [],
  goals: [],
  planes: [],
  joints: [],
  traits: {},
  canBeStored: true,
};

export const HaxTraceProvider = ({ children }: HaxTraceProviderProps) => {
  const [map, setMapInternal] = useState<HaxMap>(() => {
    const saved = localStorage.getItem('haxtraceMap');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved map:', e);
        return defaultMap;
      }
    }
    return defaultMap;
  });
  const [currentTool, setCurrentTool] = useState<Tool>('vertex');
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [hoveredVertex, setHoveredVertex] = useState<number | null>(null);
  const [segmentColor, setSegmentColor] = useState<string>('ffffff');
  const [curveType, setCurveType] = useState<'angle' | 'radius' | 'sagitta'>('angle');
  const [curveValue, setCurveValue] = useState<number>(0);
  const [gridVisible, setGridVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('gridVisible');
    return saved ? JSON.parse(saved) : true;
  });
  const [gridSize, setGridSize] = useState<number>(() => {
    const saved = localStorage.getItem('gridSize');
    return saved ? Number(saved) : 50;
  });
  const [zoom, setZoomInternal] = useState<number>(1);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const initialHistory = (() => {
    const saved = localStorage.getItem('haxtraceMap');
    if (saved) {
      try {
        return [JSON.parse(saved)];
      } catch (e) {
        return [defaultMap];
      }
    }
    return [defaultMap];
  })();
  
  const [history, setHistory] = useState<HaxMap[]>(initialHistory);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveHistory = useCallback((newMap: HaxMap) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newMap]);
    setHistoryIndex(prev => prev + 1);
    setMapInternal(newMap);
    localStorage.setItem('haxtraceMap', JSON.stringify(newMap));
  }, [historyIndex]);

  const setMap = useCallback((newMap: HaxMap) => {
    saveHistory(newMap);
  }, [saveHistory]);

  const addVertex = useCallback((x: number, y: number) => {
    const newMap = {
      ...map,
      vertexes: [...map.vertexes, { x, y }],
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const addSegment = useCallback((v0: number, v1: number, color?: string) => {
    const segment: Segment = {
      v0,
      v1,
      ...(color && { color }),
      ...(curveValue !== 0 && {
        curveData: {
          type: curveType,
          value: curveValue,
        },
      }),
    };
    const newMap = {
      ...map,
      segments: [...map.segments, segment],
    };
    saveHistory(newMap);
    setSelectedVertices([]);
  }, [map, saveHistory, curveType, curveValue]);

  const selectVertex = useCallback((index: number, multiSelect: boolean = false) => {
    if (currentTool === 'segment') {
      setSelectedVertices(prev => {
        if (prev.includes(index)) return prev;
        const newSelection = [...prev, index];
        
        if (newSelection.length === 2) {
          addSegment(newSelection[0], newSelection[1], segmentColor);
          return [];
        }
        
        return newSelection;
      });
    } else if (currentTool === 'vertex') {
      if (multiSelect) {
        setSelectedVertices(prev => 
          prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
      } else {
        setSelectedVertices([index]);
      }
    }
  }, [currentTool, addSegment, segmentColor]);

  const clearVertexSelection = useCallback(() => {
    setSelectedVertices([]);
  }, []);

  const selectSegment = useCallback((index: number, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedSegments(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setSelectedSegments([index]);
    }
  }, []);

  const clearSegmentSelection = useCallback(() => {
    setSelectedSegments([]);
  }, []);

  const updateVertex = useCallback((index: number, x: number, y: number) => {
    const newVertexes = [...map.vertexes];
    newVertexes[index] = { x, y };
    const newMap = {
      ...map,
      vertexes: newVertexes,
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const updateSegmentCurve = useCallback((index: number, type: 'angle' | 'radius' | 'sagitta', value: number) => {
    const newSegments = [...map.segments];
    newSegments[index] = {
      ...newSegments[index],
      curveData: { type, value },
    };
    const newMap = {
      ...map,
      segments: newSegments,
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const deleteSelectedSegments = useCallback(() => {
    if (selectedSegments.length === 0) return;
    
    const newSegments = map.segments.filter((_, index) => !selectedSegments.includes(index));
    const newMap = {
      ...map,
      segments: newSegments,
    };
    saveHistory(newMap);
    setSelectedSegments([]);
  }, [map, selectedSegments, saveHistory]);

  const deleteVertex = useCallback((index: number) => {
    const newVertexes = map.vertexes.filter((_, i) => i !== index);
    const newSegments = map.segments
      .filter(s => s.v0 !== index && s.v1 !== index)
      .map(s => ({
        ...s,
        v0: s.v0 > index ? s.v0 - 1 : s.v0,
        v1: s.v1 > index ? s.v1 - 1 : s.v1,
      }));
    const newMap = {
      ...map,
      vertexes: newVertexes,
      segments: newSegments,
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const deleteSelectedVertices = useCallback(() => {
    if (selectedVertices.length === 0) return;
    
    const sortedIndices = [...selectedVertices].sort((a, b) => b - a);
    let newVertexes = [...map.vertexes];
    let newSegments = [...map.segments];
    
    sortedIndices.forEach(index => {
      newVertexes = newVertexes.filter((_, i) => i !== index);
      newSegments = newSegments
        .filter(s => s.v0 !== index && s.v1 !== index)
        .map(s => ({
          ...s,
          v0: s.v0 > index ? s.v0 - 1 : s.v0,
          v1: s.v1 > index ? s.v1 - 1 : s.v1,
        }));
    });
    
    const newMap = {
      ...map,
      vertexes: newVertexes,
      segments: newSegments,
    };
    saveHistory(newMap);
    setSelectedVertices([]);
  }, [map, selectedVertices, saveHistory]);

  const duplicateVertex = useCallback((index: number) => {
    const vertex = map.vertexes[index];
    if (!vertex) return;
    const newVertex = { x: vertex.x + 20, y: vertex.y + 20 };
    const newMap = {
      ...map,
      vertexes: [...map.vertexes, newVertex],
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const duplicateSegment = useCallback((index: number) => {
    const segment = map.segments[index];
    if (!segment) return;
    const newMap = {
      ...map,
      segments: [...map.segments, { ...segment }],
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const setBackgroundImage = useCallback((dataURL: string) => {
    const newMap = {
      ...map,
      bg: {
        ...map.bg,
        image: {
          dataURL,
          opacity: 0.5,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fitMode: 'center' as const,
          locked: false,
        },
      },
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const updateBackgroundImage = useCallback((bgImage: BackgroundImage) => {
    const newMap = {
      ...map,
      bg: {
        ...map.bg,
        image: bgImage,
      },
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const removeBackgroundImage = useCallback(() => {
    const newMap = {
      ...map,
      bg: {
        color: map.bg.color,
      },
    };
    saveHistory(newMap);
  }, [map, saveHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newMap = history[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      setMapInternal(newMap);
      localStorage.setItem('haxtraceMap', JSON.stringify(newMap));
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newMap = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      setMapInternal(newMap);
      localStorage.setItem('haxtraceMap', JSON.stringify(newMap));
    }
  }, [historyIndex, history]);

  const importMap = useCallback((mapData: HaxMap) => {
    const normalizedBgColor = mapData.bg?.color 
      ? (mapData.bg.color.startsWith('#') ? mapData.bg.color : `#${mapData.bg.color}`)
      : '#0f0f0fff';
    
    const importedMap = {
      ...mapData,
      bg: {
        ...mapData.bg,
        color: normalizedBgColor,
      },
      vertexes: mapData.vertexes.map(v => ({ ...v })),
      segments: mapData.segments.map(s => {
        if (s.curve !== undefined && s.curve !== 0 && !s.curveData) {
          const { curve, ...rest } = s;
          return {
            ...rest,
            curveData: {
              type: 'angle' as const,
              value: curve,
            },
          };
        }
        return { ...s };
      }),
    };
    setHistory([importedMap]);
    setHistoryIndex(0);
    setMapInternal(importedMap);
    localStorage.setItem('haxtraceMap', JSON.stringify(importedMap));
    setSelectedVertices([]);
    setSelectedSegments([]);
  }, []);

  const exportMap = useCallback(() => {
    const bgColor = map.bg.color.startsWith('#') ? map.bg.color.slice(1) : map.bg.color;
    
    return {
      ...map,
      name: 'HaxTrace',
      bg: {
        ...map.bg,
        color: bgColor,
      },
      segments: map.segments.map(s => {
        let curveValue = s.curve;
        
        if (s.curveData && s.curveData.value !== 0) {
          const v0 = map.vertexes[s.v0];
          const v1 = map.vertexes[s.v1];
          
          if (v0 && v1) {
            const chord = chordLength(v0, v1);
            let angleInDegrees = 0;
            
            switch (s.curveData.type) {
              case 'angle':
                angleInDegrees = s.curveData.value;
                break;
              case 'radius':
                angleInDegrees = radiusToAngle(s.curveData.value, chord);
                break;
              case 'sagitta':
                angleInDegrees = sagittaToAngle(s.curveData.value, chord);
                break;
            }
            
            curveValue = angleInDegrees;
          }
        }
        
        const clampedValue = curveValue ? Math.max(-340, Math.min(340, curveValue)) : curveValue;
        
        const exportSegment: any = {
          v0: s.v0,
          v1: s.v1,
        };
        
        if (clampedValue) {
          exportSegment.curve = clampedValue;
        }
        
        if (s.color) {
          exportSegment.color = s.color;
        }
        
        return exportSegment;
      }),
      discs: map.discs || [],
      goals: map.goals || [],
      planes: map.planes || [],
      joints: map.joints || [],
      traits: map.traits || {},
      canBeStored: map.canBeStored ?? true,
    };
  }, [map]);

  const toggleGrid = useCallback(() => {
    setGridVisible(prev => {
      const newValue = !prev;
      localStorage.setItem('gridVisible', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const handleSetGridSize = useCallback((size: number) => {
    setGridSize(size);
    localStorage.setItem('gridSize', String(size));
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setZoomInternal(Math.max(0.1, Math.min(5, newZoom)));
  }, []);

  const value: HaxTraceContextType = {
    map,
    setMap,
    currentTool,
    setCurrentTool,
    selectedVertices,
    selectedSegments,
    hoveredVertex,
    setHoveredVertex,
    segmentColor,
    setSegmentColor,
    curveType,
    setCurveType,
    curveValue,
    setCurveValue,
    gridVisible,
    toggleGrid,
    gridSize,
    setGridSize: handleSetGridSize,
    zoom,
    setZoom,
    mousePos,
    setMousePos,
    addVertex,
    addSegment,
    selectVertex,
    clearVertexSelection,
    selectSegment,
    clearSegmentSelection,
    updateVertex,
    updateSegmentCurve,
    deleteSelectedSegments,
    deleteSelectedVertices,
    deleteVertex,
    duplicateVertex,
    duplicateSegment,
    setBackgroundImage,
    updateBackgroundImage,
    removeBackgroundImage,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    importMap,
    exportMap,
  };

  return (
    <HaxTraceContext.Provider value={value}>
      {children}
    </HaxTraceContext.Provider>
  );
};
