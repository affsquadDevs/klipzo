/**
 * Konva canvas: renders the adjusted base image + overlays, handles selection/
 * transform, crop UI, and freehand drawing. The WebGL AdjustmentRenderer output is
 * used as the base image source and re-read on every adjustment change.
 */
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KImage, Rect, Ellipse, Text, Line, Arrow, Transformer, Group } from "react-konva";
import type Konva from "konva";
import { useEditor } from "./store";
import { AdjustmentRenderer, isWebGLAvailable } from "./gl/AdjustmentRenderer";
import type { CropRect } from "./geometry";
import { overlayId, type DrawOverlay, type Overlay } from "./types";

export interface PhotoCanvasHandle {
  /** Full-resolution composite (base + overlays), no selection handles. */
  getExportCanvas: () => HTMLCanvasElement | null;
}

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  cropRect: CropRect | null;
  onCropRectChange: (r: CropRect) => void;
  drawStyle: { stroke: string; strokeWidth: number };
}

export const PhotoCanvas = forwardRef<PhotoCanvasHandle, Props>(function PhotoCanvas(
  { stageRef, cropRect, onCropRectChange, drawStyle },
  ref,
) {
  const present = useEditor((s) => s.present);
  const activeTool = useEditor((s) => s.activeTool);
  const selectedId = useEditor((s) => s.selectedId);
  const select = useEditor((s) => s.select);
  const updateOverlay = useEditor((s) => s.updateOverlay);
  const addOverlay = useEditor((s) => s.addOverlay);

  const containerRef = useRef<HTMLDivElement>(null);
  const baseLayerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const cropRef = useRef<Konva.Rect>(null);
  const cropTrRef = useRef<Konva.Transformer>(null);

  const rendererRef = useRef<AdjustmentRenderer | null>(null);
  const [glOk] = useState(() => isWebGLAvailable());
  const [rendererReady, setRendererReady] = useState(false);
  const [box, setBox] = useState({ w: 800, h: 600 });

  const source = present?.source ?? null;
  const sourceW = present?.width ?? 1;
  const sourceH = present?.height ?? 1;

  // Fit-to-container scale (no upscaling past the natural size).
  const scale = useMemo(() => {
    const pad = 32;
    const availW = Math.max(64, box.w - pad);
    const availH = Math.max(64, box.h - pad);
    return Math.min(availW / sourceW, availH / sourceH, 1);
  }, [box, sourceW, sourceH]);

  const stageW = Math.round(sourceW * scale);
  const stageH = Math.round(sourceH * scale);

  // Measure the container.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Create/dispose the WebGL renderer. Setting readiness re-renders so the base
  // image node swaps from the raw source to the adjusted GL canvas.
  useEffect(() => {
    if (!glOk) return;
    try {
      rendererRef.current = new AdjustmentRenderer();
      setRendererReady(true);
    } catch {
      rendererRef.current = null;
      setRendererReady(false);
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setRendererReady(false);
    };
  }, [glOk]);

  // Upload source into the renderer whenever it changes.
  useEffect(() => {
    if (!source || !rendererRef.current) return;
    rendererRef.current.setSource(source, sourceW, sourceH);
    rendererRef.current.render(present!.adjustments);
    // Draw synchronously: the renderer already blitted to a stable 2D canvas, and a
    // sync draw avoids depending on rAF timing for immediate visual feedback.
    baseLayerRef.current?.draw();
  }, [source, sourceW, sourceH]);

  // Re-render adjustments live.
  useEffect(() => {
    if (!source) return;
    if (rendererRef.current) {
      rendererRef.current.render(present!.adjustments);
    }
    baseLayerRef.current?.draw();
  }, [present?.adjustments, source]);

  // The image element the base node draws: adjusted GL canvas, or raw source fallback.
  const baseImage =
    rendererReady && rendererRef.current ? rendererRef.current.canvas : source ?? undefined;

  // Attach transformer to the selected overlay.
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId || activeTool === "crop" || activeTool === "draw") {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne(`#${selectedId}`);
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, activeTool, present?.overlays, stageW, stageH]);

  // Attach crop transformer.
  useEffect(() => {
    const tr = cropTrRef.current;
    if (!tr) return;
    if (activeTool === "crop" && cropRef.current) {
      tr.nodes([cropRef.current]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [activeTool, cropRect, stageW, stageH]);

  // Freehand drawing.
  const drawing = useRef<DrawOverlay | null>(null);
  const [drawPreview, setDrawPreview] = useState<number[] | null>(null);

  function toSourcePoint(e: Konva.KonvaEventObject<PointerEvent>): { x: number; y: number } | null {
    const stage = e.target.getStage();
    const p = stage?.getPointerPosition();
    if (!p) return null;
    return { x: p.x / scale, y: p.y / scale };
  }

  useImperativeHandle(
    ref,
    () => ({
      getExportCanvas() {
        const stage = stageRef.current;
        if (!stage || !present) return null;
        // Detach selection handles so they don't appear in the export.
        trRef.current?.nodes([]);
        trRef.current?.getLayer()?.batchDraw();
        const pixelRatio = present.width / Math.max(1, stage.width());
        const canvas = stage.toCanvas({ pixelRatio });
        // Reattach transformer to the current selection.
        if (selectedId) {
          const node = stage.findOne(`#${selectedId}`);
          if (node) {
            trRef.current?.nodes([node]);
            trRef.current?.getLayer()?.batchDraw();
          }
        }
        return canvas as HTMLCanvasElement;
      },
    }),
    [present, selectedId, stageRef],
  );

  if (!present) return null;

  return (
    <div ref={containerRef} className="ed-canvas-host">
      <Stage
        ref={stageRef}
        width={stageW}
        height={stageH}
        onMouseDown={(e) => {
          if (activeTool === "draw") return;
          if (e.target === e.target.getStage()) select(null);
        }}
        onPointerDown={(e) => {
          if (activeTool !== "draw") return;
          const p = toSourcePoint(e);
          if (!p) return;
          drawing.current = {
            id: overlayId("draw"),
            type: "draw",
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 1,
            draggable: true,
            points: [p.x, p.y],
            stroke: drawStyle.stroke,
            strokeWidth: drawStyle.strokeWidth,
          };
          setDrawPreview([p.x, p.y]);
        }}
        onPointerMove={(e) => {
          if (activeTool !== "draw" || !drawing.current) return;
          const p = toSourcePoint(e);
          if (!p) return;
          drawing.current.points.push(p.x, p.y);
          setDrawPreview([...drawing.current.points]);
        }}
        onPointerUp={() => {
          if (activeTool !== "draw" || !drawing.current) return;
          if (drawing.current.points.length >= 4) addOverlay(drawing.current);
          drawing.current = null;
          setDrawPreview(null);
        }}
        style={{ background: "transparent", cursor: activeTool === "draw" ? "crosshair" : "default" }}
      >
        <Layer ref={baseLayerRef} listening={activeTool !== "draw"}>
          {baseImage && (
            <KImage image={baseImage} width={sourceW} height={sourceH} scaleX={scale} scaleY={scale} listening={false} />
          )}
        </Layer>

        <Layer>
          <Group scaleX={scale} scaleY={scale}>
            {present.overlays.map((ov) => (
              <OverlayNode
                key={ov.id}
                overlay={ov}
                selectable={activeTool !== "crop" && activeTool !== "draw"}
                onSelect={() => select(ov.id)}
                onChange={(patch, history) => updateOverlay(ov.id, patch, history)}
              />
            ))}
            {drawPreview && (
              <Line points={drawPreview} stroke={drawStyle.stroke} strokeWidth={drawStyle.strokeWidth} lineCap="round" lineJoin="round" tension={0.3} listening={false} />
            )}
          </Group>
          <Transformer ref={trRef} rotateEnabled ignoreStroke anchorSize={9} borderStroke="#4f7cff" anchorStroke="#4f7cff" anchorCornerRadius={2} />
        </Layer>

        {activeTool === "crop" && cropRect && (
          <Layer>
            <CropMask stageW={stageW} stageH={stageH} rect={cropRect} scale={scale} />
            <Rect
              ref={cropRef}
              x={cropRect.x * scale}
              y={cropRect.y * scale}
              width={cropRect.width * scale}
              height={cropRect.height * scale}
              stroke="#fff"
              strokeWidth={1.5}
              dash={[6, 4]}
              draggable
              onDragEnd={(e) => {
                onCropRectChange({
                  ...cropRect,
                  x: e.target.x() / scale,
                  y: e.target.y() / scale,
                });
              }}
              onTransformEnd={() => {
                const node = cropRef.current!;
                const sx = node.scaleX();
                const sy = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onCropRectChange({
                  x: node.x() / scale,
                  y: node.y() / scale,
                  width: Math.max(16, (node.width() * sx) / scale),
                  height: Math.max(16, (node.height() * sy) / scale),
                });
              }}
            />
            <Transformer ref={cropTrRef} rotateEnabled={false} anchorSize={10} borderStroke="#fff" anchorStroke="#fff" anchorFill="#4f7cff" />
          </Layer>
        )}
      </Stage>

      <style>{`
        .ed-canvas-host { flex: 1; min-width: 0; display: grid; place-items: center; overflow: hidden;
          background:
            repeating-conic-gradient(var(--color-surface-2) 0% 25%, transparent 0% 50%) 50% / 24px 24px; }
      `}</style>
    </div>
  );
});

function CropMask({ stageW, stageH, rect, scale }: { stageW: number; stageH: number; rect: CropRect; scale: number }) {
  const x = rect.x * scale;
  const y = rect.y * scale;
  const w = rect.width * scale;
  const h = rect.height * scale;
  const fill = "rgba(0,0,0,0.55)";
  return (
    <>
      <Rect x={0} y={0} width={stageW} height={y} fill={fill} listening={false} />
      <Rect x={0} y={y + h} width={stageW} height={stageH - (y + h)} fill={fill} listening={false} />
      <Rect x={0} y={y} width={x} height={h} fill={fill} listening={false} />
      <Rect x={x + w} y={y} width={stageW - (x + w)} height={h} fill={fill} listening={false} />
    </>
  );
}

interface OverlayNodeProps {
  overlay: Overlay;
  selectable: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Overlay>, history?: boolean) => void;
}

function OverlayNode({ overlay, selectable, onSelect, onChange }: OverlayNodeProps) {
  const common = {
    id: overlay.id,
    x: overlay.x,
    y: overlay.y,
    rotation: overlay.rotation,
    opacity: overlay.opacity,
    draggable: selectable && overlay.draggable,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
      onChange({ x: e.target.x(), y: e.target.y() }),
  };

  if (overlay.type === "text") {
    return (
      <Text
        {...common}
        text={overlay.text}
        fontFamily={overlay.fontFamily}
        fontSize={overlay.fontSize}
        fontStyle={overlay.fontStyle}
        fill={overlay.fill}
        align={overlay.align}
        stroke={overlay.strokeWidth > 0 ? overlay.stroke : undefined}
        strokeWidth={overlay.strokeWidth}
        width={overlay.width}
        shadowColor={overlay.shadow ? "rgba(0,0,0,0.6)" : undefined}
        shadowBlur={overlay.shadow ? overlay.fontSize * 0.15 : 0}
        shadowOffsetY={overlay.shadow ? overlay.fontSize * 0.06 : 0}
        onTransformEnd={(e) => {
          const node = e.target as Konva.Text;
          const sx = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            fontSize: Math.max(6, overlay.fontSize * sx),
            width: overlay.width ? overlay.width * sx : undefined,
          });
        }}
      />
    );
  }

  if (overlay.type === "rect") {
    return (
      <Rect
        {...common}
        width={overlay.width}
        height={overlay.height}
        fill={overlay.fill === "transparent" ? undefined : overlay.fill}
        stroke={overlay.stroke}
        strokeWidth={overlay.strokeWidth}
        cornerRadius={overlay.cornerRadius}
        onTransformEnd={(e) => scaleShape(e, overlay, onChange)}
      />
    );
  }

  if (overlay.type === "ellipse") {
    return (
      <Ellipse
        {...common}
        radiusX={overlay.width / 2}
        radiusY={overlay.height / 2}
        fill={overlay.fill === "transparent" ? undefined : overlay.fill}
        stroke={overlay.stroke}
        strokeWidth={overlay.strokeWidth}
        onTransformEnd={(e) => {
          const node = e.target as Konva.Ellipse;
          const sx = node.scaleX();
          const sy = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(8, overlay.width * sx),
            height: Math.max(8, overlay.height * sy),
          });
        }}
      />
    );
  }

  const lineOv = overlay as import("./types").LineOverlay | import("./types").DrawOverlay;
  const onLineTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    onChange({ x: node.x(), y: node.y(), rotation: node.rotation() });
  };

  if (lineOv.type === "arrow") {
    return (
      <Arrow
        {...common}
        points={lineOv.points}
        stroke={lineOv.stroke}
        fill={lineOv.stroke}
        strokeWidth={lineOv.strokeWidth}
        lineCap="round"
        lineJoin="round"
        pointerLength={lineOv.strokeWidth * 3}
        pointerWidth={lineOv.strokeWidth * 3}
        onTransformEnd={onLineTransform}
      />
    );
  }

  return (
    <Line
      {...common}
      points={lineOv.points}
      stroke={lineOv.stroke}
      strokeWidth={lineOv.strokeWidth}
      lineCap="round"
      lineJoin="round"
      tension={lineOv.type === "draw" ? 0.3 : 0}
      onTransformEnd={onLineTransform}
    />
  );
}

function scaleShape(
  e: Konva.KonvaEventObject<Event>,
  overlay: import("./types").ShapeOverlay,
  onChange: (patch: Partial<Overlay>, history?: boolean) => void,
) {
  const node = e.target as Konva.Rect;
  const sx = node.scaleX();
  const sy = node.scaleY();
  node.scaleX(1);
  node.scaleY(1);
  onChange({
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    width: Math.max(8, overlay.width * sx),
    height: Math.max(8, overlay.height * sy),
  });
}
