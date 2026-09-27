import assert from 'node:assert/strict';
import { validateGeminiGenerateContentRequest as validate } from '../server/geminiProxy.mjs';
const original=process.env.PLAQUE_LAYOUT_QA_PROFILE;
const request={model:'gemini-3.8-flash',contents:'Synthetic QA layout',config:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{svgContent:{type:'STRING'}},required:['svgContent']}}};
try {
 for(const [profile,level,tokens] of [['','LOW',8192],['LOW16','LOW',16384],['MEDIUM16','MEDIUM',16384],['HIGH32','HIGH',32768],['invalid','LOW',8192]]){
 process.env.PLAQUE_LAYOUT_QA_PROFILE=profile;const c=validate(request).request.config;
 assert.equal(c.maxOutputTokens,tokens);assert.equal(c.thinkingConfig.thinkingLevel,level);
 }
 for(const config of [{thinkingConfig:{thinkingLevel:'HIGH'}},{maxOutputTokens:32768},{PLAQUE_LAYOUT_QA_PROFILE:'HIGH32'}])assert.throws(()=>validate({...request,config:{...request.config,...config}}));
 console.log('Server-only QA profiles, unchanged default and caller override rejection passed');
}finally{if(original===undefined)delete process.env.PLAQUE_LAYOUT_QA_PROFILE;else process.env.PLAQUE_LAYOUT_QA_PROFILE=original;}
