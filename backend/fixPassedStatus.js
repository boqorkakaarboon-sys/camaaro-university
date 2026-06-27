// fixPassedStatus.js — Dib u xisaabi 'passed' field-ka dhammaan natiijooyinka
// jira, iyadoo lagu salaynayo grade-ka hore ee la xisaabiyay (C+ iyo ka sare = Pass).
// Isticmaal: node fixPassedStatus.js

require('dotenv').config();
const mongoose = require('mongoose');
const Result = require('./models/Result');

const PASSING_GRADES = ['A+', 'A', 'B+', 'B', 'C+'];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const results = await Result.find({ grade: { $ne: 'Pending' } });
    console.log(`📋 ${results.length} natiijo oo grade leh la helay`);

    let changed = 0;
    let unchanged = 0;

    for (const r of results) {
      const correctPassed = PASSING_GRADES.includes(r.grade);
      if (r.passed !== correctPassed) {
        console.log(`  🔄 ${r._id} | Grade: ${r.grade} | Passed: ${r.passed} → ${correctPassed}`);
        r.passed = correctPassed;
        await r.save();
        changed++;
      } else {
        unchanged++;
      }
    }

    console.log('');
    console.log('================================');
    console.log(`  ✅ La sax garaeyay: ${changed}`);
    console.log(`  ⏭  Hore u sax ahaa: ${unchanged}`);
    console.log('================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Khalad ayaa dhacay:', err.message);
    process.exit(1);
  }
};

run();
