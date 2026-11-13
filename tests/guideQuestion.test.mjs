import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localMuseumAnswer, museumQuestionContext, museumQuestions, parseGuideAnswer, requestGuideAnswer, guideAnswerUrl } from '../src/guidance/guideQuestion.ts';
import { fixtureGuideAnswer, GUIDE_QUESTIONS } from '../services/generator/guideAnswer.mjs';
import { GUIDE_PACK } from '../services/generator/guideEvidence.mjs';
import { chapterIds } from '../src/guidance/adaptiveGuide.ts';
import { moddergatJourney } from '../src/product/moddergatJourney.ts';
const request={...museumQuestionContext,question:museumQuestions[0],requestId:'client_test'};
const valid=fixtureGuideAnswer(request);
test('bundled iPhone explanations exactly match reviewed server fixture and reject another chapter',()=>{
 for (const question of [...museumQuestions,'Wat aten vissersgezinnen?']) {
   const input={...request,question};assert.deepEqual(localMuseumAnswer(input),JSON.parse(JSON.stringify(fixtureGuideAnswer(input))));
 }
 assert.equal(localMuseumAnswer({...request,chapterId:'other'}),undefined);
});
test('client and server bind to actual museum identity and reviewed pack',()=>{
 assert.equal(museumQuestionContext.chapterId,chapterIds(moddergatJourney)[0]);assert.equal(GUIDE_PACK.chapterId,museumQuestionContext.chapterId);
 assert.equal(GUIDE_PACK.version,museumQuestionContext.packVersion);assert.deepEqual(museumQuestions,GUIDE_QUESTIONS.map(q=>q.question));
 assert.ok(parseGuideAnswer(valid,request));assert.ok(parseGuideAnswer(fixtureGuideAnswer({...request,question:'Wat aten vissersgezinnen?'}),request));
});
test('client rejects stale, oversized, ungrounded-source and wrong-mode output',()=>{
 for(const patch of [{requestId:'late'},{chapterId:'wrong'},{packVersion:'old'},{mode:'model'}, {segments:[{...valid.segments[0],text:'x'.repeat(601)}]}, {sources:[{...valid.sources[0],url:'https://untrusted.example'}]}, {segments:[{...valid.segments[0],sourceId:'fake'}]}, {status:'insufficient-evidence'}])
  assert.equal(parseGuideAnswer({...valid,...patch},request),undefined);
});
test('service URL preserves host without accidentally posting to draft endpoint',()=>{
 assert.equal(guideAnswerUrl('http://127.0.0.1:8787/v1/experience-drafts'),'http://127.0.0.1:8787/v1/guide-answer');
 for(const base of [undefined,'broken','file:///tmp/a','https://user:secret@example.com','https://example.com/other'])assert.equal(guideAnswerUrl(base),undefined);
});
test('request sends only bounded envelope with native identification',async()=>{
 const answer=await requestGuideAnswer({base:'http://localhost:8787',native:true,request:{...request,profile:{private:'never send'},latitude:53},signal:new AbortController().signal,
  fetcher:async(url,options)=>{assert.equal(options.headers['X-Momentum-Client'],'native');assert.deepEqual(JSON.parse(options.body),request);return new Response(JSON.stringify(valid));}});
 assert.equal(answer.status,'answered');
});
test('cancellation and timeout abort transport',async()=>{
 const hanging=async(url,options)=>new Promise((resolve,reject)=>{const abort=()=>reject(new Error('aborted'));if(options.signal.aborted)abort();else options.signal.addEventListener('abort',abort,{once:true});});
 const controller=new AbortController();
 const pending=requestGuideAnswer({base:'http://localhost',native:false,request,signal:controller.signal,fetcher:hanging});controller.abort();await assert.rejects(pending,/aborted/);
 await assert.rejects(requestGuideAnswer({base:'http://localhost',native:false,request,signal:new AbortController().signal,fetcher:hanging,timeoutMs:5}),/aborted/);
});
test('unavailable and invalid responses fail closed',async()=>{
 for(const response of [new Response('{}'),new Response('oops'),new Response('',{status:503}),new Response('x'.repeat(12001))])
  await assert.rejects(requestGuideAnswer({base:'http://localhost',native:false,request,signal:new AbortController().signal,fetcher:async()=>response}));
});
test('late response after cancellation is discarded even if transport ignores abort',async()=>{
 const controller=new AbortController();let respond;
 const pending=requestGuideAnswer({base:'http://localhost',native:false,request,signal:controller.signal,
 fetcher:()=>new Promise(resolve=>{respond=resolve;})});
 controller.abort();respond(new Response(JSON.stringify(valid)));await assert.rejects(pending,/unavailable/);
});
