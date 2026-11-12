import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readForegroundPosition } from '../src/guidance/foregroundPosition.ts';
const sample = {latitude:53.4,longitude:6.07,accuracy:12,timestamp:1000};
test('denied permission never starts a location subscription', async () => {
 let watched = false;
 await assert.rejects(readForegroundPosition({permission:async()=>false,watch:async()=>{watched=true;}},new AbortController().signal),/denied/);
 assert.equal(watched,false);
});
test('one position ends a subscription even if callback precedes native handle', async () => {
 let removed = 0;
 const result = await readForegroundPosition({permission:async()=>true,watch:async receive=>{receive(sample);return {remove:()=>removed++};}},new AbortController().signal);
 await Promise.resolve();
 assert.deepEqual(result,sample);assert.equal(removed,1);
});
test('aborting during permission does not begin location tracking later', async () => {
 let permit; let watched=false;const abort=new AbortController();
 const pending=readForegroundPosition({permission:()=>new Promise(r=>permit=r),watch:async()=>{watched=true;}},abort.signal);
 abort.abort();permit(true);
 await assert.rejects(pending,/cancelled/);assert.equal(watched,false);
});
test('timeout removes the late native subscription', async () => {
 let start;let removed=0;
 const pending=readForegroundPosition({permission:async()=>true,watch:()=>new Promise(r=>start=r)},new AbortController().signal,5);
 await assert.rejects(pending,/timeout/);
 start({remove:()=>removed++});await Promise.resolve();await Promise.resolve();assert.equal(removed,1);
});
test('invalid coordinates fail without becoming a destination', async () => {
 await assert.rejects(readForegroundPosition({permission:async()=>true,watch:async receive=>{receive({...sample,latitude:NaN});return {remove(){}};}},new AbortController().signal),/unavailable/);
});
test('leaving the foreground removes an established subscription', async () => {
 let removed=0; let started; const ready=new Promise(r=>started=r);const abort=new AbortController();
 const pending=readForegroundPosition({permission:async()=>true,watch:async()=>{started();return {remove:()=>removed++};}},abort.signal);
 await ready; await Promise.resolve(); abort.abort();
 await assert.rejects(pending,/cancelled/);assert.equal(removed,1);
});
test('a native permission failure returns a recoverable unavailable state', async () => {
 await assert.rejects(readForegroundPosition({permission:async()=>{throw Error('native failure');},watch:async()=>{throw Error('must not start');}},new AbortController().signal),/unavailable/);
});
