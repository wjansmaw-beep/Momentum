import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createGeneratorServer } from '../server.mjs';
import { GUIDE_PACK } from '../guideEvidence.mjs';
const body = { contractVersion:'guide-answer-v1', experienceId:GUIDE_PACK.experienceId, chapterId:GUIDE_PACK.chapterId, packVersion:GUIDE_PACK.version, requestId:'test', question:'Hoe oud is het museumhuisje?' };
async function setup(t, env={}) {
  const {server}=createGeneratorServer({MOMENTUM_GENERATOR_PROVIDER:'fixture',...env},[]);
  server.listen(0,'127.0.0.1'); await once(server,'listening'); t.after(()=>server.close());
  return (payload=body,headers={'X-Momentum-Client':'native'})=>fetch(`http://127.0.0.1:${server.address().port}/v1/guide-answer`, {method:'POST',headers:{'content-type':'application/json',...headers},body: typeof payload==='string'?payload:JSON.stringify(payload)});
}
test('guide endpoint answers from canonical museum evidence and does not cache',async t=>{
  const post=await setup(t);const response=await post();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const answer=await response.json();assert.equal(answer.mode,'fixture');assert.equal(answer.segments[0].factId,'oldest-house');
  const unknown=await post({...body,question:'Wat aten vissersgezinnen?'});assert.equal((await unknown.json()).status,'insufficient-evidence');
});
test('guide endpoint shares admission rules and rejects client evidence/context changes',async t=>{
  const post=await setup(t); assert.equal((await post(body,{})).status,403);
  assert.equal((await post(body,{Origin:'https://untrusted.example','X-Momentum-Client':'native'})).status,403);
  for(const patch of [{chapterId:'other'},{packVersion:'old'},{profile:{}},{sources:[]}]) assert.equal((await post({...body,...patch})).status,400);
  assert.equal((await post('{')).status,400);assert.equal((await post('x'.repeat(17000))).status,413);
});
test('guide endpoint shares rate limit',async t=>{
 const post=await setup(t);for(let i=0;i<20;i++)assert.equal((await post()).status,200);assert.equal((await post()).status,429);
});
test('selected model is not silently replaced by fixture or called',async t=>{
 const post=await setup(t,{MOMENTUM_GENERATOR_PROVIDER:'openai',OPENAI_API_KEY:'test-not-a-real-key'});
 const response=await post();assert.equal(response.status,503);assert.equal((await response.json()).error,'guide_answer_not_supported');
});
