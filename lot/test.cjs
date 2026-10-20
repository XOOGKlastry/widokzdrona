const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('./telemetry.js');
const srt='1\n00:00:00,000 --> 00:00:00,100\n[latitude: 49.1] [longitude: 20.1] [rel_alt: 40] [abs_alt: 240] [gimbal_yaw: -10] [gimbal_pitch: -90] [drone_yaw: 90]\n\n2\n00:00:03,000 --> 00:00:04,000\n[latitude: 49.2] [longitude: 20.2]';
const rows=T.parse(srt,'a.srt');assert.equal(rows[0].camera,350);assert.equal(rows[0].drone,90);assert.equal(rows[0].pitch,-90);assert.equal(rows[0].relative,40);assert.equal(T.sampleAt(rows,1),null);
assert.equal(T.sampleAt(rows,0).absolute,240);
assert.equal(T.row({lat:0,lon:0}).camera,null);assert(T.validGPS(T.row({lat:0,lon:0})));
assert.equal(T.parse('t,latitude,longitude,relativeAltitude,GimbalYaw\n0,49,20,3,120','a.csv')[0].camera,120);
assert.equal(T.parse(JSON.stringify([{'Doc1:SampleTime':0,'Doc1:GimbalYaw':22,'Doc2:SampleTime':2,'Doc2:DroneYaw':90}]),'a.json')[1].camera,null);
assert.throws(()=>T.parse('binary DJI file','a.txt'));
assert.equal(T.parse(JSON.stringify({samples:[{start:0,end:1,lat:49,lon:20,camera:1,drone:2,relative:3}]}),'x.json')[0].relative,3);
const html=fs.readFileSync('lot/index.html','utf8');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(match[1].trim())new vm.Script(match[1]);}
console.log('PASS: telemetry formats, gaps, headings, missing values and HTML script syntax.');
