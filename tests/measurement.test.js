'use strict';
const assert=require('assert');
const {MeasurementPipeline,interpolateFrame}=require('../src/measurement.js');
const obs={id:'test',fps:25,record_trajectories:false,tracking:{movement_classifier:{type:'frame_displacement_threshold',threshold_mm:1.5,status:'test'}},metric_definitions:{central_zone_fraction:{type:'horizontal_band',center_y_mm:0,half_width_mm:.5}}};
const exp={requested_metrics:['central_zone_fraction','mean_moving_speed','total_distance','time_to_arena_edge','path_straightness','exit_coordinate']};
const p=new MeasurementPipeline(obs,exp,{});
p.observe({time_s:0,ants:[{id:0,x:0,y:0,outcome:null}]});
p.observe({time_s:.04,ants:[{id:0,x:4,y:0,outcome:null}]}); // moving interval
p.observe({time_s:.08,ants:[{id:0,x:3,y:0,outcome:'arena_exit'}]}); // 1 mm interval is below threshold
p.observe({time_s:.12,ants:[{id:0,x:3,y:0,outcome:'arena_exit'}]}); // post-outcome frame must be ignored
const s=p.summary([{id:0,finished:true,outcome:'arena_exit',completedAt:.071,exitX:3,exitY:0,x:3,y:0}]),r=s.ants[0];
assert.strictEqual(r.samples,3);
assert.strictEqual(r.total_frames,3);
assert(Math.abs(r.central_zone_fraction-1)<1e-9,r.central_zone_fraction);
assert(Math.abs(r.all_tracked_distance_mm-5)<1e-9,r.all_tracked_distance_mm);
assert(Math.abs(r.total_distance_mm-4)<1e-9,r.total_distance_mm); // published Traveled_Dist_Moving convention
assert(Math.abs(r.mean_moving_speed_mm_s-100)<1e-9,r.mean_moving_speed_mm_s);
assert(Math.abs(r.path_straightness-.75)<1e-9,r.path_straightness); // Beeline / moving-only distance
assert(Math.abs(r.observed_outcome_frame_time_s-.08)<1e-9,r.observed_outcome_frame_time_s);
assert(Math.abs(r.time_to_arena_edge_s-.12)<1e-9,r.time_to_arena_edge_s); // Total_Frames / 25
assert.strictEqual(s.measurement_status.fps,25);
const interpObs={tracking:{position_noise_mm_sd:0}};
const before=[{id:0,x:0,y:0,heading:0,state:'moving',outcome:null,finished:false,completedAt:null}],after=[{id:0,x:10,y:0,heading:Math.PI/2,state:'moving',outcome:null,finished:false,completedAt:null}],f=interpolateFrame(before,after,0,.05,.04,interpObs,null);assert(Math.abs(f.ants[0].x-8)<1e-9,f.ants[0].x);assert.strictEqual(f.time_s,.04);
const terminal=[{id:0,x:10,y:0,heading:0,state:'finished',outcome:'arena_exit',finished:true,completedAt:.1}],pre=[{id:0,x:0,y:0,heading:0,state:'moving',outcome:null,finished:false,completedAt:null}],f2=interpolateFrame(pre,terminal,0,.2,.08,interpObs,null);assert(Math.abs(f2.ants[0].x-8)<1e-9,f2.ants[0].x);
console.log('measurement.test.js PASS');
