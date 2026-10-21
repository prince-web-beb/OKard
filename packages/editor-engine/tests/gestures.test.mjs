import test from 'node:test';
import assert from 'node:assert/strict';
import {
  screenToMillimetres, movedLayerPosition, clampZoom,
  nextPinchTransform, snapMillimetres,
} from '../dist/index.js';

test('correct conversion at 360 CSS px artboard', () => {
  const p = screenToMillimetres(
    {clientX:190,clientY:140},
    {left:10,top:26,width:360,height:228},
    {widthMm:85.6,heightMm:53.98});
  assert.ok(p);
  assert.ok(Math.abs(p.xMm - 42.8) < 0.01);
  assert.ok(Math.abs(p.yMm - 26.99) < 0.01);
});
test('move snaps to a 0.25 mm grid while clamping inside the card', () => {
  const p = movedLayerPosition(
    {xMm:10,yMm:11,widthMm:30,heightMm:15},
    {xMm:15,yMm:15}, {xMm:19.67,yMm:18.1},
    {widthMm:85.6,heightMm:53.98});
  assert.equal(p.xMm,14.75);
  assert.equal(p.yMm,14);
  const edge = movedLayerPosition(
    {xMm:70,yMm:40,widthMm:30,heightMm:30},
    {xMm:5,yMm:5},{xMm:1000,yMm:1000},
    {widthMm:85.6,heightMm:53.98});
  assert.ok(Math.abs(edge.xMm-55.6) < 1e-9);
  assert.ok(Math.abs(edge.yMm-23.98) < 1e-9);
});
test('two-pointer zoom and pan are bounded', () => {
  const transformed = nextPinchTransform(
    {zoom:1,panX:0,panY:0},100,{clientX:100,clientY:100},
    {clientX:100,clientY:100},{clientX:300,clientY:100});
  assert.equal(transformed.zoom,2);
  assert.equal(transformed.panX,100);
  assert.equal(transformed.panY,0);
  assert.equal(clampZoom(1000),3);
});
test('zero/invalid artboard geometry and snap settings are rejected', () => {
  assert.equal(screenToMillimetres(
    {clientX:1,clientY:2}, {left:0,top:0,width:0,height:300},
    {widthMm:85.6,heightMm:53.98}),null);
  assert.throws(() => snapMillimetres(NaN));
});
