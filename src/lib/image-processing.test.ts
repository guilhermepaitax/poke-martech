import { describe, expect, it } from "vitest";
import { computeCoverDraw } from "@/lib/image-processing";

const wide = { iw: 2000, ih: 1000 };
const tall = { iw: 1000, ih: 2000 };

describe("computeCoverDraw", () => {
  it("cobre a moldura 17:10 com uma imagem mais larga", () => {
    const draw = computeCoverDraw({ ...wide, x: 50, y: 50, scale: 100 });
    expect(draw).toMatchObject({ width: 1020, height: 600, scale: 1, dw: 1200, dh: 600 });
    expect(draw.dx).toBe(-90);
    expect(draw.dy).toBe(0);
  });

  it("desloca horizontalmente conforme a posição", () => {
    expect(computeCoverDraw({ ...wide, x: 0, y: 50, scale: 100 }).dx).toBeCloseTo(0);
    expect(computeCoverDraw({ ...wide, x: 100, y: 50, scale: 100 }).dx).toBe(-180);
  });

  it("desloca verticalmente uma imagem mais alta sem ampliar a origem", () => {
    const top = computeCoverDraw({ ...tall, x: 50, y: 0, scale: 100 });
    const center = computeCoverDraw({ ...tall, x: 50, y: 50, scale: 100 });
    const bottom = computeCoverDraw({ ...tall, x: 50, y: 100, scale: 100 });
    expect(center).toMatchObject({ width: 1000, height: 588, dw: 1000, dh: 2000, dx: 0 });
    expect(top.dy).toBeCloseTo(0);
    expect(center.dy).toBe(-706);
    expect(bottom.dy).toBe(-1412);
  });

  it("reduz a saída quando a escala ampliaria a origem", () => {
    const draw = computeCoverDraw({ ...wide, x: 50, y: 50, scale: 220 });
    expect(draw.width).toBeLessThan(1020);
    expect(draw.width / draw.height).toBeCloseTo(1.7, 2);
    expect((draw.dh * draw.scale) / wide.ih).toBeCloseTo(1, 2);
  });

  it("mantém a saída máxima quando a escala reduz a imagem", () => {
    const draw = computeCoverDraw({ ...wide, x: 50, y: 50, scale: 40 });
    expect(draw).toMatchObject({ width: 1020, height: 600, scale: 0.4, dw: 1200, dh: 600 });
  });

  it("não amplia imagens pequenas", () => {
    const draw = computeCoverDraw({ iw: 340, ih: 200, x: 50, y: 50, scale: 100 });
    expect(draw).toMatchObject({ width: 340, height: 200, dw: 340, dh: 200, dx: 0, dy: 0 });
  });
});
