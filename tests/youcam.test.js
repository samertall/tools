import test from 'node:test';import assert from 'node:assert/strict';
import {parseImage,normalizeSkinResult,ACTIONS} from '../lib/youcam.js';
test('selected actions use only SD category names',()=>{assert.ok(ACTIONS.includes('moisture'));assert.ok(!ACTIONS.some(x=>x.startsWith('hd_')))});
test('parseImage rejects oversized or spoofed media',()=>{assert.throws(()=>parseImage('data:image/jpeg;base64,dGVzdA=='));assert.throws(()=>parseImage('not an image'));});
test('normalizeSkinResult reads JSON output and score directions',()=>{const result=normalizeSkinResult({results:{output:[{type:'all',score:78},{type:'moisture',ui_score:62,raw_score:63.7},{type:'redness',ui_score:70,raw_score:71.9}]}});assert.equal(result.overall,78);assert.equal(result.concerns.moisture.raw_score,63.7);});
test('normalizeSkinResult refuses incomplete results',()=>{assert.equal(normalizeSkinResult({output:[]}),null)});
