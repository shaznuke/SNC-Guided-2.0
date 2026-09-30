/**
 * Tailored Strength & Conditioning (SNC) Program Data
 * Supports Phase 1 & Phase 2 (Pyramid Loading 15-12-9-6 Reps)
 */

export const PROGRAM_DATA = {
  activeProgramId: "phase2", // Default to Phase 2, toggleable to phase1

  programs: {
    phase1: {
      id: "phase1",
      title: "Phase 1: Foundation & Hypertrophy",
      weeksCount: 6,
      getWeekTarget(weekNum) {
        if (weekNum <= 2) return { reps: 8, holdSec: 30, sets: 3 };
        if (weekNum <= 4) return { reps: 10, holdSec: 35, sets: 3 };
        return { reps: 12, holdSec: 40, sets: 3 };
      },
      days: [
        {
          id: "p1_day1",
          name: "Day 1: Lower / Upper Pull & Push",
          subtitle: "Goblet Squats, Lat Pull Down & BB RDL",
          color: "var(--accent-gold)",
          sections: [
            {
              title: "Warm Up",
              type: "warmup",
              exercises: [
                { id: "p1_d1_w1", name: "Bike / Row / Jump Rope / Cross trainer", sets: 1, reps: "5 mins", rpe: "RPE 4/5" }
              ]
            },
            {
              title: "Mobility",
              type: "mobility",
              exercises: [
                { id: "p1_d1_m1", tutorialUrl: "https://www.youtube.com/watch?v=rKs7WN_67zs", name: "HK Flexor to Adductor rockers", sets: 2, reps: 8 },
                { id: "p1_d1_m2", tutorialUrl: "https://www.youtube.com/watch?v=qovO0ysEpuc", name: "Bench T spine Extension", sets: 2, reps: 8 },
                { id: "p1_d1_m3", tutorialUrl: "https://www.youtube.com/shorts/SxcZ5jfPK9c", name: "Hip 90 - 90 with lateral reaches", sets: 2, reps: 8 },
                { id: "p1_d1_m4", tutorialUrl: "https://www.youtube.com/shorts/07lFW_Ulz6E", name: "Banded shoulder Passthroughs", sets: 2, reps: 8 }
              ]
            },
            {
              title: "Activations",
              type: "activation",
              exercises: [
                { id: "p1_d1_act1", tutorialUrl: "https://www.youtube.com/shorts/a1xnrwNkMkA", name: "Side plank clamshells", sets: 2, reps: 8 },
                { id: "p1_d1_act2", tutorialUrl: "https://www.youtube.com/shorts/fvPS6SOqCA0", name: "Scapular Pull Ups", sets: 2, reps: 8 },
                { id: "p1_d1_a3", tutorialUrl: "https://www.youtube.com/shorts/Bf_41UozCes", name: "Incline Bench W to OH", sets: 2, reps: 8 },
                { id: "p1_d1_a4", tutorialUrl: "https://www.youtube.com/shorts/GqVK-IKtZaU", name: "SL Hip thrust Hold", sets: 2, isHold: true }
              ]
            },
            {
              title: "Mains (Supersets)",
              type: "mains",
              exercises: [
                { id: "p1_d1_a1", tutorialUrl: "https://www.youtube.com/shorts/ILxEPK-Jxb4", name: "A1. Heel Elevated Goblet Squats", superset: "A", supersetRole: "A1", sets: 3, isDynamicReps: true, rpe: "RPE 7/8", tempo: "3 sec Eccentric focus" },
                { id: "p1_d1_a2", tutorialUrl: "https://www.youtube.com/shorts/8WDOFDUTwDo", name: "A2. HK SA Lat Pull Down", superset: "A", supersetRole: "A2", sets: 3, isDynamicReps: true },
                { id: "p1_d1_b1", tutorialUrl: "https://www.youtube.com/shorts/g5u75sgpn04", name: "B1. BB RDL", superset: "B", supersetRole: "B1", sets: 3, isDynamicReps: true },
                { id: "p1_d1_b2", tutorialUrl: "https://www.youtube.com/shorts/lx-49Yjqm-Q", name: "B2. Decline Push Ups", superset: "B", supersetRole: "B2", sets: 3, isDynamicReps: true },
                { id: "p1_d1_c1", tutorialUrl: "https://www.youtube.com/shorts/ENl60YwtzrA", name: "C1. CL DB Split Squats", superset: "C", supersetRole: "C1", sets: 3, isDynamicReps: true },
                { id: "p1_d1_c2", tutorialUrl: "https://www.youtube.com/shorts/o5tbdAYYOHo", name: "C2. Chest Supported Alternate Rows", superset: "C", supersetRole: "C2", sets: 3, isDynamicReps: true }
              ]
            },
            {
              title: "Conditioning",
              type: "conditioning",
              exercises: [
                { id: "p1_d1_cond", name: "Bike Interval Conditioning", sets: 1, reps: "8-10 rounds", tempo: "30s hard / 30s easy", hasIntervalTimer: true }
              ]
            }
          ]
        },
        {
          id: "p1_day2",
          name: "Day 2: Hinge / Upper Push & Core",
          subtitle: "Trap Bar Deadlift, Landmine Press & Step Ups",
          color: "var(--accent-rose)",
          sections: [
            {
              title: "Warm Up",
              type: "warmup",
              exercises: [
                { id: "p1_d2_w1", name: "Bike / Row / Jump Rope / Cross trainer", sets: 1, reps: "5 mins", rpe: "RPE 4/5" }
              ]
            },
            {
              title: "Mobility",
              type: "mobility",
              exercises: [
                { id: "p1_d2_m1", tutorialUrl: "https://www.youtube.com/shorts/5WUZKsyx2PU", name: "Banded Hamstring Kickouts", sets: 2, reps: 8 },
                { id: "p1_d2_m2", tutorialUrl: "https://www.youtube.com/watch?v=_vYL0wvukIM", name: "HK Thoracic Windmill", sets: 2, reps: 8 },
                { id: "p1_d2_m3", tutorialUrl: "https://www.youtube.com/shorts/gUltNrPPE28", name: "KB Wall Ankle Lunge Mobility", sets: 2, reps: 8 },
                { id: "p1_d2_m4", tutorialUrl: "https://www.youtube.com/shorts/20TbtzmkUPA", name: "Crab Reaches", sets: 2, reps: 8 }
              ]
            },
            {
              title: "Activations",
              type: "activation",
              exercises: [
                { id: "p1_d2_act1", tutorialUrl: "https://www.youtube.com/shorts/6ZgtxwShLkI", name: "Serratus Wall slides", sets: 2, reps: 8 },
                { id: "p1_d2_act2", tutorialUrl: "https://www.youtube.com/shorts/YOnrl0Ar6D4", name: "Hamstring walkouts", sets: 2, reps: 8 },
                { id: "p1_d2_a3", tutorialUrl: "https://www.youtube.com/shorts/PTi9pfttH64", name: "Banded shoulder External rotation", sets: 2, reps: 8 },
                { id: "p1_d2_a4", tutorialUrl: "https://www.youtube.com/shorts/Zu4QRhDVXTE", name: "Modified MSL", sets: 2, isHold: true }
              ]
            },
            {
              title: "Mains (Supersets)",
              type: "mains",
              exercises: [
                { id: "p1_d2_a1", tutorialUrl: "https://www.youtube.com/shorts/ZJPZQklCSLs", name: "A1. Trap bar deadlift", superset: "A", supersetRole: "A1", sets: 3, isDynamicReps: true, rpe: "RPE 7/8", tempo: "3 sec Eccentric focus" },
                { id: "p1_d2_a2", tutorialUrl: "https://www.youtube.com/watch?v=aT-iot7UbQA", name: "A2. HK Landmine press", superset: "A", supersetRole: "A2", sets: 3, isDynamicReps: true },
                { id: "p1_d2_b1", tutorialUrl: "https://www.youtube.com/shorts/vN21nlymWUU", name: "B1. DB Step Ups", superset: "B", supersetRole: "B1", sets: 3, isDynamicReps: true },
                { id: "p1_d2_b2", tutorialUrl: "https://www.youtube.com/shorts/Cs2uNF-jW5s", name: "B2. SA DB Chest Press", superset: "B", supersetRole: "B2", sets: 3, isDynamicReps: true },
                { id: "p1_d2_c1", tutorialUrl: "https://www.youtube.com/shorts/xB1lGVzRwWk", name: "C1. Sliders / Swissball Leg curls", superset: "C", supersetRole: "C1", sets: 3, isDynamicReps: true },
                { id: "p1_d2_c2", tutorialUrl: "https://www.youtube.com/shorts/i-c8h4tItRg", name: "C2. Plank to Pike", superset: "C", supersetRole: "C2", sets: 3, isDynamicReps: true }
              ]
            },
            {
              title: "Core / Accessories",
              type: "accessories",
              exercises: [
                { id: "p1_d2_acc1", name: "Sled Push + Farmer's carry", sets: 1, reps: "8-10 rounds (15m)" }
              ]
            }
          ]
        },
        {
          id: "p1_day3",
          name: "Day 3: Hip Thrust & Bodybuilding",
          subtitle: "BB Hip Thrust, TRX Rows & Arm/Shoulder Circuit",
          color: "var(--accent-emerald)",
          sections: [
            {
              title: "Warm Up",
              type: "warmup",
              exercises: [
                { id: "p1_d3_w1", name: "Bike / Row / Jump Rope / Cross trainer", sets: 1, reps: "5 mins", rpe: "RPE 4/5" }
              ]
            },
            {
              title: "Mobility",
              type: "mobility",
              exercises: [
                { id: "p1_d3_m1", tutorialUrl: "https://www.youtube.com/shorts/5P9G2Jood0Q", name: "Adductor Rockers T spine rotation", sets: 2, reps: 8 },
                { id: "p1_d3_m2", tutorialUrl: "https://www.youtube.com/shorts/wp_4zll6x1A", name: "Walking Inchworms", sets: 2, reps: 8 },
                { id: "p1_d3_m3", tutorialUrl: "https://www.youtube.com/shorts/iuR17xUXLeA", name: "Bear crawl", sets: 2, reps: 8 }
              ]
            },
            {
              title: "Activations",
              type: "activation",
              exercises: [
                { id: "p1_d3_act1", tutorialUrl: "https://www.youtube.com/shorts/Jv9HLFbNlQs", name: "SL MB Reaches", sets: 2, reps: 6 },
                { id: "p1_d3_act2", tutorialUrl: "https://www.youtube.com/shorts/-H4duASwnBs", name: "Wall Cuban Press", sets: 2, reps: 8 },
                { id: "p1_d3_a3", tutorialUrl: "https://www.youtube.com/shorts/75f1dbLa_Rw", name: "PSL", sets: 2, isHold: true }
              ]
            },
            {
              title: "Mains (Supersets)",
              type: "mains",
              exercises: [
                { id: "p1_d3_a1", tutorialUrl: "https://www.youtube.com/shorts/mLHwDiVody0", name: "A1. BB Hip Thrust", superset: "A", supersetRole: "A1", sets: 3, isDynamicReps: true, rpe: "RPE 7/8", tempo: "3 sec Eccentric focus" },
                { id: "p1_d3_a2", tutorialUrl: "https://www.youtube.com/watch?v=IEky4NL3LLQ", name: "A2. TRX rows", superset: "A", supersetRole: "A2", sets: 3, isDynamicReps: true },
                { id: "p1_d3_b1", tutorialUrl: "https://www.youtube.com/shorts/iIkibQoGsZk", name: "B1. Lateral Squats", superset: "B", supersetRole: "B1", sets: 3, isDynamicReps: true },
                { id: "p1_d3_b2", tutorialUrl: "https://www.youtube.com/shorts/nvLE3a4hAtg", name: "B2. Chek Press", superset: "B", supersetRole: "B2", sets: 3, isDynamicReps: true },
                { id: "p1_d3_c1", tutorialUrl: "https://www.youtube.com/shorts/bKicsGseoAc", name: "C1. Goblet Reverse Lunges", superset: "C", supersetRole: "C1", sets: 3, isDynamicReps: true },
                { id: "p1_d3_c2", tutorialUrl: "https://www.youtube.com/shorts/I-Ue34qLxc4", name: "C2. Incline bench / cable machine Pec Flys", superset: "C", supersetRole: "C2", sets: 3, isDynamicReps: true }
              ]
            },
            {
              title: "Bodybuilding Circuit",
              type: "circuit",
              exercises: [
                { id: "p1_d3_bb1", tutorialUrl: "https://www.youtube.com/shorts/PuaJzTatIJM", name: "Bicep curls", sets: 2, reps: 12 },
                { id: "p1_d3_bb2", tutorialUrl: "https://www.youtube.com/shorts/9Ark9S11uXw", name: "OH Triceps extension", sets: 2, reps: 12 },
                { id: "p1_d3_bb3", tutorialUrl: "https://www.youtube.com/shorts/Sw-KEbOilIc", name: "Rear delt flys", sets: 2, reps: 12 },
                { id: "p1_d3_bb4", tutorialUrl: "https://www.youtube.com/shorts/g-tMq_BQ2i8", name: "Front to lateral raises", sets: 2, reps: 12 },
                { id: "p1_d3_bb5", tutorialUrl: "https://www.youtube.com/shorts/nTUKizCDMmA", name: "Standing calf raises", sets: 2, reps: 12 },
                { id: "p1_d3_bb6", tutorialUrl: "https://www.youtube.com/shorts/HliiXSj2aIE", name: "Ant tib raises", sets: 2, reps: 12 }
              ]
            }
          ]
        }
      ]
    },

    phase2: {
      id: "phase2",
      title: "Phase 2: Pyramid Loading & Strength Peak",
      weeksCount: 6,
      getWeekTarget(weekNum) {
        return { reps: [15, 12, 9, 6], holdSec: 45, sets: 4, note: "Pyramid sets: 15, 12, 9, 6 reps. Add load week-on-week." };
      },
      days: [
        {
          id: "p2_day1",
          name: "Day 1: Split Squats & Sumo Deadlift",
          subtitle: "Bulgarian Split Squat, SA Rows, Sumo Deadlift & Incline Press",
          color: "var(--accent-gold)",
          sections: [
            {
              title: "Warm Up",
              type: "warmup",
              exercises: [
                { id: "p2_d1_w1", name: "Bike / Row / Jump Rope / Cross trainer", sets: 1, reps: "5 mins", rpe: "RPE 4/5" }
              ]
            },
            {
              title: "Mobility",
              type: "mobility",
              exercises: [
                { id: "p2_d1_m1", tutorialUrl: "https://www.youtube.com/shorts/-OCzv7CghjU", name: "Banded Pec stretch", sets: 1, reps: "30 sec ES", comments: "Each side stretch" },
                { id: "p2_d1_m2", tutorialUrl: "https://www.youtube.com/shorts/ecy6Q91wOgw", name: "Band Assisted T spine rotation", sets: 1, reps: "12 ES" },
                { id: "p2_d1_m3", tutorialUrl: "https://www.youtube.com/shorts/LW2_Vz_F6Gs", name: "Banded Couch stretch w/ side bend", sets: 1, reps: "12 ES" },
                { id: "p2_d1_m4", tutorialUrl: "https://www.youtube.com/shorts/8WYWg3YlvZk", name: "Banded Pigeon rockers", sets: 1, reps: "12 ES" }
              ]
            },
            {
              title: "Activations",
              type: "activation",
              exercises: [
                { id: "p2_d1_a1", tutorialUrl: "https://www.youtube.com/shorts/nvqVvNirz6Q", name: "Wall Fire hydrants", sets: 2, reps: 8 },
                { id: "p2_d1_a2", tutorialUrl: "https://www.youtube.com/shorts/GWoVyShbiGo", name: "Banded W to OH Raises", sets: 2, reps: 8 },
                { id: "p2_d1_a3", tutorialUrl: "https://www.youtube.com/shorts/i8abjtZdJc8", name: "Adductor ball squeeze hamstring bridge", sets: 2, reps: "45 sec" }
              ]
            },
            {
              title: "Mains (Pyramid Sets)",
              type: "mains",
              exercises: [
                { id: "p2_d1_main_a1", tutorialUrl: "https://www.youtube.com/shorts/VLyt8xraMLA", name: "A1. DB Bulgarian Split Squats", sets: 4, pyramidReps: [15, 12, 9, 6], rpe: "RPE 7/8", tempo: "3 sec Eccentric focus", comments: "Finish A1 before moving to B1. Add load week-on-week." },
                { id: "p2_d1_main_b1", tutorialUrl: "https://www.youtube.com/watch?v=Rvbmu8-Fw1w", name: "B1. SA DB Bent Over Rows", sets: 4, pyramidReps: [15, 12, 9, 6], tempo: "3 sec Eccentric focus", comments: "Progress weight per set" },
                { id: "p2_d1_main_c1", tutorialUrl: "https://www.youtube.com/shorts/k_jHUVBU-T0", name: "C1. BB Sumo Deadlift", sets: 4, pyramidReps: [15, 12, 9, 6], tempo: "3 sec Eccentric focus", comments: "Heavy hip hinge drive" },
                { id: "p2_d1_main_d1", tutorialUrl: "https://www.youtube.com/watch?v=lJ2o89kcnxY", name: "D1. Incline BB Bench Press", sets: 4, pyramidReps: [15, 12, 9, 6], tempo: "3 sec Eccentric focus", comments: "Upper chest focus" }
              ]
            },
            {
              title: "Accessories",
              type: "accessories",
              exercises: [
                { id: "p2_d1_acc1", tutorialUrl: "https://www.youtube.com/shorts/mLDpkStIrCM", name: "Tall Plank KB Drags", sets: 2, reps: 8 },
                { id: "p2_d1_acc2", name: "Toes In - Out Calf Raises", sets: 2, reps: 8 },
                { id: "p2_d1_acc3", tutorialUrl: "https://www.youtube.com/shorts/xvw_r7VZ2S8", name: "Hanging Wipers", sets: 2, reps: 8 },
                { id: "p2_d1_acc4", tutorialUrl: "https://www.youtube.com/shorts/QEIcs7weXws", name: "Bench Dips", sets: 2, reps: 8 }
              ]
            }
          ]
        },
        {
          id: "p2_day2",
          name: "Day 2: Box Squats & Deadlifts",
          subtitle: "BB Box Squats, Lat Pull Down, Conventional Deadlift & Shoulder Press",
          color: "var(--accent-rose)",
          sections: [
            {
              title: "Warm Up",
              type: "warmup",
              exercises: [
                { id: "p2_d2_w1", name: "Bike / Row / Jump Rope / Cross trainer", sets: 1, reps: "5 mins", rpe: "RPE 4/5" }
              ]
            },
            {
              title: "Mobility",
              type: "mobility",
              exercises: [
                { id: "p2_d2_m1", tutorialUrl: "https://www.youtube.com/shorts/1L0PB5KrIt8", name: "Banded Lats Stretch", sets: 1, reps: "30 sec ES" },
                { id: "p2_d2_m2", tutorialUrl: "https://www.youtube.com/watch?v=gWl2ZEsjivE", name: "Band distracted Hip IR - ER", sets: 1, reps: "12 ES" },
                { id: "p2_d2_m3", tutorialUrl: "https://www.youtube.com/shorts/xHkR0NEfr6E", name: "KB FR T-Spine Extension", sets: 1, reps: 12 },
                { id: "p2_d2_m4", tutorialUrl: "https://www.youtube.com/shorts/uDiAWRzgP98", name: "HK Banded Adductor rockers", sets: 1, reps: "12 ES" }
              ]
            },
            {
              title: "Activations",
              type: "activation",
              exercises: [
                { id: "p2_d2_a1", tutorialUrl: "https://www.youtube.com/shorts/SPcgUTrxaKg", name: "Modified MSL Drops", sets: 2, reps: 8 },
                { id: "p2_d2_a2", tutorialUrl: "https://www.youtube.com/shorts/nMbK51terrw", name: "Incline Bench Y's & T's", sets: 2, reps: 8 },
                { id: "p2_d2_a3", tutorialUrl: "https://www.youtube.com/shorts/Gv5LpK4WWlY", name: "Banded Bear Plank Scap Push Ups", sets: 2, reps: 8 }
              ]
            },
            {
              title: "Mains (Pyramid Sets)",
              type: "mains",
              exercises: [
                { id: "p2_d2_main_a1", tutorialUrl: "https://www.youtube.com/shorts/6_xQf5A3WmE", name: "A1. BB Box Squats", sets: 4, pyramidReps: [15, 12, 9, 6], rpe: "RPE 7/8", tempo: "3 sec Eccentric focus", comments: "Sit back on box, explosive drive up." },
                { id: "p2_d2_main_b1", tutorialUrl: "https://www.youtube.com/shorts/cnhqUfduFoE", name: "B1. Lat Pull Down", sets: 4, pyramidReps: [15, 12, 9, 6], comments: "Full lat contraction" },
                { id: "p2_d2_main_c1", tutorialUrl: "https://www.youtube.com/shorts/57dg94gYDI0", name: "C1. Conventional Deadlift", sets: 4, pyramidReps: [15, 12, 9, 6], comments: "Brace core, drag bar up shins" },
                { id: "p2_d2_main_d1", tutorialUrl: "https://www.youtube.com/shorts/-lqkH31Hs10", name: "D1. Seated DB Shoulder Press", sets: 4, pyramidReps: [15, 12, 9, 6], comments: "Controlled vertical overhead press" }
              ]
            },
            {
              title: "Core / Accessories",
              type: "accessories",
              exercises: [
                { id: "p2_d2_acc1", tutorialUrl: "https://www.youtube.com/shorts/pXuPKC9URsc", name: "Hollow Body Rockers", sets: 2, reps: 8 },
                { id: "p2_d2_acc2", tutorialUrl: "https://www.youtube.com/shorts/ZG2n5IcYIcY", name: "BB Reverse Curls", sets: 2, reps: 8 },
                { id: "p2_d2_acc3", tutorialUrl: "https://www.youtube.com/shorts/Rl_MsU1yI44", name: "KB Side Bends", sets: 2, reps: 8 },
                { id: "p2_d2_acc4", tutorialUrl: "https://www.youtube.com/shorts/8hunv92MCDs", name: "SM SL Calf Raises", sets: 2, reps: 8 }
              ]
            }
          ]
        },
        {
          id: "p2_day3",
          name: "Day 3: Conditioning Circuit & Arms",
          subtitle: "Pull Ups, Weighted Push-ups, Hip Thrusts & Ring Rows Circuit",
          color: "var(--accent-emerald)",
          sections: [
            {
              title: "Warm Up",
              type: "warmup",
              exercises: [
                { id: "p2_d3_w1", name: "Bike / Row / Jump Rope / Cross trainer", sets: 1, reps: "5 mins", rpe: "RPE 4/5" }
              ]
            },
            {
              title: "Mobility",
              type: "mobility",
              exercises: [
                { id: "p2_d3_m1", tutorialUrl: "https://www.youtube.com/shorts/dvO-PPQoN8o", name: "Banded WGS with rotation", sets: 2, reps: 8 },
                { id: "p2_d3_m2", tutorialUrl: "https://www.youtube.com/shorts/pGWFrvH9nS8", name: "Deep Squat Ankle rockers", sets: 2, reps: 8 },
                { id: "p2_d3_m3", tutorialUrl: "https://www.youtube.com/shorts/L-TlgoZ9MgA", name: "Banded shoulder Distraction", sets: 2, reps: 8 }
              ]
            },
            {
              title: "Activations",
              type: "activation",
              exercises: [
                { id: "p2_d3_a1", tutorialUrl: "https://www.youtube.com/watch?v=cRNXqgwzo6g", name: "HK Inverted KB Push Outs", sets: 2, reps: 8 },
                { id: "p2_d3_a2", tutorialUrl: "https://www.youtube.com/shorts/bQFNUh8dK8Y", name: "Band distracted step downs", sets: 2, reps: 8 },
                { id: "p2_d3_a3", tutorialUrl: "https://www.youtube.com/shorts/Tnw13gu87Vk", name: "LSL", sets: 2, reps: "30 sec" }
              ]
            },
            {
              title: "Mains (Conditioning Circuit)",
              type: "mains",
              exercises: [
                { id: "p2_d3_c1", tutorialUrl: "https://www.youtube.com/shorts/NevBKwfE9Vo", name: "Pull Ups / Assisted", sets: 3, reps: 20, rpe: "RPE 7/8", comments: "Perform as conditioning circuit. 3 sec eccentric." },
                { id: "p2_d3_c2", tutorialUrl: "https://www.youtube.com/shorts/r2Qc80pMrM8", name: "DB slider lateral lunges", sets: 3, reps: "15 ES" },
                { id: "p2_d3_c3", tutorialUrl: "https://www.youtube.com/shorts/S8vKLVThWmA", name: "Weighted Push Ups", sets: 3, reps: 20 },
                { id: "p2_d3_c4", tutorialUrl: "https://www.youtube.com/shorts/U7v1KcejfJM", name: "SL DB Hip Thrust", sets: 3, reps: "15 ES" },
                { id: "p2_d3_c5", tutorialUrl: "https://www.youtube.com/shorts/Z1LPTxY2c4E", name: "Ring Inverted Rows", sets: 3, reps: 20 },
                { id: "p2_d3_c6", tutorialUrl: "https://www.youtube.com/shorts/hw8UTyDcrWI", name: "DB Step Ups", sets: 3, reps: "15 ES" }
              ]
            },
            {
              title: "Core & Accessories",
              type: "accessories",
              exercises: [
                { id: "p2_d3_acc1", tutorialUrl: "https://www.youtube.com/shorts/HurmGkvE5s0", name: "DB Skull crusher", sets: 2, reps: 8 },
                { id: "p2_d3_acc2", tutorialUrl: "https://www.youtube.com/shorts/vm0zV_WQerE", name: "DB Hammer Curl", sets: 2, reps: 8 },
                { id: "p2_d3_acc3", tutorialUrl: "https://www.youtube.com/shorts/EfeVvA1vdd4", name: "Lying / Seated Hamstring Curl", sets: 2, reps: 8 },
                { id: "p2_d3_acc4", tutorialUrl: "https://www.youtube.com/shorts/uM86QE59Tgc", name: "Leg Extension", sets: 2, reps: 8 }
              ]
            }
          ]
        }
      ]
    }
  },

  getActiveProgram() {
    const savedId = localStorage.getItem("snc_active_program_id") || this.activeProgramId;
    return this.programs[savedId] || this.programs.phase2;
  },

  setActiveProgram(programId) {
    if (this.programs[programId]) {
      this.activeProgramId = programId;
      localStorage.setItem("snc_active_program_id", programId);
    }
  }
};
